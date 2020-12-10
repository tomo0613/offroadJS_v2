export default {
    antialias: false,
    renderShadows: false,
    renderWireFrame: false,
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
        steeringSpeed: 0.05,
        maxSteeringValue: 0.8,
        maxBrakeForce: 1,
        maxEngineForce: 140,
        cameraMountPosition: {
            x: 0,
            y: 4,
            z: 10,
        },
    },
};
