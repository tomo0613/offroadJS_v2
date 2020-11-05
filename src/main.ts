import { AmbientLight, CubeTexture, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { SAPBroadphase, World } from 'cannon-es';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import wireframeRenderer from 'cannon-es-debugger';

import * as utils from './utils';
import { CameraHelper } from './cameraHelper';
import { PlatformBuilder } from './platformBuilder';
import Vehicle from './vehicle/vehicle';
import cfg from './config';
import inputHandler from './inputHandler';

import { map1 } from './maps';

const worldStep = 1 / 60;

(async function init() {
    const scene = new Scene();

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    const sunLight = new DirectionalLight(0xf5f4d3, 0.85);
    sunLight.position.set(-30, 50, -30);
    sunLight.castShadow = cfg.renderShadows;
    scene.add(ambientLight, sunLight);

    const world = new World();
    const { x: gravityX, y: gravityY, z: gravityZ } = cfg.world.gravity;
    world.gravity.set(gravityX, gravityY, gravityZ);
    world.broadphase = new SAPBroadphase(world);
    world.defaultContactMaterial.friction = 0.001;

    const renderer = new WebGLRenderer({ antialias: cfg.antialias });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = cfg.renderShadows;

    document.body.appendChild(renderer.domElement);

    window.onresize = utils.debounce(onWindowResize, 500);

    const [aVehicle] = await loadAssets();

    const camera = new PerspectiveCamera(cfg.camera.fov, getAspectRatio(), cfg.camera.near, cfg.camera.far);
    const cameraHelper = new CameraHelper(camera);
    // cameraHelper.setCameraTarget(aVehicle);
    cameraHelper.initOrbitCamera(renderer.domElement);

    const platformBuilder = new PlatformBuilder(scene, world);
    platformBuilder.importMap(map1);

    platformBuilder.showGUI();

    inputHandler.addKeyPressListener(() => {
        //     if (inputHandler.isKeyPressed('M')) {
        //         platformBuilder.showGUI();
        //     }
        if (inputHandler.isKeyPressed('R')) {
            aVehicle.resetPosition();
            platformBuilder.resetDynamicPlatforms();
        }

        let engineForce = 0;
        let steeringValue = 0;

        if (inputHandler.isKeyPressed('W', 'ArrowUp')) {
            engineForce = 1;
        } else if (inputHandler.isKeyPressed('S', 'ArrowDown')) {
            engineForce = -1;
        }

        if (inputHandler.isKeyPressed('A', 'ArrowLeft')) {
            steeringValue = 1;
        } else if (inputHandler.isKeyPressed('D', 'ArrowRight')) {
            steeringValue = -1;
        }

        aVehicle.setEngineForce(engineForce);
        aVehicle.setSteeringValue(steeringValue);
        aVehicle.setBrakeForce(Number(inputHandler.isKeyPressed(' ')));
    });

    wireframeRenderer(scene, world.bodies);
    render();

    function render() {
        // if (pause) {
        //     return;
        // }
        requestAnimationFrame(render);

        // update physics
        world.step(worldStep);

        cameraHelper.update();

        renderer.render(scene, camera);
    }

    function onWindowResize() {
        camera.aspect = getAspectRatio();
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async function loadAssets() {
        const [cubeTexture, wheelGLTF, chassisGLTF] = await Promise.all([
            utils.loadResource<HTMLImageElement>('./img/skybox.jpg'),
            utils.loadResource<GLTF>('3D_objects/lowPoly_car_wheel.gltf'),
            utils.loadResource<GLTF>('3D_objects/mg.glb'),
        ]);

        const skyBox = new CubeTexture(utils.sliceCubeTexture(cubeTexture));
        skyBox.needsUpdate = true;
        scene.background = skyBox;

        const vehicleChassis = chassisGLTF.scene;
        const vehicleWheel = wheelGLTF.scene;
        const vehicle = new Vehicle(vehicleChassis, vehicleWheel);
        vehicle.addToWorld(world);
        vehicle.addToScene(scene);
        vehicle.resetPosition();

        return [vehicle];
    }
})();

function getAspectRatio() {
    return window.innerWidth / window.innerHeight;
}
