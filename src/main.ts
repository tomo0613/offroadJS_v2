import { SAPBroadphase, World } from 'cannon-es';
import wireframeRenderer from 'cannon-es-debugger';
import { CubeTexture, DirectionalLight, LightProbe, Mesh, Scene, Vector2, WebGLRenderer } from 'three';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { SVGResult } from 'three/examples/jsm/loaders/SVGLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

import { CameraHandler, CameraMode } from './cameraHandler';
import cfg from './config';
import { GameProgressManager } from './gameProgress/gameProgressManager';
import inputHandler from './inputHandler';
import { CheckpointManager } from './mapModules/checkpointManager';
import {
    MapBuilder, TriggerMapElementEvent, TriggeredEvent, MapBuilderEvent, vehicleMapElementId,
} from './mapModules/mapBuilder';
import { MouseSelectHandler } from './mapModules/mouseSelectHandler';
import { initTransformControls } from './mapModules/transformControls';
import { mountMenuRoot } from './menu/menu';
import { confirmDialog, showNotification } from './notificationModules/notificationManager';
import * as utils from './utils';
import Vehicle from './vehicle/Vehicle';

const worldStep = 1 / 60;

if (cfg.fullscreen) {
    confirmDialog('Allow fullscreen?').then((confirmed) => {
        if (confirmed) {
            document.documentElement.requestFullscreen();
        } else {
            cfg.fullscreen = false;
        }
    });
}

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

    const renderer = new WebGLRenderer({ antialias: cfg.antialias, powerPreference: cfg.powerPreference });
    renderer.setPixelRatio(window.devicePixelRatio); // cfg.renderScale;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = cfg.renderShadows;

    const cameraHandler = new CameraHandler(renderer.domElement);

    // setup postprocessing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, cameraHandler.camera);
    const resolution = new Vector2(window.innerWidth, window.innerHeight);
    const outlinePass = new OutlinePass(resolution, scene, cameraHandler.camera);
    outlinePass.visibleEdgeColor.setHex(0xE67300);
    outlinePass.hiddenEdgeColor.setHex(0x663300);
    composer.addPass(renderPass);

    document.body.appendChild(renderer.domElement);
    window.onresize = utils.debounce(onWindowResize, 500);

    const [aVehicle, finishIcon3d, checkpointIcon3d] = await loadAssets() as [Vehicle, Mesh, Mesh];

    cameraHandler.setCameraTarget(aVehicle);
    cameraHandler.camera.aspect = window.aspectRatio;
    cameraHandler.camera.updateProjectionMatrix();

    const mapBuilder = new MapBuilder(scene, world);
    const checkpointManager = new CheckpointManager(scene, {
        finish: finishIcon3d,
        checkpoint: checkpointIcon3d,
    });
    const gameProgress = new GameProgressManager(mapBuilder, checkpointManager);

    const mouseSelectHandler = new MouseSelectHandler(scene, cameraHandler.camera, renderer.domElement, mapBuilder);
    const transformControls = initTransformControls(cameraHandler, mapBuilder);
    scene.add(transformControls);

    mountMenuRoot(gameProgress, renderer);

    mapBuilder.onPlaceVehicle = (pX = 0, pY = 0, pZ = 0, rX = 0, rY = 0, rZ = 0) => {
        aVehicle.initialPosition.set(pX, pY, pZ);
        aVehicle.initialRotation.setFromEuler(utils.degToRad(rX), utils.degToRad(rY), utils.degToRad(rZ));
        aVehicle.resetPosition();
    };
    mapBuilder.eventTriggerListeners.add(
        TriggerMapElementEvent.setCameraPosition,
        ({ relatedTarget, dataSet }: TriggeredEvent) => {
            if (relatedTarget === aVehicle.chassisBody) {
                const [x, y, z] = dataSet.split(',');
                cameraHandler.cameraPosition.set(Number(x), Number(y), Number(z));
            }
        },
    );
    mapBuilder.eventTriggerListeners.add(
        TriggerMapElementEvent.setCameraMode,
        ({ relatedTarget, dataSet }: TriggeredEvent) => {
            if (relatedTarget === aVehicle.chassisBody) {
                const [cameraMode, x, y, z] = dataSet.split(',');
                cameraHandler.cameraMode = cameraMode as CameraMode;
                if (x || y || z) {
                    cameraHandler.cameraPosition.set(Number(x), Number(y), Number(z));
                }
            }
        },
    );
    mapBuilder.eventTriggerListeners.add(
        TriggerMapElementEvent.startAnimation,
        ({ relatedTarget, dataSet }: TriggeredEvent) => {
            if (relatedTarget === aVehicle.chassisBody) {
                const animatedMapElementId = dataSet;
                const body = mapBuilder.getBodyFromStore(animatedMapElementId);
                const {
                    velocity_x, velocity_y, velocity_z,
                } = mapBuilder.getAnimationPropsFromStore(animatedMapElementId);

                body.velocity.set(velocity_x, velocity_y, velocity_z);
            }
        },
    );
    mapBuilder.eventTriggerListeners.add(
        TriggerMapElementEvent.reset,
        ({ relatedTarget }: TriggeredEvent) => {
            if (relatedTarget === aVehicle.chassisBody) {
                gameProgress.reset();
            }
        },
    );
    mapBuilder.listeners.add(MapBuilderEvent.mapElementSelect, (selectedMapElementId: string) => {
        outlinePass.selectedObjects.length = 0;
        transformControls.detach();

        if (selectedMapElementId === vehicleMapElementId) {
            outlinePass.selectedObjects.push(aVehicle.chassisMesh, ...aVehicle.wheelMeshes);
        } else if (selectedMapElementId) {
            const selectedMesh = mapBuilder.getMeshFromStore(selectedMapElementId);
            outlinePass.selectedObjects.push(selectedMesh);
            transformControls.attach(selectedMesh);
        }
    });
    inputHandler.addKeyPressListener((keyPressed) => {
        switch (keyPressed) {
            case 'M':
                toggleEditMode();
                break;
            case 'P':
                pause();
                break;
            case 'O':
                console.log(cameraHandler.camera.position);
                break;
            case 'R':
                reset();
                break;
            case 'C':
                cameraHandler.switchMode();
                break;
            default:
        }
    });
    inputHandler.addKeyDownListener((keysDown) => {
        let engineForceDirection: -1|0|1 = 0;
        let steeringDirection: -1|0|1 = 0;

        if (keysDown.has('W') || keysDown.has('ArrowUp')) {
            engineForceDirection = 1;
        } else if (keysDown.has('S') || keysDown.has('ArrowDown')) {
            engineForceDirection = -1;
        }
        if (keysDown.has('A') || keysDown.has('ArrowLeft')) {
            steeringDirection = 1;
        } else if (keysDown.has('D') || keysDown.has('ArrowRight')) {
            steeringDirection = -1;
        }
        if (!gameProgress.started && engineForceDirection) {
            gameProgress.start();
        }

        aVehicle.setEngineForceDirection(engineForceDirection);
        aVehicle.setSteeringDirection(steeringDirection);
        aVehicle.setBrakeForce(Number(keysDown.has(' ')));
    });

    gameProgress.loadMap();

    function toggleEditMode() {
        mapBuilder.toggleEditMode();

        if (mapBuilder.editMode) {
            composer.addPass(outlinePass);
            transformControls.enabled = true;
            mouseSelectHandler.enabled = true;
            if (mapBuilder.selectedMapElementId) {
                transformControls.attach(mapBuilder.getMeshFromStore(mapBuilder.selectedMapElementId));
            }
        } else {
            composer.passes.splice(1, 1);
            transformControls.detach();
            transformControls.enabled = false;
            mouseSelectHandler.enabled = false;
        }
    }

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

        cameraHandler.update();
        gameProgress.updateHUD();

        checkpointManager.updateVisuals(dt);

        composer.render();

        // update physics
        world.step(worldStep);
    }

    function onWindowResize() {
        cameraHandler.camera.aspect = window.aspectRatio;
        cameraHandler.camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        outlinePass.setSize(window.innerWidth, window.innerHeight);
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
