import { Body, Box, Cylinder, Quaternion, RaycastVehicle, Transform, Vec3, World } from 'cannon-es';
import { Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, Object3D, Scene, Vector3 } from 'three';

import cfg from './config';

const { x: initialX, y: initialY, z: initialZ } = cfg.vehicle.initialPosition;
const vehicleInitialPosition = new Vec3(initialX, initialY, initialZ);
const vehicleInitialRotation = new Quaternion().setFromAxisAngle(new Vec3(0, -1, 0), cfg.vehicle.initialRotation);

const translateAxis = new Vector3(0, 0, 1);

let aTransform: Transform;
let aWheelBody: Body;

const frontWheelIndices = [0, 1];
const rearWheelIndices = [2, 3];

const stateValueLimits = {
    engineForceMin: -0.8,
    engineForceMax: 1,
    brakeForceMin: 0,
    brakeForceMax: 1,
    steeringValueMin: -0.5,
    steeringValueMax: 0.5,
};
const defaultState = {
    engineForce: 0,
    brakeForce: 0,
    steeringValue: 0,
};

export default class Vehicle {
    base: RaycastVehicle;
    chassisBody: Body;
    chassisMesh: Object3D;
    wheelBodies: Body[];
    wheelMeshes: Object3D[];
    state = new Proxy(defaultState, {
        set(o, prop: keyof typeof defaultState, value: number) {
            // eslint-disable-next-line no-param-reassign
            o[prop] = valueBetween(value, stateValueLimits[`${prop}Min`], stateValueLimits[`${prop}Max`]);

            return true;
        },
    });

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
    }

    addToWorld(world: World) {
        this.wheelBodies.forEach((wheelBody) => world.addBody(wheelBody));
        this.base.addToWorld(world);

        world.addEventListener('postStep', this.updateVisuals);

        return this;
    }

    addToScene(scene: Scene) {
        this.wheelMeshes.forEach((wheelMesh) => {
            scene.add(wheelMesh);
        });
        scene.add(this.chassisMesh);

        return this;
    }

    private updateVisuals = () => {
        for (let i = 0; i < this.base.wheelInfos.length; i++) {
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
        frontWheelIndices.forEach(this.steerWheels);
    }

    private steerWheels = (wheelIndex: number) => {
        this.base.setSteeringValue(this.state.steeringValue, wheelIndex);
    }

    resetPosition() {
        this.chassisBody.position.copy(vehicleInitialPosition);
        this.chassisBody.quaternion.copy(vehicleInitialRotation);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
    }
}

function setMaterials(wheel: Object3D, chassis: Object3D) {
    const baseMaterial = new MeshLambertMaterial({ color: 0x777777 });
    const fenderMaterial = new MeshBasicMaterial({ color: 0x050505 });
    const grillMaterial = new MeshBasicMaterial({ color: 0x222222 });
    const chromeMaterial = new MeshPhongMaterial({ color: 0xCCCCCC });
    const glassMaterial = new MeshPhongMaterial({ color: 0xACCCD7 });
    const tailLightMaterial = new MeshPhongMaterial({ color: 0x550000 });
    const headLightMaterial = new MeshPhongMaterial({ color: 0xFFFFBB });

    const wheelMaterial = new MeshBasicMaterial();
    wheelMaterial.alphaTest = 0.5;
    wheelMaterial.skinning = true;

    wheel.traverse((childMesh: Mesh) => {
        if (childMesh.material) {
            wheelMaterial.map = (childMesh.material as MeshBasicMaterial).map;
            /* eslint-disable no-param-reassign */
            childMesh.material = wheelMaterial;
            childMesh.material.needsUpdate = true;
            /* eslint-enable no-param-reassign */
        }
    });

    chassis.traverse((childMesh: Mesh) => {
        if (childMesh.material) {
            // eslint-disable-next-line no-param-reassign
            childMesh.material = getChassisMaterialByPartName(childMesh.name);
        }
    });

    function getChassisMaterialByPartName(partName: string) {
        switch (partName) {
            case 'front_bumper':
            case 'rear_bumper':
            case 'front_fender':
            case 'rear_fender':
                return fenderMaterial;
            case 'grill':
                return grillMaterial;
            case 'brushGuard':
                return chromeMaterial;
            case 'glass':
                return glassMaterial;
            case 'tail_lights':
                return tailLightMaterial;
            case 'head_lights':
                return headLightMaterial;
            default:
                return baseMaterial;
        }
    }
}

function valueBetween(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}
