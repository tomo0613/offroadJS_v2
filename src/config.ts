import EventListener from './common/EventListener';

const prefKeys = [
    'fullscreen',
    'antialias',
    'renderShadows',
    'renderWireFrame',
    'resolutionScale',
    'audioVolume',
    'autoResetDelay',
] as const;

const config = {
    fullscreen: false,
    antialias: false,
    renderShadows: false,
    renderWireFrame: false,
    resolutionScale: 1,
    audioVolume: 0.5,
    autoResetDelay: 2500,
    /**
     * WebGL powerPreference
     * "high-performance" | "low-power" | "default"
     * https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.2
     */
    powerPreference: 'high-performance' as 'high-performance' | 'low-power' | 'default',
    physicsFrameRate: 120,
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
        mountOffset_v3: [0, 4, 9],
        mountOffsetReverse_v3: [5, 4, -9],
        lookOffset_v3: [0, 1, -5],
    },
    vehicle: {
        mass: 30,
        steeringSpeed: 0.02,
        maxSteeringAngle: 0.7,
        maxBrakeForce: 22,
        maxEngineForce: 220,
        torqueSplitRatio: [50, 50],
        cameraMountPosition: {
            x: 0,
            y: 4,
            z: 10,
        },
        wheelRadius: 0.4,
        wheelSuspensionRestLength: 0.3,
        wheelSuspensionStiffness: 25,
        wheelMaxSuspensionTravel: 0.3,
        wheelMaxSuspensionForce: Number.MAX_VALUE,
        wheelDampingCompression: 2,
        wheelDampingRelaxation: 2,
        wheelFrictionSlip: 1.1,
        wheelForwardAcceleration: 1 / 2,
        wheelSidedAcceleration: 1,
        wheelRollInfluence: 0.6,
    },
};

type ConfigKeys = keyof typeof config;
type PrefCache = Record<typeof prefKeys[number], boolean|number>;

export const configListener = new EventListener<ConfigKeys>();

const userPrefCache = prefKeys.reduce((prefCache, prefKey) => {
    try {
        const userPrefValue = window.localStorage.getItem(prefKey);

        if (userPrefValue) {
            prefCache[prefKey] = JSON.parse(userPrefValue) as boolean|number;
        }
    } catch (error) {
        console.error(error);
    }

    return prefCache;
}, {} as PrefCache);

export default new Proxy(config, {
    get(target, key: ConfigKeys) {
        return userPrefCache.hasOwnProperty(key) ? userPrefCache[key] : target[key];
    },
    set(target, key: ConfigKeys, value: boolean|number) {
        if (prefKeys.includes(key as (typeof prefKeys)[number])) {
            userPrefCache[key] = value;

            configListener.dispatch(key, value);

            try {
                window.localStorage.setItem(key, String(value));
            } catch (error) {
                console.error(error);
            }
        }

        return true;
    },
});
