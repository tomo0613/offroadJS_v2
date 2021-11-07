export default {
    meta: {
        author: '',
    },
    elements: [
        {
            type: 'vehicle',
            position_y: 1,
        },
        {
            shape: 'box',
            width: 5,
            length: 5,
            height: 0.2,
            position_y: -0.1,
        },
        {
            type: 'trigger',
            shape: 'sphere',
            event: 'finish',
            dataSet: '',
            radius: 1,
            position_x: 3,
            position_y: 1,
        },
    ],
};
