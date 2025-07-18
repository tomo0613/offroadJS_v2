export default {
    meta: {
        author: '',
        goals: {
            time: 11_000,
            respawnCount: 0,
        },
        next: 'i03',
    },
    elements: [
        {
            type: 'vehicle',
            position_y: 1,
        },
        {
            shape: 'box',
            width: 10,
            length: 20,
            height: 0.2,
            position_y: -0.1,
            position_x: 0,
            position_z: -5,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'sphere',
            type: 'trigger',
            event: 'setCameraMode',
            dataSet: 'chase',
            radius: 3,
            position_y: 1,
        },
        {
            type: 'trigger',
            shape: 'sphere',
            event: 'finish',
            dataSet: '',
            radius: 1,
            position_x: -26,
            position_y: 4.66,
            position_z: 0,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10,
            height: 0.2,
            position_y: -0.54,
            position_x: 0,
            position_z: -19.96,
            rotation_x: -5,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10,
            height: 0.2,
            position_y: -1.85,
            position_x: 0,
            position_z: -29.85,
            rotation_x: -10,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10,
            height: 0.2,
            position_y: -3.15,
            position_x: 0,
            position_z: -39.74,
            rotation_x: -5,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10.3,
            height: 0.2,
            position_y: -3.59,
            position_x: 0,
            position_z: -49.86,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 14,
            length: 14,
            height: 0.2,
            position_y: -3.59,
            position_x: -3,
            position_z: -62,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 20,
            length: 4,
            height: 0.2,
            position_y: -3.59,
            position_x: -13,
            position_z: -71,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 14,
            length: 14,
            height: 0.2,
            position_y: -3.59,
            position_x: -23,
            position_z: -62,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 6,
            length: 10,
            height: 0.2,
            position_y: -3.59,
            position_x: -13,
            position_z: -64,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 20,
            height: 0.2,
            position_y: -3.59,
            position_x: -26,
            position_z: -45,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10,
            height: 0.2,
            position_y: -2.72,
            position_x: -26,
            position_z: -30.09,
            rotation_x: -10,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10,
            height: 0.2,
            position_y: -0.15,
            position_x: -26,
            position_z: -20.49,
            rotation_x: -20,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10,
            height: 0.2,
            position_y: 2.42,
            position_x: -26,
            position_z: -10.89,
            rotation_x: -10,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            width: 10,
            length: 10,
            height: 0.2,
            position_y: 3.28,
            position_x: -26,
            position_z: -0.99,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
        },
        {
            shape: 'box',
            height: 1,
            width: 80,
            length: 140,
            position_x: -15,
            position_y: -5,
            position_z: -35,
            type: 'trigger',
            event: 'reset',
        },
    ],
};
