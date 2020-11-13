import { Box3, ExtrudeBufferGeometry, Group, ImageLoader, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SVGLoader, SVGResult } from 'three/examples/jsm/loaders/SVGLoader';
import { ExtrudeGeometryOptions } from 'three/src/geometries/ExtrudeBufferGeometry';

type ResourceType = GLTF|HTMLImageElement|SVGResult;

export {
    debounce,
    isMobileDevice,
    loadResource,
    NOP,
    sliceCubeTexture,
    svgToMesh,
    throttle,
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
function NOP() {}

function loadResource<T extends ResourceType>(url: string): Promise<T> {
    const extension = url.split('.').pop();
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
        const onLoad = (resource) => resolve(resource);
        const onProgress = NOP;
        const onError = (e) => {
            // eslint-disable-next-line no-console
            console.error(`Failed to load resource: ${e.target.src}`);
            reject(e);
        };

        loader.load(url, onLoad, onProgress, onError);
    });
}

interface TranslateProps {
    x?: number;
    y?: number;
    z?: number;
    scale?: number;
}

function svgToMesh({ paths }: SVGResult, translateProps = {} as TranslateProps) {
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

function sliceCubeTexture(img: HTMLImageElement, imgSize = 1024) {
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

const mobileUserAgentRegExp = /Android|iPhone|iPad/i;

function isMobileDevice() {
    return mobileUserAgentRegExp.test(window.navigator.userAgent);
}

export function degToRad(deg: number) {
    return deg / 180 * Math.PI;
}

export function radToDeg(rad: number) {
    return rad * 180 / Math.PI;
}
