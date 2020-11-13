import { CubeTexture, DirectionalLight, LightProbe, Mesh, Scene, WebGLRenderer } from 'three';
import { SAPBroadphase, World } from 'cannon-es';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';
import { SVGResult } from 'three/examples/jsm/loaders/SVGLoader';
import wireframeRenderer from 'cannon-es-debugger';

import * as utils from './utils';
import { MapBuilder, MapEvent, TriggeredEvent } from './mapModules/mapBuilder';
import { popUpWindow, showPopUpMessage } from './notificationModules/notificationManager';
import { CameraHelper } from './cameraHelper';
import { CheckpointManager } from './mapModules/checkpointManager';
import { GameProgressManager } from './gameProgressManager';
import Vehicle from './vehicle/vehicle';
import cfg from './config';
import inputHandler from './inputHandler';
import { layoutRenderers } from './notificationModules/popUpWindow';

import { maps } from './mapModules/maps';

const worldStep = 1 / 60;

(async function init() {
    let paused = false;
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

    const [aVehicle, finishIcon3d, checkpointIcon3d] = await loadAssets() as [Vehicle, Mesh, Mesh];

    const cameraHelper = new CameraHelper(renderer.domElement);
    cameraHelper.setCameraTarget(aVehicle);

    const gameProgress = new GameProgressManager();

    const mapBuilder = new MapBuilder(scene, world);

    const checkpointManager = new CheckpointManager(scene, {
        finish: finishIcon3d,
        checkpoint: checkpointIcon3d,
    });

    mapBuilder.importMap(maps.map1);
    // mapBuilder.importMap(maps.map2);
    checkpointManager.init(mapBuilder, gameProgress);

    mapBuilder.eventTriggerListeners.add(MapEvent.setCameraPosition, ({ relatedTarget, dataSet }: TriggeredEvent) => {
        if (relatedTarget === aVehicle.chassisBody) {
            const [x, y, z] = dataSet.split(',');
            cameraHelper.cameraPosition.set(Number(x), Number(y), Number(z));
        }
    });

    mapBuilder.eventTriggerListeners.add(MapEvent.finish, ({ relatedTarget, dataSet }: TriggeredEvent) => {
        if (relatedTarget === aVehicle.chassisBody) {
            if (parseCheckpointCount(dataSet) === gameProgress.checkpointsReached) {
                gameProgress.stopTimer();
                popUpWindow.open(layoutRenderers.mapFinished, {
                    result: gameProgress.result,
                    onNext: () => {
                        // gameProgress ? next map
                        popUpWindow.close();
                        mapBuilder.importMap(maps.map2);
                        reset();
                    },
                    onRetry: reset,
                });
            }
        }
    });

    inputHandler.addKeyPressListener(() => {
        if (inputHandler.isKeyPressed('M')) {
            mapBuilder.toggleEditMode();
        }

        if (inputHandler.isKeyPressed('P')) {
            pause();
        }

        if (inputHandler.isKeyPressed('R')) {
            reset();
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
        if (inputHandler.isKeyPressed('A', 'ArrowLeft')) {
            steeringValue = 1;
        } else if (inputHandler.isKeyPressed('D', 'ArrowRight')) {
            steeringValue = -1;
        }
        if (!gameProgress.started && engineForce) {
            gameProgress.startTimer();
        }

        aVehicle.setEngineForce(engineForce);
        aVehicle.setSteeringValue(steeringValue);
        aVehicle.setBrakeForce(Number(inputHandler.isKeyPressed(' ')));
    });

    function reset() {
        popUpWindow.close();
        gameProgress.reset();
        mapBuilder.resetDynamicPlatforms();
        checkpointManager.init(mapBuilder, gameProgress);
        aVehicle.resetPosition();
    }

    function pause() {
        paused = !paused;

        if (!paused) {
            render();
            if (gameProgress.started) {
                gameProgress.startTimer();
            }
        } else {
            showPopUpMessage('paused');
            if (gameProgress.started) {
                gameProgress.stopTimer();
            }
        }
    }

    if (cfg.renderWireFrame) {
        wireframeRenderer(scene, world.bodies);
    }
    render();

    function render(dt = performance.now()) {
        if (paused) {
            return;
        }
        requestAnimationFrame(render);

        // update physics
        world.step(worldStep);

        cameraHelper.update();
        gameProgress.updateHUD();

        checkpointManager.updateVisuals(dt);

        renderer.render(scene, cameraHelper.camera);
    }

    function onWindowResize() {
        cameraHelper.camera.aspect = window.aspectRatio;
        cameraHelper.camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async function loadAssets() {
        const [cubeTexture, wheelGLTF, chassisGLTF, finishIcon, checkpointIcon] = await Promise.all([
            utils.loadResource<HTMLImageElement>('./img/skybox.jpg'),
            utils.loadResource<GLTF>('./3D_objects/lowPoly_car_wheel.gltf'),
            utils.loadResource<GLTF>('./3D_objects/mg.glb'),
            utils.loadResource<SVGResult>('./img/laurel_wreath.svg'),
            utils.loadResource<SVGResult>('./img/pin.svg'),
        ]);

        const skyBox = new CubeTexture(utils.sliceCubeTexture(cubeTexture));
        skyBox.needsUpdate = true;
        scene.background = skyBox;

        lightProbe.copy(LightProbeGenerator.fromCubeTexture(skyBox));

        const vehicleChassis = chassisGLTF.scene;
        const vehicleWheel = wheelGLTF.scene;
        const vehicle = new Vehicle(vehicleChassis, vehicleWheel);
        vehicle.addToWorld(world)
            .addToScene(scene)
            .resetPosition();

        return [
            vehicle,
            utils.svgToMesh(finishIcon, { x: 3.5, y: -3, scale: 0.07 }),
            utils.svgToMesh(checkpointIcon, { x: -5, y: -5, scale: 0.07 }),
        ];
    }
})();

function parseCheckpointCount(dataSet: string) {
    const [, checkpointCount] = dataSet.match(/checkpoints:(\d+)/) || [];

    return checkpointCount ? Number(checkpointCount) : 0;
}

Object.defineProperty(window, 'aspectRatio', {
    get() {
        return window.innerWidth / window.innerHeight;
    },
});
