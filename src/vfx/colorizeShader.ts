import { Color } from 'three';

const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float opacity;
    uniform vec3 color;
    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    void main() {
        vec4 texel = texture2D(tDiffuse, vUv);

        vec3 luma = vec3(0.2, 0.4, 0.0);
        float v = dot(texel.xyz, luma);

        vec3 finalColor = vec3(
            (opacity * v * color.x) + ((1.0 - opacity) * texel.x),
            (opacity * v * color.y) + ((1.0 - opacity) * texel.y),
            (opacity * v * color.z) + ((1.0 - opacity) * texel.z)
        );

        gl_FragColor = vec4(finalColor, texel.w);
    }
`;

export const ColorizeShader = {
    uniforms: {
        tDiffuse: {
            type: 't',
            value: null,
        },
        color: {
            type: 'c',
            value: new Color(0xffffff),
        },
        opacity: {
            type: 'f',
            value: 1.0,
        },

    },
    vertexShader,
    fragmentShader,
};
