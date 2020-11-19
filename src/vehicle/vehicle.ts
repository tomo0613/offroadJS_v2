import { Body, Box, Cylinder, Quaternion, RaycastVehicle, Transform, Vec3, World } from 'cannon-es';
import { Object3D, Scene, Vector3 } from 'three';

import cfg from '../config';
import { setMaterials } from './materials';
import { VehicleState, initStateHandler } from './stateHandler';

const translateAxis = new Vector3(0, 0, 1);

let aTransform: Transform;
let aWheelBody: Body;

const frontWheelIndices = [0, 1];
const rearWheelIndices = [2, 3];

const { steeringSpeed } = cfg.vehicle;

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
            radius: 0.4,
            directionLocal: new Vec3(0, -1, 0),
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            frictionSlip: 1.4,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.5,
            axleLocal: new Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new Vec3(),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true,
        };
        const height = 0.3;
        wheelConfig.chassisConnectionPointLocal.set(0.85, -height, -1.2);
        this.base.addWheel(wheelConfig);
        wheelConfig.chassisConnectionPointLocal.set(-0.85, -height, -1.2);
        this.base.addWheel(wheelConfig);
        wheelConfig.chassisConnectionPointLocal.set(0.85, -height, 1.35);
        this.base.addWheel(wheelConfig);
        wheelConfig.chassisConnectionPointLocal.set(-0.85, -height, 1.35);
        this.base.addWheel(wheelConfig);

        const wheelOrientation = new Quaternion();
        wheelOrientation.setFromAxisAngle(new Vec3(0, 0, 1), Math.PI / 2);

        this.wheelBodies = this.base.wheelInfos.map((wheel) => {
            const wheelShape = new Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 8);
            const wheelBody = new Body({
                type: Body.KINEMATIC,
                collisionFilterGroup: 0, // turn off collisions
            });
            wheelBody.addShape(wheelShape, Vec3.ZERO, wheelOrientation);

            return wheelBody;
        });

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
        this.wheelBodies.forEach((wheelBody) => world.addBody(wheelBody));
        this.base.addToWorld(world);

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
        for (let i = 0; i < this.base.wheelInfos.length; i++) {
            if (frontWheelIndices.includes(i)) {
                this.steerWheel(i);
            } else {
                // increase engine force gradually ?
            }

            this.base.updateWheelTransform(i);

            aTransform = this.base.wheelInfos[i].worldTransform;
            aWheelBody = this.wheelBodies[i];

            aWheelBody.position.copy(aTransform.position);
            aWheelBody.quaternion.copy(aTransform.quaternion);

            this.wheelMeshes[i].position.copy(aWheelBody.position as unknown as Vector3);
            this.wheelMeshes[i].quaternion.copy(aWheelBody.quaternion as unknown as THREE.Quaternion);
        }

        this.chassisMesh.position.copy(this.chassisBody.position as unknown as Vector3);
        this.chassisMesh.quaternion.copy(this.chassisBody.quaternion as unknown as THREE.Quaternion);
        this.chassisMesh.translateOnAxis(translateAxis, 0.6);
    }

    setEngineForce(engineForce: number) {
        this.state.engineForce = engineForce;
        frontWheelIndices.forEach(this.applyEngineForceOnFrontWheels);
        rearWheelIndices.forEach(this.applyEngineForceOnRearWheels);
    }

    private applyEngineForceOnFrontWheels = (wheelIndex: number) => {
        this.base.applyEngineForce(cfg.vehicle.maxEngineForceFront * this.state.engineForce, wheelIndex);
    }

    private applyEngineForceOnRearWheels = (wheelIndex: number) => {
        this.base.applyEngineForce(cfg.vehicle.maxEngineForceRear * this.state.engineForce, wheelIndex);
    }

    setBrakeForce(brakeForce: number) {
        this.state.brakeForce = brakeForce;
        rearWheelIndices.forEach(this.brakeWheels);
    }

    private brakeWheels = (wheelIndex: number) => {
        this.base.setBrake(this.state.brakeForce, wheelIndex);
    }

    setSteeringValue(steeringValue: number) {
        this.state.steeringValue = steeringValue;
    }

    private steerWheel = (wheelIndex: number) => {
        const currentSteeringValue = this.base.wheelInfos[wheelIndex].steering;
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
