import { ContactMaterial, Material, SAPBroadphase, World } from 'cannon-es';
import WireframeRenderer from 'cannon-es-debugger';
import {
    Audio,
    AudioListener,
    AudioLoader,
    Clock,
    CubeTexture,
    DirectionalLight,
    HemisphereLight,
    MathUtils,
    Mesh,
    SRGBColorSpace,
    Scene,
    Vector2,
    WebGLRenderer,
} from 'three';
import { CSM } from 'three/examples/jsm/csm/CSM';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { SVGResult } from 'three/examples/jsm/loaders/SVGLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
// https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';

import { CameraHandler, CameraMode } from './cameraHandler';
import cfg, { configListener } from './config';
import { getCheckpointIcon3d } from './gameProgress/checkpointHandler';
import { GameProgressEvent, GameProgressManager } from './gameProgress/gameProgressManager';
import inputHandler from './inputHandler';
import {
    MapBuilder, TriggerMapElementEvent, TriggeredEvent, MapBuilderEvent, vehicleMapElementId,
} from './mapModules/mapBuilder';
import { MouseSelectHandler } from './mapModules/mouseSelectHandler';
import { initTransformControls } from './mapModules/transformControls';
import { mountMenuRoot } from './menu/menu';
import { confirmDialog, popUpNotification } from './notificationModules/notificationManager';
import * as utils from './utils';
import Vehicle from './vehicle/Vehicle';

const { degToRad } = MathUtils;

const physicsFrameTime = 1 / cfg.physicsFrameRate;

const generalMaterial = new Material('general');
const lowFrictionMaterial = new Material('lowFriction');
const general_to_general_cm = new ContactMaterial(generalMaterial, generalMaterial, {
    friction: 1e-3,
});
const lowFriction_to_general_cm = new ContactMaterial(generalMaterial, lowFrictionMaterial, {
    friction: 0,
    contactEquationStiffness: 1e8,
});

if (cfg.fullscreen) {
    confirmDialog('Allow fullscreen?').then((confirmed) => {
        if (confirmed) {
            document.documentElement.requestFullscreen();
        } else {
            cfg.fullscreen = false;
        }
    });
}

(async function main() {
    let paused = false;
    let cascadedShadowMap: CSM | undefined;
    const clock = new Clock();
    const scene = new Scene();

    const hemisphereLight = new HemisphereLight(0x8BA3B1, 0xBBA877, 4);

    scene.add(hemisphereLight);

    const world = new World();
    const { x: gravityX, y: gravityY, z: gravityZ } = cfg.world.gravity;
    world.gravity.set(gravityX, gravityY, gravityZ);
    world.broadphase = new SAPBroadphase(world);
    world.defaultContactMaterial.friction = 0.001;
    world.addContactMaterial(general_to_general_cm);
    world.addContactMaterial(lowFriction_to_general_cm);

    const wireframeRenderer = WireframeRenderer(scene, world, {
        onInit(body, mesh) {
            configListener.add('renderWireFrame', (renderWireFrame: boolean) => {
                mesh.visible = renderWireFrame;
            });
        },
    });

    const renderer = new WebGLRenderer({ antialias: cfg.antialias, powerPreference: cfg.powerPreference });
    renderer.setPixelRatio(window.devicePixelRatio); // cfg.renderScale;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = cfg.renderShadows;

    const cameraHandler = new CameraHandler(renderer.domElement);
    renderer.domElement.tabIndex = -1; /* OrbitControls sets tabIndex="0" */
    renderer.domElement.focus();

    if (cfg.renderShadows) {
        cascadedShadowMap = new CSM({
            parent: scene,
            camera: cameraHandler.camera,
            cascades: 3,
            maxFar: 500,

            mode: 'logarithmic',
            // mode: 'custom',
            // customSplitsCallback: (cascades, cameraNear, cameraFar, breaks) => {
            //     for (let i = cascades - 1; i >= 0; i--) {
            //         breaks.push((1 / 4) ** i);
            //     }
            // },

            shadowMapSize: 4096 * 2,
            lightIntensity: 1,
            // lightDirection: new Vector3(-30, 50, -30).normalize(),
        });
    } else {
        const directionalLight = new DirectionalLight(0xF5FDFF, 3);
        directionalLight.position.set(-30, 50, -30).normalize();

        scene.add(directionalLight);
    }

    // setup postprocessing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, cameraHandler.camera);
    const resolution = new Vector2(window.innerWidth, window.innerHeight);
    const outlinePass = new OutlinePass(resolution, scene, cameraHandler.camera);
    const gammaCorrectionShaderPass = new ShaderPass(GammaCorrectionShader);
    outlinePass.edgeStrength = 2;
    outlinePass.visibleEdgeColor.setHex(0xE67300);
    outlinePass.hiddenEdgeColor.setHex(0x663300);
    outlinePass.enabled = false;
    gammaCorrectionShaderPass.enabled = false;
    composer.addPass(renderPass);
    composer.addPass(outlinePass);
    composer.addPass(gammaCorrectionShaderPass);

    document.body.appendChild(renderer.domElement);
    window.onresize = utils.debounce(onWindowResize, 500);

    const [vehicleChassis, vehicleWheel, pinIcon3d] = await loadAssets();
    const vehicle = new Vehicle(vehicleChassis, vehicleWheel);
    vehicle.addToWorld(world)
        .addToScene(scene);

    cameraHandler.setCameraTarget(vehicle);
    cameraHandler.cameraMode = CameraMode.cinematic;
    cameraHandler.camera.aspect = window.aspectRatio;
    cameraHandler.camera.updateProjectionMatrix();

    const audioListener = new AudioListener();
    cameraHandler.camera.add(audioListener);
    const audioSource = new Audio(audioListener);
    const audioLoader = new AudioLoader();
    audioLoader.load('music/A Himitsu - Cease.ogg', (buffer) => {
        audioSource.setBuffer(buffer);
        audioSource.setLoop(true);
    });

    const mapBuilder = new MapBuilder(scene, world);

    const gameProgress = new GameProgressManager(mapBuilder, vehicle);
    gameProgress.initCheckpointHandler(scene, {
        checkpoint: getCheckpointIcon3d(),
        finish: pinIcon3d as unknown as Mesh,
    });
    gameProgress.listeners.add(GameProgressEvent.start, () => {
        if (!audioSource.isPlaying) {
            audioSource.play();
        }
    });
    configListener.add('audioVolume', (value) => {
        audioSource.setVolume(value);
    });

    const mouseSelectHandler = new MouseSelectHandler(scene, cameraHandler.camera, renderer.domElement, mapBuilder);
    const transformControls = initTransformControls(cameraHandler, mapBuilder);
    scene.add(transformControls);

    mountMenuRoot(gameProgress, renderer);

    mapBuilder.onPlaceVehicle = (pX = 0, pY = 0, pZ = 0, rX = 0, rY = 0, rZ = 0) => {
        vehicle.initialPosition.set(pX, pY, pZ);
        vehicle.initialRotation.setFromEuler(degToRad(rX), degToRad(rY), degToRad(rZ));
        vehicle.resetPosition();
    };
    mapBuilder.eventTriggerListeners.add(
        TriggerMapElementEvent.setCameraPosition,
        ({ relatedTarget, dataSet }: TriggeredEvent) => {
            if (relatedTarget === vehicle.chassisBody) {
                const [x, y, z] = dataSet.split(',');
                cameraHandler.cameraPosition.set(Number(x), Number(y), Number(z));
            }
        },
    );
    mapBuilder.eventTriggerListeners.add(
        TriggerMapElementEvent.setCameraMode,
        ({ relatedTarget, dataSet }: TriggeredEvent) => {
            if (relatedTarget === vehicle.chassisBody) {
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
            if (relatedTarget === vehicle.chassisBody) {
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
            if (relatedTarget === vehicle.chassisBody) {
                gameProgress.reset();
            }
        },
    );
    mapBuilder.listeners.add(MapBuilderEvent.mapElementSelect, (selectedMapElementId: string | undefined) => {
        outlinePass.selectedObjects.length = 0;
        transformControls.detach();

        if (selectedMapElementId === vehicleMapElementId) {
            outlinePass.selectedObjects.push(vehicle.chassisMesh, ...vehicle.wheelMeshes);
        } else if (selectedMapElementId) {
            const selectedMesh = mapBuilder.getMeshFromStore(selectedMapElementId);
            outlinePass.selectedObjects.push(selectedMesh);
            transformControls.attach(selectedMesh);
        }
    });

    inputHandler.addKeyPressListener('KeyP', () => {
        pause();
    });

    inputHandler.addKeyPressListener('KeyO', () => {
        console.log(
            cameraHandler.camera.position.x,
            ',',
            cameraHandler.camera.position.y,
            ',',
            cameraHandler.camera.position.z,
        );
    });

    inputHandler.addKeyPressListener('KeyR', (e) => {
        if (e.altKey) {
            gameProgress.loadMap();
        } else {
            gameProgress.respawnAtLastCheckpoint();
        }
    });

    inputHandler.addKeyPressListener('KeyC', () => {
        cameraHandler.switchMode();
    });

    inputHandler.addKeyPressListener('KeyM', () => {
        toggleEditMode();
    });

    inputHandler.addKeyPressListener('Delete', () => {
        if (mapBuilder.editMode && mapBuilder.selectedMapElementId) {
            mapBuilder.destroy(mapBuilder.selectedMapElementId);
        }
    });

    inputHandler.addKeyDownChangeListener((keysDown) => {
        let engineForceDirection: -1|0|1 = 0;
        let steeringDirection: -1|0|1 = 0;

        if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) {
            engineForceDirection = 1;
        } else if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) {
            engineForceDirection = -1;
        }
        if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) {
            steeringDirection = 1;
        } else if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) {
            steeringDirection = -1;
        }
        if (!gameProgress.started && engineForceDirection) {
            gameProgress.start();
        }

        vehicle.setEngineForceDirection(engineForceDirection);
        vehicle.setSteeringDirection(steeringDirection);
        vehicle.setBrakeForce(Number(keysDown.has('Space')) as 0|1);
    });

    gameProgress.loadMap();

    function toggleEditMode() {
        mapBuilder.toggleEditMode();

        if (mapBuilder.editMode) {
            outlinePass.enabled = true;
            gammaCorrectionShaderPass.enabled = true;
            transformControls.enabled = true;
            mouseSelectHandler.enabled = true;
            if (mapBuilder.selectedMapElementId) {
                transformControls.attach(mapBuilder.getMeshFromStore(mapBuilder.selectedMapElementId));
            }
        } else {
            outlinePass.enabled = false;
            gammaCorrectionShaderPass.enabled = false;
            transformControls.detach();
            transformControls.enabled = false;
            mouseSelectHandler.enabled = false;
        }
    }

    function pause() {
        paused = !paused;

        if (!paused) {
            clock.start();
            renderer.setAnimationLoop(animationLoop);
            if (gameProgress.started) {
                gameProgress.start();
            }
        } else {
            clock.stop();
            renderer.setAnimationLoop(null);
            popUpNotification('paused');
            if (gameProgress.started) {
                gameProgress.stop();
            }
        }
    }

    // start animation loop
    renderer.setAnimationLoop(animationLoop);

    function animationLoop() {
        const delta = clock.getDelta();

        cameraHandler.update(delta);
        gameProgress.updateHUD();

        gameProgress.checkpointHandler.updateVisuals(delta);

        if (cascadedShadowMap) {
            cascadedShadowMap.update();
        }

        composer.render();

        // update physics
        world.step(physicsFrameTime, delta);

        if (cfg.renderWireFrame) {
            wireframeRenderer.update();
        }
    }

    function onWindowResize() {
        cameraHandler.camera.aspect = window.aspectRatio;
        cameraHandler.camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        outlinePass.setSize(window.innerWidth, window.innerHeight);
    }

    async function loadAssets() {
        const [cubeTexture, wheelGLTF, chassisGLTF, pinIcon] = await Promise.all([
            utils.loadResource<HTMLImageElement>('img/skybox.jpg', '398 kB'),
            utils.loadResource<GLTF>('3D_objects/lowPoly_car_wheel.gltf', '205 kB'),
            utils.loadResource<GLTF>('3D_objects/mg.glb', '98 kB'),
            utils.loadResource<SVGResult>('img/pin.svg', '0.9 kB'),
        ]);

        const skyBox = new CubeTexture(utils.sliceCubeTexture(cubeTexture));
        skyBox.needsUpdate = true;
        skyBox.colorSpace = SRGBColorSpace;
        scene.background = skyBox;

        return [
            chassisGLTF.scene,
            wheelGLTF.scene,
            utils.svgToMesh(pinIcon, { x: -6, y: -3, scale: 0.07 }),
        ];
    }
})();

Object.defineProperty(window, 'aspectRatio', {
    get() {
        return window.innerWidth / window.innerHeight;
    },
});
