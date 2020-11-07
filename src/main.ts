import { CubeTexture, DirectionalLight, LightProbe, Scene, WebGLRenderer } from 'three';
import { SAPBroadphase, World } from 'cannon-es';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';
import wireframeRenderer from 'cannon-es-debugger';

import * as utils from './utils';
import { MapBuilder, MapEvent } from './mapBuilder';
import { CameraHelper } from './cameraHelper';
import { GameProgressManager } from './gameProgressManager';
import Vehicle from './vehicle/vehicle';
import cfg from './config';
import inputHandler from './inputHandler';

import { map1 } from './maps';

const worldStep = 1 / 60;

(async function init() {
    const scene = new Scene();

    const lightProbe = new LightProbe();
    const sunLight = new DirectionalLight(0xf5f4d3, 0.5);
    sunLight.position.set(-30, 50, -30);
    sunLight.castShadow = cfg.renderShadows;
    scene.add(lightProbe, sunLight);

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

    const cameraHelper = new CameraHelper(renderer.domElement);
    cameraHelper.setCameraTarget(aVehicle);

    const gameProgress = new GameProgressManager();

    const mapBuilder = new MapBuilder(scene, world);
    mapBuilder.importMap(map1);

    mapBuilder.eventTriggerListeners.add(MapEvent.setCameraPosition, (e) => {
        if (e.relatedTarget === aVehicle.chassisBody) {
            const [x, y, z] = e.dataSet.split(',');
            cameraHelper.cameraPosition.set(x, y, z);
        }
    });
    mapBuilder.eventTriggerListeners.add(MapEvent.finish, (e) => {
        if (e.relatedTarget === aVehicle.chassisBody) {
            gameProgress.stopTimer();
            // showPopUp('retry', 'next')
            console.log(`Well done! _ time: ${gameProgress.result}`);
        }
    });

    inputHandler.addKeyPressListener(() => {
        if (inputHandler.isKeyPressed('M')) {
            mapBuilder.toggleEditMode();
        }

        // if (inputHandler.isKeyPressed('V')) {
        //     console.log(cameraHelper.camera.position);
        // }

        if (inputHandler.isKeyPressed('R')) {
            aVehicle.resetPosition();
            mapBuilder.resetDynamicPlatforms();
            gameProgress.resetTimer();
        }

        if (inputHandler.isKeyPressed('C')) {
            cameraHelper.switchMode();
        }

        let engineForce = 0;
        let steeringValue = 0;

        if (inputHandler.isKeyPressed('W', 'ArrowUp')) {
            engineForce = 1;
        } else if (inputHandler.isKeyPressed('S', 'ArrowDown')) {
            engineForce = -1;
        }
        if (!gameProgress.started && engineForce) {
            // console.log('start');
            gameProgress.startTimer();
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

    if (cfg.renderWireFrame) {
        wireframeRenderer(scene, world.bodies);
    }
    render();

    function render() {
        // if (pause) {
        //     return;
        // }
        requestAnimationFrame(render);

        // update physics
        world.step(worldStep);

        cameraHelper.update();
        gameProgress.updateHUD();

        renderer.render(scene, cameraHelper.camera);
    }

    function onWindowResize() {
        cameraHelper.camera.aspect = window.aspectRatio;
        cameraHelper.camera.updateProjectionMatrix();
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

        lightProbe.copy(LightProbeGenerator.fromCubeTexture(skyBox));

        const vehicleChassis = chassisGLTF.scene;
        const vehicleWheel = wheelGLTF.scene;
        const vehicle = new Vehicle(vehicleChassis, vehicleWheel);
        vehicle.addToWorld(world);
        vehicle.addToScene(scene);
        vehicle.resetPosition();

        return [vehicle];
    }
})();

Object.defineProperty(window, 'aspectRatio', {
    get() {
        return window.innerWidth / window.innerHeight;
    },
});
