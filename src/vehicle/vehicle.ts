import { Body, Box, Cylinder, Quaternion, RaycastVehicle, Transform, Vec3, World } from 'cannon-es';
import { Object3D, Scene, Vector3 } from 'three';

import cfg from '../config';
import { setMaterials } from './materials';
import { VehicleState, initStateHandler } from './stateHandler';

const translateAxis = new Vector3(0, 0, 1);

let tmp_transform: Transform;
let tmp_wheelBody: Body;

const frontWheelIndices = new Set([0, 1]);
const rearWheelIndices = new Set([2, 3]);

const { renderWireFrame } = cfg;
const {
    maxEngineForce,
    maxBrakeForce,
    maxSteeringValue,
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

export default class Vehicle {
    base: RaycastVehicle;
    chassisBody: Body;
    chassisMesh: Object3D;
    wheelBodies: Body[];
    wheelMeshes: Object3D[];
    state: VehicleState;
    initialPosition = new Vec3();
    initialRotation = new Quaternion();

    constructor(chassisMesh: Object3D, wheelMesh: Object3D) {
        const chassisBaseShape = new Box(new Vec3(0.9, 0.4, 2.1));
        const chassisTopShape = new Box(new Vec3(0.9, 0.4, 1.2));

        this.chassisBody = new Body({ mass: cfg.vehicle.mass });
        this.chassisBody
            .addShape(chassisBaseShape, new Vec3(0, 0, 0.1))
            .addShape(chassisTopShape, new Vec3(0, 0.8, 0.8));

        this.base = new RaycastVehicle({
            chassisBody: this.chassisBody,
            indexForwardAxis: 2,
            indexRightAxis: 0,
            indexUpAxis: 1,
        });
        const wheelConfig = {
            radius: wheelRadius,
            suspensionRestLength: wheelSuspensionRestLength,
            suspensionStiffness: wheelSuspensionStiffness,
            maxSuspensionTravel: wheelMaxSuspensionTravel,
            maxSuspensionForce: wheelMaxSuspensionForce,
            dampingCompression: wheelDampingCompression,
            dampingRelaxation: wheelDampingRelaxation,
            frictionSlip: wheelFrictionSlip,
            forwardAcceleration: wheelForwardAcceleration,
            sideAcceleration: wheelSidedAcceleration,
            rollInfluence: wheelRollInfluence,
            axleLocal: new Vec3(-1, 0, 0),
            directionLocal: new Vec3(0, -1, 0),
            chassisConnectionPointLocal: new Vec3(),
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true,
        };
        const height = 0.3;
        const trackWidth = 0.85;
        // front right
        wheelConfig.chassisConnectionPointLocal.set(trackWidth, -height, -1.2);
        this.base.addWheel(wheelConfig);
        // front left
        wheelConfig.chassisConnectionPointLocal.set(-trackWidth, -height, -1.2);
        this.base.addWheel(wheelConfig);
        // rear right
        wheelConfig.chassisConnectionPointLocal.set(trackWidth, -height, 1.4);
        this.base.addWheel(wheelConfig);
        // rear left
        wheelConfig.chassisConnectionPointLocal.set(-trackWidth, -height, 1.4);
        this.base.addWheel(wheelConfig);

        const wheelOrientation = new Quaternion();
        wheelOrientation.setFromAxisAngle(new Vec3(0, 0, 1), Math.PI / 2);

        if (renderWireFrame) {
            this.wheelBodies = this.base.wheelInfos.map((wheel) => {
                const wheelShape = new Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 8);
                const wheelBody = new Body({
                    type: Body.KINEMATIC,
                    collisionFilterGroup: 0, // turn off collisions
                });
                wheelBody.addShape(wheelShape, Vec3.ZERO, wheelOrientation);

                return wheelBody;
            });
        }

        setMaterials(wheelMesh, chassisMesh);
        const wheelMeshes = {
            front_r: wheelMesh,
            front_l: wheelMesh.clone(),
            rear_r: wheelMesh.clone(),
            rear_l: wheelMesh.clone(),
        };
        // mirror meshes suffixed with '_r'
        const axes = ['x', 'y', 'z'];
        Object.keys(wheelMeshes).forEach((wheelId) => {
            if (wheelId.endsWith('_r')) {
                axes.forEach((axis) => {
                    wheelMeshes[wheelId].scale[axis] *= -1;
                });
            }
        });
        this.wheelMeshes = [wheelMeshes.front_l, wheelMeshes.front_r, wheelMeshes.rear_l, wheelMeshes.rear_r];
        this.chassisMesh = chassisMesh;

        this.state = initStateHandler(this);
    }

    addToWorld(world: World) {
        this.base.addToWorld(world);
        if (renderWireFrame) {
            this.wheelBodies.forEach((wheelBody) => world.addBody(wheelBody));
        }

        world.addEventListener('postStep', this.update);

        return this;
    }

    addToScene(scene: Scene) {
        this.wheelMeshes.forEach((wheelMesh) => {
            scene.add(wheelMesh);
        });
        scene.add(this.chassisMesh);

        return this;
    }

    private update = () => {
        // const { currentVehicleSpeedKmHour: speed } = this.base;
        // ToDo shift // spd 45
        for (let i = 0; i < this.base.wheelInfos.length; i++) {
            if (frontWheelIndices.has(i)) {
                this.steerWheel(i);
            }

            this.base.updateWheelTransform(i);

            tmp_transform = this.base.wheelInfos[i].worldTransform;
            this.wheelMeshes[i].position.copy(tmp_transform.position as unknown as Vector3);
            this.wheelMeshes[i].quaternion.copy(tmp_transform.quaternion as unknown as THREE.Quaternion);

            if (renderWireFrame) {
                tmp_wheelBody = this.wheelBodies[i];

                tmp_wheelBody.position.copy(tmp_transform.position);
                tmp_wheelBody.quaternion.copy(tmp_transform.quaternion);

                this.wheelMeshes[i].position.copy(tmp_wheelBody.position as unknown as Vector3);
                this.wheelMeshes[i].quaternion.copy(tmp_wheelBody.quaternion as unknown as THREE.Quaternion);
            }
        }

        this.chassisMesh.position.copy(this.chassisBody.position as unknown as Vector3);
        this.chassisMesh.quaternion.copy(this.chassisBody.quaternion as unknown as THREE.Quaternion);
        this.chassisMesh.translateOnAxis(translateAxis, 0.6);
    }

    setEngineForceDirection(engineForceDirection: -1|0|1) {
        this.state.engineForce = maxEngineForce * engineForceDirection;

        if (engineForceDirection === -1) {
            // reverse
            this.state.engineForce *= 0.9;
        }

        frontWheelIndices.forEach(this.applyEngineForceOnFrontWheel);
        rearWheelIndices.forEach(this.applyEngineForceOnRearWheel);
    }

    private applyEngineForceOnFrontWheel = (wheelIndex: number) => {
        this.base.applyEngineForce(this.state.engineForce * 0.6, wheelIndex);
    }

    private applyEngineForceOnRearWheel = (wheelIndex: number) => {
        this.base.applyEngineForce(this.state.engineForce * 0.4, wheelIndex);
    }

    setBrakeForce(brakeForceFactor: 0|1) {
        this.state.brakeForce = maxBrakeForce * brakeForceFactor;
        rearWheelIndices.forEach(this.brakeWheel);
    }

    private brakeWheel = (wheelIndex: number) => {
        this.base.setBrake(this.state.brakeForce, wheelIndex);
    }

    setSteeringDirection(steeringDirection: -1|0|1) {
        this.state.steeringValue = maxSteeringValue * steeringDirection;
    }

    private steerWheel = (wheelIndex: number) => {
        const { steering: currentSteeringValue } = this.base.wheelInfos[wheelIndex];
        const { steeringValue } = this.state;

        if (currentSteeringValue < steeringValue) {
            // steer left
            this.base.setSteeringValue(Math.min(steeringValue, currentSteeringValue + steeringSpeed), wheelIndex);
        } else if (currentSteeringValue > steeringValue) {
            // steer right
            this.base.setSteeringValue(Math.max(steeringValue, currentSteeringValue - steeringSpeed), wheelIndex);
        }
    }

    resetPosition() {
        this.chassisBody.position.copy(this.initialPosition);
        this.chassisBody.quaternion.copy(this.initialRotation);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
    }
}
