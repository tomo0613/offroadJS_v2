import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { ImageLoader } from 'three';

type ResourceType = GLTF | HTMLImageElement;

export {
    loadResource,
    sliceCubeTexture,
    debounce,
    throttle,
    NOP,
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
function NOP() {}

function loadResource<T extends ResourceType>(url: string): Promise<T> {
    const extension = url.split('.').pop();
    let loader;

    switch (extension) {
        case 'jpg':
            loader = new ImageLoader();
            break;
        case 'glb':
        case 'gltf':
            loader = new GLTFLoader();
            break;
        default:
            return Promise.reject(new Error(`unknown resource type [${extension}]`));
    }

    return new Promise((resolve, reject) => {
        const onLoad = (resource) => resolve(resource);
        const onProgress = NOP;
        const onError = (e) => {
            console.error(`Failed to load resource: ${e.target.src}`);
            reject(e);
        };

        loader.load(url, onLoad, onProgress, onError);
    });
}

function sliceCubeTexture(img: HTMLImageElement, imgSize = 1024) {
    const cubeTextureMap = [
        { x: 2, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 3, y: 1 },
    ];

    return cubeTextureMap.map((positionOffset) => getFace(positionOffset.x, positionOffset.y));

    function getFace(x: number, y: number) {
        const canvas = document.createElement('canvas');
        canvas.width = imgSize;
        canvas.height = imgSize;
        canvas.getContext('2d').drawImage(img, -x * imgSize, -y * imgSize);

        return canvas;
    }
}

function debounce(fnc: Function, delay = 200, immediate = false) {
    let timeoutId: number;

    return (...args) => {
        if (immediate && !timeoutId) {
            fnc(...args);
        }
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => fnc(...args), delay);
    };
}

function throttle(fnc: Function, timeToWaitBeforeNextCall = 200) {
    let timeoutId: number;
    let prevCallTime: number;
    let now: number;
    let nextScheduledCallTime: number;

    return (...args) => {
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
