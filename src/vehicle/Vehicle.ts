import RAPIER from '@dimforge/rapier3d-compat';
import {
    Object3D, Scene, Vector3, Quaternion,
} from 'three';

import cfg from '../config';
import { PhysicsWorld, wheelQueryInteractionGroups } from '../physics/rapierRuntime';
import { setMaterials } from './materials';
import { VehicleState, initStateHandler } from './stateHandler';

const translateAxis = new Vector3(0, 0, 1);
const meshOffset_z = 0.6;

const {
    torqueSplitRatio,
    maxEngineForce,
    maxBrakeForce,
    maxSteeringAngle,
    steeringSpeed,
    wheelRadius,
    wheelSuspensionRestLength,
    wheelSuspensionStiffness,
    wheelMaxSuspensionTravel,
    wheelMaxSuspensionForce,
    wheelDampingCompression,
    wheelDampingRelaxation,
    wheelFrictionSlip,
    wheelForwardAcceleration,
    wheelSidedAcceleration,
    wheelRollInfluence,
} = cfg.vehicle;

const brakeLightBrightness = 0.1;

const frontRightWheelIndex = 0;
const frontLeftWheelIndex = 1;
const rearRightWheelIndex = 2;
const rearLeftWheelIndex = 3;
const rearWheelIndices = new Set([rearRightWheelIndex, rearLeftWheelIndex]);
const [torqueSplitFront, torqueSplitRear] = torqueSplitRatio;
const defaultTorqueDistribution = [
    torqueSplitFront / 2, torqueSplitFront / 2,
    torqueSplitRear / 2, torqueSplitRear / 2,
];
const torqueDistribution = [...defaultTorqueDistribution];

export interface VehicleWheelInfo {
    radius: number;
    suspensionRestLength: number;
    suspensionStiffness: number;
    maxSuspensionTravel: number;
    maxSuspensionForce: number;
    dampingCompression: number;
    dampingRelaxation: number;
    forwardAcceleration: number;
    sideAcceleration: number;
    rollInfluence: number;
    axleLocal: Vector3;
    directionLocal: Vector3;
    chassisConnectionPointLocal: Vector3;
    steering: number;
    brake: number;
    engineForce: number;
    sliding: boolean;
    isInContact: boolean;
    rotation?: number;
}

interface VehicleBase {
    wheelInfos: VehicleWheelInfo[];
    currentVehicleSpeedKmHour: number;
}

const upAxis = new Vector3(0, 1, 0);
const wheelSteeringQuat = new Quaternion();
const wheelRotationQuat = new Quaternion();

export default class Vehicle {
    base: VehicleBase;
    chassisBody: RAPIER.RigidBody;
    vehicleController: RAPIER.DynamicRayCastVehicleController;
    chassisMesh: Object3D;
    wheelMeshes: Object3D[];
    state: VehicleState;
    initialPosition = new Vector3();
    initialRotation = new Quaternion();
    currentSteeringAngle = 0;
    trackWidth = 0;
    wheelBase = 0;
    materials: ReturnType<typeof setMaterials>;
    private world: PhysicsWorld;

    constructor(chassisMesh: Object3D, wheelMesh: Object3D) {
        const wheelInfos: VehicleWheelInfo[] = [];

        const wheelConfig = {
            radius: wheelRadius,
            suspensionRestLength: wheelSuspensionRestLength,
            suspensionStiffness: wheelSuspensionStiffness,
            maxSuspensionTravel: wheelMaxSuspensionTravel,
            maxSuspensionForce: wheelMaxSuspensionForce,
            dampingCompression: wheelDampingCompression,
            dampingRelaxation: wheelDampingRelaxation,
            forwardAcceleration: wheelForwardAcceleration,
            sideAcceleration: wheelSidedAcceleration,
            rollInfluence: wheelRollInfluence,
            axleLocal: new Vector3(-1, 0, 0),
            directionLocal: new Vector3(0, -1, 0),
            chassisConnectionPointLocal: new Vector3(),
        };
        const height = 0.3;
        const halfTrackWidth = 0.85;
        this.trackWidth = halfTrackWidth * 2;
        this.wheelBase = 1.2 + 1.4;

        wheelConfig.chassisConnectionPointLocal = new Vector3(halfTrackWidth, -height, -1.2);
        wheelInfos.push(createWheelInfo(wheelConfig));
        wheelConfig.chassisConnectionPointLocal = new Vector3(-halfTrackWidth, -height, -1.2);
        wheelInfos.push(createWheelInfo(wheelConfig));
        wheelConfig.chassisConnectionPointLocal = new Vector3(halfTrackWidth, -height, 1.4);
        wheelInfos.push(createWheelInfo(wheelConfig));
        wheelConfig.chassisConnectionPointLocal = new Vector3(-halfTrackWidth, -height, 1.4);
        wheelInfos.push(createWheelInfo(wheelConfig));

        this.base = {
            wheelInfos,
            currentVehicleSpeedKmHour: 0,
        };

        this.materials = setMaterials(wheelMesh, chassisMesh);
        const wheelMeshes = {
            front_r: wheelMesh,
            front_l: wheelMesh.clone(),
            rear_r: wheelMesh.clone(),
            rear_l: wheelMesh.clone(),
        };

        const axes = ['x', 'y', 'z'] as const;
        Object.keys(wheelMeshes).forEach((wheelId: keyof typeof wheelMeshes, i) => {
            const wheelInfo = wheelInfos[i];
            const mesh = wheelMeshes[wheelId];

            if (wheelId.endsWith('_l')) {
                axes.forEach((axis) => {
                    mesh.scale[axis] *= -1;
                });
            }

            chassisMesh.add(mesh);

            mesh.position.copy(wheelInfo.chassisConnectionPointLocal);
            mesh.position.z -= meshOffset_z;
        });

        this.wheelMeshes = [wheelMeshes.front_r, wheelMeshes.front_l, wheelMeshes.rear_r, wheelMeshes.rear_l];
        this.chassisMesh = chassisMesh;

        this.state = initStateHandler(this);
    }

    addToWorld(world: PhysicsWorld) {
        this.world = world;

        const chassisDesc = RAPIER.RigidBodyDesc.dynamic()
            .setAdditionalMass(cfg.vehicle.mass)
            .setCanSleep(false);
        this.chassisBody = this.world.addRigidBody(chassisDesc);

        const chassisBase = RAPIER.ColliderDesc.cuboid(0.9, 0.4, 2.1)
            .setTranslation(0, 0, 0.1)
            .setFriction(0.001);
        const chassisTop = RAPIER.ColliderDesc.cuboid(0.9, 0.4, 1.2)
            .setTranslation(0, 0.8, 0.8)
            .setFriction(0.001);
        this.world.setBodyColliders(this.chassisBody, [chassisBase, chassisTop]);

        this.vehicleController = this.world.raw.createVehicleController(this.chassisBody);

        for (let i = 0; i < this.base.wheelInfos.length; i++) {
            const wheelInfo = this.base.wheelInfos[i];
            this.vehicleController.addWheel(
                wheelInfo.chassisConnectionPointLocal,
                wheelInfo.directionLocal,
                wheelInfo.axleLocal,
                wheelInfo.suspensionRestLength,
                wheelInfo.radius,
            );
            this.vehicleController.setWheelSuspensionStiffness(i, wheelInfo.suspensionStiffness);
            this.vehicleController.setWheelMaxSuspensionTravel(i, wheelInfo.maxSuspensionTravel);
            this.vehicleController.setWheelMaxSuspensionForce(i, Math.min(wheelInfo.maxSuspensionForce, 300));
            this.vehicleController.setWheelSuspensionCompression(i, wheelInfo.dampingCompression);
            this.vehicleController.setWheelSuspensionRelaxation(i, wheelInfo.dampingRelaxation);
            this.vehicleController.setWheelFrictionSlip(i, wheelFrictionSlip);
            this.vehicleController.setWheelSideFrictionStiffness(i, wheelInfo.sideAcceleration);
        }

        this.world.addEventListener('preStep', this.beforeStep);
        this.world.addEventListener('postStep', this.update);

        return this;
    }

    addToScene(scene: Scene) {
        scene.add(this.chassisMesh);

        return this;
    }

    private beforeStep = (dt = 1 / 60) => {
        if (!this.chassisBody || !this.vehicleController) {
            return;
        }

        this.steerWheels();

        const { wheelInfos } = this.base;
        for (let i = 0; i < wheelInfos.length; i++) {
            wheelInfos[i].engineForce = this.state.engineForce * torqueDistribution[i] * 0.01 * -1;
            this.vehicleController.setWheelEngineForce(i, wheelInfos[i].engineForce);
            this.vehicleController.setWheelBrake(i, wheelInfos[i].brake);
            this.vehicleController.setWheelSteering(i, wheelInfos[i].steering);
        }

        this.vehicleController.updateVehicle(
            dt,
            undefined,
            wheelQueryInteractionGroups,
        );
        this.base.currentVehicleSpeedKmHour = this.vehicleController.currentVehicleSpeed() * 3.6;
    }

    private update = () => {
        if (!this.chassisBody || !this.vehicleController) {
            return;
        }

        const q = this.chassisBody.rotation();

        this.updateWheels();

        this.chassisMesh.position.copy(this.chassisBody.translation());
        this.chassisMesh.quaternion.set(q.x, q.y, q.z, q.w);
        this.chassisMesh.translateOnAxis(translateAxis, meshOffset_z);
    }

    private updateWheels() {
        for (let i = 0; i < this.base.wheelInfos.length; i++) {
            const wheelInfo = this.base.wheelInfos[i];

            const wheelAxleCs = this.vehicleController.wheelAxleCs(i);
            const wheelRotation = this.vehicleController.wheelRotation(i);
            const connectionY = this.vehicleController.wheelChassisConnectionPointCs(i).y ?? 0;
            const suspensionLength = this.vehicleController.wheelSuspensionLength(i) ?? 0;
            const steering = this.vehicleController.wheelSteering(i) ?? 0;
            const sideImpulse = Math.abs(this.vehicleController.wheelSideImpulse(i) ?? 0);

            this.wheelMeshes[i].position.setY(connectionY - suspensionLength);

            wheelSteeringQuat.setFromAxisAngle(upAxis, steering);
            wheelRotationQuat.setFromAxisAngle(wheelInfo.axleLocal, wheelRotation);

            this.wheelMeshes[i].quaternion.multiplyQuaternions(wheelSteeringQuat, wheelRotationQuat);

            wheelInfo.rotation = wheelRotation;
            wheelInfo.steering = steering;
            wheelInfo.isInContact = this.vehicleController.wheelIsInContact(i);
            wheelInfo.sliding = sideImpulse > 1;
        }
    }

    setEngineForceDirection(engineForceDirection: -1|0|1) {
        this.state.engineForce = maxEngineForce * engineForceDirection;

        if (engineForceDirection === -1) {
            this.state.engineForce *= 0.9;
            this.materials.tailLightMaterial.emissive.setHSL(0, 0, brakeLightBrightness);
        } else {
            this.materials.tailLightMaterial.emissive.setHSL(0, 0, 0);
        }
    }

    setBrakeForce(brakeForceFactor: 0|1) {
        this.state.brakeForce = maxBrakeForce * brakeForceFactor;
        rearWheelIndices.forEach(this.brakeWheel);
    }

    private brakeWheel = (wheelIndex: number) => {
        this.base.wheelInfos[wheelIndex].brake = this.state.brakeForce;
    }

    setSteeringDirection(steeringDirection: -1|0|1) {
        this.state.steeringAngle = maxSteeringAngle * steeringDirection;
    }

    private steerWheels = () => {
        const { currentSteeringAngle } = this;
        const { steeringAngle: targetSteeringAngle } = this.state;
        let steeringAngle = 0;

        if (currentSteeringAngle < targetSteeringAngle) {
            steeringAngle = Math.min(targetSteeringAngle, currentSteeringAngle + steeringSpeed);
        } else if (currentSteeringAngle > targetSteeringAngle) {
            steeringAngle = Math.max(targetSteeringAngle, currentSteeringAngle - steeringSpeed);
        } else {
            return;
        }
        /**
         * Ackermann steering
         * https://www.xarg.org/book/kinematics/ackerman-steering/
         */
        const { wheelBase, trackWidth } = this;
        const wheelBase_x2 = wheelBase * 2;
        const steeringAngle_sin = Math.sin(steeringAngle);
        const steeringAngle_cos = Math.cos(steeringAngle);

        const steeringAngleLeft = Math.atan(
            (wheelBase_x2 * steeringAngle_sin) / (wheelBase_x2 * steeringAngle_cos - trackWidth * steeringAngle_sin),
        );
        const steeringAngleRight = Math.atan(
            (wheelBase_x2 * steeringAngle_sin) / (wheelBase_x2 * steeringAngle_cos + trackWidth * steeringAngle_sin),
        );
        this.base.wheelInfos[frontLeftWheelIndex].steering = steeringAngleLeft;
        this.base.wheelInfos[frontRightWheelIndex].steering = steeringAngleRight;
        this.currentSteeringAngle = steeringAngle;
    }

    resetPosition() {
        if (!this.chassisBody) {
            return;
        }

        this.chassisBody.setTranslation(this.initialPosition, true);
        this.chassisBody.setRotation(this.initialRotation, true);
        this.chassisBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.chassisBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

        this.currentSteeringAngle = 0;
        this.state.engineForce = 0;
        this.state.brakeForce = 0;
        this.state.steeringAngle = 0;

        this.base.wheelInfos.forEach((wheelInfo) => {
            wheelInfo.engineForce = 0;
            wheelInfo.brake = 0;
            wheelInfo.steering = 0;
        });

        if (this.vehicleController) {
            for (let i = 0; i < this.base.wheelInfos.length; i++) {
                this.vehicleController.setWheelEngineForce(i, 0);
                this.vehicleController.setWheelBrake(i, 0);
                this.vehicleController.setWheelSteering(i, 0);
            }
        }
    }

    wheelHasGrip = (wheelIndex: number) => (
        this.base.wheelInfos[wheelIndex].isInContact && !this.base.wheelInfos[wheelIndex].sliding
    )
}

function createWheelInfo(
    config: Omit<
    VehicleWheelInfo,
    'steering' | 'brake' | 'engineForce' | 'sliding' | 'isInContact' | 'worldPosition' | 'worldQuaternion'
    >,
): VehicleWheelInfo {
    return {
        ...config,
        axleLocal: config.axleLocal.clone(),
        directionLocal: config.directionLocal.clone(),
        chassisConnectionPointLocal: config.chassisConnectionPointLocal.clone(),
        steering: 0,
        brake: 0,
        engineForce: 0,
        sliding: false,
        isInContact: true,
    };
}
