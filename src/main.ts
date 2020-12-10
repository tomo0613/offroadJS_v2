import { SAPBroadphase, World } from 'cannon-es';
import wireframeRenderer from 'cannon-es-debugger';
import { CubeTexture, DirectionalLight, LightProbe, Mesh, Scene, WebGLRenderer } from 'three';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { SVGResult } from 'three/examples/jsm/loaders/SVGLoader';

import { CameraHelper } from './cameraHelper';
import cfg from './config';
import { GameProgressManager } from './gameProgress/gameProgressManager';
import inputHandler from './inputHandler';
import { CheckpointManager } from './mapModules/checkpointManager';
import { MapBuilder, MapTriggerElementEvent, TriggeredEvent } from './mapModules/mapBuilder';
import { showNotification } from './notificationModules/notificationManager';
import * as utils from './utils';
import Vehicle from './vehicle/vehicle';

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

    const mapBuilder = new MapBuilder(scene, world);
    mapBuilder.onPlaceVehicle = (pX = 0, pY = 0, pZ = 0, rX = 0, rY = 0, rZ = 0) => {
        aVehicle.initialPosition.set(pX, pY, pZ);
        aVehicle.initialRotation.setFromEuler(utils.degToRad(rX), utils.degToRad(rY), utils.degToRad(rZ));
        aVehicle.resetPosition();
    };
    mapBuilder.eventTriggerListeners.add(
        MapTriggerElementEvent.setCameraPosition,
        ({ relatedTarget, dataSet }: TriggeredEvent) => {
            if (relatedTarget === aVehicle.chassisBody) {
                const [x, y, z] = dataSet.split(',');
                cameraHelper.cameraPosition.set(Number(x), Number(y), Number(z));
            }
        },
    );

    const checkpointManager = new CheckpointManager(scene, {
        finish: finishIcon3d,
        checkpoint: checkpointIcon3d,
    });

    const gameProgress = new GameProgressManager(mapBuilder, checkpointManager);
    gameProgress.loadMap();

    inputHandler.addKeyPressListener(() => {
        if (inputHandler.isKeyPressed('M')) {
            mapBuilder.toggleEditMode();
        }

        if (inputHandler.isKeyPressed('P')) {
            pause();
        }

        if (inputHandler.isKeyPressed('O')) {
            // console.log(cameraHelper.camera.position);
            // gameProgress.openModal('mapFinished');
        }

        if (inputHandler.isKeyPressed('R')) {
            reset();
        }

        if (inputHandler.isKeyPressed('C')) {
            cameraHelper.switchMode();
        }

        let engineForceDirection: -1|0|1 = 0;
        let steeringDirection: -1|0|1 = 0;

        if (inputHandler.isKeyPressed('W', 'ArrowUp')) {
            engineForceDirection = 1;
        } else if (inputHandler.isKeyPressed('S', 'ArrowDown')) {
            engineForceDirection = -1;
        }
        if (inputHandler.isKeyPressed('A', 'ArrowLeft')) {
            steeringDirection = 1;
        } else if (inputHandler.isKeyPressed('D', 'ArrowRight')) {
            steeringDirection = -1;
        }
        if (!gameProgress.started && engineForceDirection) {
            gameProgress.start();
        }

        aVehicle.setEngineForceDirection(engineForceDirection);
        aVehicle.setSteeringDirection(steeringDirection);
        aVehicle.setBrakeForce(Number(inputHandler.isKeyPressed(' ')));
    });

    function reset() {
        gameProgress.reset();
    }

    function pause() {
        paused = !paused;

        if (!paused) {
            render();
            if (gameProgress.started) {
                gameProgress.start();
            }
        } else {
            showNotification('paused');
            if (gameProgress.started) {
                gameProgress.stop();
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

Object.defineProperty(window, 'aspectRatio', {
    get() {
        return window.innerWidth / window.innerHeight;
    },
});
