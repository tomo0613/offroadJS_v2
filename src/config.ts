export default {
    antialias: false,
    renderShadows: false,
    world: {
        gravity: {
            x: 0,
            y: -9.8,
            z: 0,
        },
    },
    camera: {
        fov: 50,
        near: 0.1,
        far: 1000,
        initialPosition: {
            x: 0,
            y: 7,
            z: 27,
        },
    },
    vehicle: {
        mass: 30,
        steeringSpeed: 0.1,
        maxSteeringValue: 0.7,
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
