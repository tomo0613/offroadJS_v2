import { Body, Box, Cylinder, Quaternion, RaycastVehicle, Transform, Vec3, World } from 'cannon-es';
import { Object3D, Scene, Vector3, Quaternion as _Quaternion } from 'three';

import cfg from '../config';
import { setMaterials } from './materials';
import { VehicleState, initStateHandler } from './stateHandler';

const translateAxis = new Vector3(0, 0, 1);

let tmp_transform: Transform;
let tmp_wheelBody: Body;

const { renderWireFrame } = cfg;
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

export default class Vehicle {
    base: RaycastVehicle;
    chassisBody: Body;
    chassisMesh: Object3D;
    wheelBodies: Body[];
    wheelMeshes: Object3D[];
    state: VehicleState;
    initialPosition = new Vec3();
    initialRotation = new Quaternion();
    currentSteeringAngle = 0;
    trackWidth = 0;
    wheelBase = 0;
    materials: ReturnType<typeof setMaterials>;

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
        const halfTrackWidth = 0.85;
        this.trackWidth = halfTrackWidth * 2;
        this.wheelBase = 1.2 + 1.4;
        // front right
        wheelConfig.chassisConnectionPointLocal.set(halfTrackWidth, -height, -1.2);
        this.base.addWheel(wheelConfig);
        // front left
        wheelConfig.chassisConnectionPointLocal.set(-halfTrackWidth, -height, -1.2);
        this.base.addWheel(wheelConfig);
        // rear right
        wheelConfig.chassisConnectionPointLocal.set(halfTrackWidth, -height, 1.4);
        this.base.addWheel(wheelConfig);
        // rear left
        wheelConfig.chassisConnectionPointLocal.set(-halfTrackWidth, -height, 1.4);
        this.base.addWheel(wheelConfig);

        if (renderWireFrame) {
            const wheelOrientation = new Quaternion();
            wheelOrientation.setFromAxisAngle(Vec3.UNIT_Z, Math.PI / 2);

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

        this.materials = setMaterials(wheelMesh, chassisMesh);
        const wheelMeshes = {
            front_r: wheelMesh,
            front_l: wheelMesh.clone(),
            rear_r: wheelMesh.clone(),
            rear_l: wheelMesh.clone(),
        };
        // mirror meshes suffixed with '_r'
        const axes = ['x', 'y', 'z'] as const;
        Object.keys(wheelMeshes).forEach((wheelId: keyof typeof wheelMeshes) => {
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
            this.wheelBodies.forEach(world.addBody, world);
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
        this.steerWheels();
        // ToDo implement torque vectoring
        this.applyWheelSlipReduction();

        for (let i = 0; i < this.base.wheelInfos.length; i++) {
            this.base.applyEngineForce(this.state.engineForce * torqueDistribution[i] * 0.01, i);
            this.base.updateWheelTransform(i);

            tmp_transform = this.base.wheelInfos[i].worldTransform;
            this.wheelMeshes[i].position.copy(tmp_transform.position as unknown as Vector3);
            this.wheelMeshes[i].quaternion.copy(tmp_transform.quaternion as unknown as _Quaternion);

            if (renderWireFrame) {
                tmp_wheelBody = this.wheelBodies[i];

                tmp_wheelBody.position.copy(tmp_transform.position);
                tmp_wheelBody.quaternion.copy(tmp_transform.quaternion);

                this.wheelMeshes[i].position.copy(tmp_wheelBody.position as unknown as Vector3);
                this.wheelMeshes[i].quaternion.copy(tmp_wheelBody.quaternion as unknown as _Quaternion);
            }
        }

        this.chassisMesh.position.copy(this.chassisBody.position as unknown as Vector3);
        this.chassisMesh.quaternion.copy(this.chassisBody.quaternion as unknown as _Quaternion);
        this.chassisMesh.translateOnAxis(translateAxis, 0.6);
    }

    setEngineForceDirection(engineForceDirection: -1|0|1) {
        this.state.engineForce = maxEngineForce * engineForceDirection;

        if (engineForceDirection === -1) {
            // reverse
            this.state.engineForce *= 0.9;
            this.materials.tailLightMaterial.emissive.setHSL(0, 0, brakeLightBrightness);
        } else {
            this.materials.tailLightMaterial.emissive.setHSL(0, 0, 0);
        }
    }

    private applyWheelSlipReduction = () => {
        const frontLeftWheelHasGrip = this.wheelHasGrip(frontLeftWheelIndex);
        const frontRightWheelHasGrip = this.wheelHasGrip(frontRightWheelIndex);
        const rearLeftWheelHasGrip = this.wheelHasGrip(rearLeftWheelIndex);
        const rearRightWheelHasGrip = this.wheelHasGrip(rearRightWheelIndex);

        if (frontLeftWheelHasGrip && !rearLeftWheelHasGrip && torqueDistribution[rearLeftWheelIndex] > 1) {
            torqueDistribution[frontLeftWheelIndex] += 1;
            torqueDistribution[rearLeftWheelIndex] -= 1;
        } else if (!frontLeftWheelHasGrip && rearLeftWheelHasGrip && torqueDistribution[frontLeftWheelIndex] > 1) {
            torqueDistribution[frontLeftWheelIndex] -= 1;
            torqueDistribution[rearLeftWheelIndex] += 1;
        } else {
            const diffSign = Math.sign(
                torqueDistribution[frontLeftWheelIndex] - defaultTorqueDistribution[frontLeftWheelIndex],
            );
            if (diffSign) {
                torqueDistribution[frontLeftWheelIndex] -= diffSign * 1;
                torqueDistribution[rearLeftWheelIndex] += diffSign * 1;
            }
        }

        if (frontRightWheelHasGrip && !rearRightWheelHasGrip && torqueDistribution[rearRightWheelIndex] > 1) {
            torqueDistribution[frontRightWheelIndex] += 1;
            torqueDistribution[rearRightWheelIndex] -= 1;
        } else if (!frontRightWheelHasGrip && rearRightWheelHasGrip && torqueDistribution[frontRightWheelIndex] > 1) {
            torqueDistribution[frontRightWheelIndex] -= 1;
            torqueDistribution[rearRightWheelIndex] += 1;
        } else {
            const diffSign = Math.sign(
                torqueDistribution[frontRightWheelIndex] - defaultTorqueDistribution[frontRightWheelIndex],
            );
            if (diffSign) {
                torqueDistribution[frontRightWheelIndex] -= diffSign * 1;
                torqueDistribution[rearRightWheelIndex] += diffSign * 1;
            }
        }
    }

    setBrakeForce(brakeForceFactor: 0|1) {
        this.state.brakeForce = maxBrakeForce * brakeForceFactor;
        rearWheelIndices.forEach(this.brakeWheel);
    }

    private brakeWheel = (wheelIndex: number) => {
        this.base.setBrake(this.state.brakeForce, wheelIndex);
    }

    setSteeringDirection(steeringDirection: -1|0|1) {
        this.state.steeringAngle = maxSteeringAngle * steeringDirection;
    }

    private steerWheels = () => {
        const { currentSteeringAngle } = this;
        const { steeringAngle: targetSteeringAngle } = this.state;
        let steeringAngle = 0;

        if (currentSteeringAngle < targetSteeringAngle) {
            // steer left
            steeringAngle = Math.min(targetSteeringAngle, currentSteeringAngle + steeringSpeed);
        } else if (currentSteeringAngle > targetSteeringAngle) {
            // steer right
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
        this.base.setSteeringValue(steeringAngleLeft, frontLeftWheelIndex);
        this.base.setSteeringValue(steeringAngleRight, frontRightWheelIndex);
        this.currentSteeringAngle = steeringAngle;
    }

    resetPosition() {
        this.chassisBody.position.copy(this.initialPosition);
        this.chassisBody.quaternion.copy(this.initialRotation);
        this.chassisBody.velocity.setZero();
        this.chassisBody.angularVelocity.setZero();
    }

    wheelHasGrip = (wheelIndex: number) => (
        this.base.wheelInfos[wheelIndex].isInContact && !this.base.wheelInfos[wheelIndex].sliding
    )
}
