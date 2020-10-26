export default {
    world: {
        gravity: {
            x: 0,
            y: -9.8,
            // y: 0,
            z: 0,
        },
    },
    camera: {
        fov: 45,
        near: 0.1,
        far: 1000,
        initialPosition: {
            x: 0,
            y: 2,
            z: 10,
        },
    },
    vehicle: {
        // mass: 20,
        mass: 30,
        maxSteeringValue: 0.5,
        maxBrakeForce: 1,
        maxEngineForceFront: 70,
        maxEngineForceRear: 65,
        initialPosition: {
            x: 0,
            y: 1,
            z: 0,
        },
        initialRotation: -Math.PI / 2,
        // initialRotation: 0,
    },
};
