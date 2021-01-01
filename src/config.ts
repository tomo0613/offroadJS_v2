const prefKeys = [
    'fullscreen',
    'antialias',
    'renderShadows',
    'renderWireFrame',
    'resolutionScale',
] as const;

const config = {
    fullscreen: false,
    antialias: false,
    renderShadows: false,
    renderWireFrame: false,
    resolutionScale: 1,
    /**
     * WebGL powerPreference
     * "high-performance" | "low-power" | "default"
     * https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.2
     */
    powerPreference: 'high-performance',
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
        steeringSpeed: 0.03,
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

type ConfigKeys = keyof typeof config;
type PrefCache = Record<typeof prefKeys[number], boolean|number>;

const userPrefCache = prefKeys.reduce((prefCache, prefKey) => {
    const userPrefValue = window.localStorage.getItem(prefKey);

    if (userPrefValue) {
        try {
            prefCache[prefKey] = JSON.parse(userPrefValue) as boolean|number;
        } catch (e) {
            console.warn(e);
        }
    }

    return prefCache;
}, {} as PrefCache);

export default new Proxy(config, {
    get(target, key: ConfigKeys) {
        return userPrefCache[key] || target[key];
    },
    set(target, key: ConfigKeys, value: boolean|number) {
        if (prefKeys.includes(key as (typeof prefKeys)[number])) {
            userPrefCache[key] = value;
            window.localStorage.setItem(key, String(value));
        }

        return true;
    },
});
