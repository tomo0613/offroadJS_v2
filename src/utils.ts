import { Box3, ExtrudeBufferGeometry, Group, ImageLoader, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SVGLoader, SVGResult } from 'three/examples/jsm/loaders/SVGLoader';
import { ExtrudeGeometryOptions } from 'three/src/geometries/ExtrudeGeometry';

import { hideNotification, showNotification } from './notificationModules/notificationManager';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

type ResourceType = GLTF|HTMLImageElement|SVGResult;

export function loadResource<T extends ResourceType>(url: string): Promise<T> {
    const extension = url.split('.').pop();
    const progressDisplay = showNotification(`Loading resource: ${url}`);
    let loader: ImageLoader|GLTFLoader|SVGLoader;

    switch (extension) {
        case 'jpg':
            loader = new ImageLoader();
            break;
        case 'svg':
            loader = new SVGLoader();
            break;
        case 'glb':
        case 'gltf':
            loader = new GLTFLoader();
            break;
        default:
            return Promise.reject(new Error(`unknown resource type [${extension}]`));
    }

    return new Promise((resolve, reject) => {
        const onLoad = (resource) => {
            resolve(resource);
            hideNotification(progressDisplay);
        };
        const onError = (e: ErrorEvent) => {
            // eslint-disable-next-line no-console
            console.error(`Failed to load resource: ${url}`);
            reject(e);
        };

        loader.load(url, onLoad, onProgress, onError);
    });

    function onProgress({ loaded, total, lengthComputable }: ProgressEvent) {
        const totalSize = lengthComputable ? bytesToReadable(total, 'M') : '?_';

        progressDisplay.setContent(
            `Loading resource: ${url} (${bytesToReadable(loaded, 'M')} / ${totalSize}MB)`,
        );
    }
}

function bytesToReadable(value: number, scale: 'k'|'M'|'G'|'T') {
    let result = value;
    const n = ['k', 'M', 'G', 'T'].indexOf(scale) + 1;

    for (let i = 0; i < n; i++) {
        result /= 1024;
    }

    return result.toFixed(2);
}

interface TranslateProps {
    x?: number;
    y?: number;
    z?: number;
    scale?: number;
}

export function svgToMesh({ paths }: SVGResult, translateProps = {} as TranslateProps) {
    const group = new Group();
    const extrudeOptions: ExtrudeGeometryOptions = {
        bevelEnabled: false,
        depth: 1,
    };

    for (let i = 0; i < paths.length; i++) {
        const path = paths[i];

        const material = new MeshBasicMaterial({
            color: path.color,
        });

        const shapes = path.toShapes(false);
        for (let j = 0; j < shapes.length; j++) {
            const shape = shapes[j];
            const geometry = new ExtrudeBufferGeometry(shape, extrudeOptions);
            const mesh = new Mesh(geometry, material);
            group.add(mesh);
        }
    }

    const { x: width, y: height, z: length } = new Box3().setFromObject(group).getSize(new Vector3());
    const { x: offsetX = 0, y: offsetY = 0, z: offsetZ = 0, scale = 1 } = translateProps;

    group.traverse((mesh) => {
        mesh.translateX(-width / 2 + offsetX);
        mesh.translateY(-height / 2 + offsetY);
        mesh.translateZ(-length / 2 + offsetZ);
    });

    group.rotateY(Math.PI);
    group.rotateZ(Math.PI);
    group.scale.set(scale, scale, scale);

    return group;
}

export function sliceCubeTexture(img: HTMLImageElement, imgSize = 1024) {
    const cubeTextureMap = [
        { x: 2, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 3, y: 1 },
    ];

    return cubeTextureMap.map(getFace);

    function getFace({ x, y }: { x: number; y: number }) {
        const canvas = document.createElement('canvas');
        canvas.width = imgSize;
        canvas.height = imgSize;
        canvas.getContext('2d').drawImage(img, -x * imgSize, -y * imgSize);

        return canvas;
    }
}

export function debounce(fnc: VoidFnc, delay = 200, immediate = false) {
    let timeoutId: number;

    return (...args: unknown[]) => {
        if (immediate && !timeoutId) {
            fnc(...args);
        }
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            if (!immediate) {
                fnc(...args);
            } else {
                timeoutId = undefined;
            }
        }, delay);
    };
}

export function throttle(fnc: VoidFnc, timeToWaitBeforeNextCall = 200) {
    let timeoutId: number;
    let prevCallTime: number;
    let now: number;
    let nextScheduledCallTime: number;

    return (...args: unknown[]) => {
        nextScheduledCallTime = prevCallTime + timeToWaitBeforeNextCall;
        now = performance.now();

        if (!prevCallTime || now > nextScheduledCallTime) {
            fnc(...args);
            prevCallTime = now;
        } else {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                fnc(...args);
                prevCallTime = now;
            }, timeToWaitBeforeNextCall - (now - prevCallTime));
        }
    };
}

const mobileUserAgentRegExp = /Android|iPhone|iPad/i;

export function isMobileDevice() {
    return mobileUserAgentRegExp.test(window.navigator.userAgent);
}

export function formatTime(time: number) {
    const milSec = Math.floor(time % 1000);
    const sec = Math.floor(time / 1000 % 60);
    const min = Math.floor(time / 60000 % 60);

    return `${appendLeadingZero(min)}:${appendLeadingZero(sec)}.${milSec}`;
}

function appendLeadingZero(value: number) {
    const str = value.toString();

    return str.length < 2 ? `0${value}` : str;
}

export function numberToHexString(colorValue: number) {
    return `#${colorValue.toString(16).toUpperCase()}`;
}

export function degToRad(deg: number) {
    return deg / 180 * Math.PI;
}

export function radToDeg(rad: number) {
    return rad * 180 / Math.PI;
}

export function round(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function valueBetween(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

function omit<O extends Record<K, unknown>, K extends keyof O = keyof O>(obj: O, ...keysToOmit: K[]) {
    return Object.keys(obj).reduce((targetObj, key) => {
        if (!keysToOmit.includes(key as K)) {
            targetObj[key] = obj[key];
        }

        return targetObj;
    }, {} as Omit<O, K>);
}

function pick<O extends Record<K, unknown>, K extends keyof O = keyof O>(obj: O, ...keysToPick: K[]) {
    return keysToPick.reduce((targetObj, key) => {
        if (obj.hasOwnProperty(key)) {
            targetObj[key] = obj[key];
        }

        return targetObj;
    }, {} as Pick<O, K>);
}

Object.defineProperties(Object, {
    omit: { value: omit },
    pick: { value: pick },
});
