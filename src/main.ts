import { AmbientLight, CubeTexture, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { ConvexPolyhedron, SAPBroadphase, Vec3, World } from 'cannon-es';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import wireframeRenderer from 'cannon-es-debugger';

import * as utils from './utils';
import { PlatformBuilder } from './platformBuilder';
import Vehicle from './vehicle/vehicle';
import cameraHandler from './cameraHandler';
import cfg from './config';
import inputHandler from './inputHandler';

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

    const camera = new PerspectiveCamera(cfg.camera.fov, getAspectRatio(), cfg.camera.near, cfg.camera.far);
    cameraHandler.init(camera, renderer.domElement);

    window.onresize = utils.debounce(onWindowResize, 500);

    await loadAssets();

    const platformBuilder = new PlatformBuilder(scene, world);
    // ground
    platformBuilder.buildBox({ width: 15, height: 0.1, length: 15 });

    platformBuilder.buildBox({ width: 2, height: 0.1, length: 10, position: new Vec3(-3, 10, -25) });
    platformBuilder.buildBox({
        width: 2, height: 0.1, length: 15, position: new Vec3(-3, 4, -25), rotation: Math.PI / 20,
    });

    const testId = platformBuilder.buildRamp({ width: 2, length: 2, position: new Vec3(-5, 0.1, -5) });
    platformBuilder.buildRamp({ width: 2, length: 2, height: 2, position: new Vec3(-5, 2.1, -9) });
    platformBuilder.buildBox({ width: 2, height: 4, length: 1, position: new Vec3(-7, 4, -9) });
    platformBuilder.buildBox({ width: 2, height: 4, length: 1, position: new Vec3(1, 4, -9) });

    platformBuilder.buildBox({ mass: 40, position: new Vec3(5, 3, 0) });

    inputHandler.addKeyPressListener(() => {
        if (inputHandler.isKeyPressed('J')) {
            // platformBuilder.translate(testId, { rotation: v += 0.1 });
        } else if (inputHandler.isKeyPressed('K')) {
            //
        }
    });

    platformBuilder.buildCylinder({ sides: 4, radiusBottom: 4, height: 0.5, position: new Vec3(-10, 0.5, 10) });

    platformBuilder.buildCylinder({
        radiusTop: 2,
        radiusBottom: 2,
        height: 2,
        mass: 20,
        sides: 16,
        position: new Vec3(-3, 12, -30),
        // position: new Vec3(-3, 6, -15),
        rotation: Math.PI / 2,
        rotationAxis: Vec3.UNIT_Z,
    });

    platformBuilder.showGUI();

    wireframeRenderer(scene, world.bodies);
    render();

    function render() {
        // if (pause) {
        //     return;
        // }
        requestAnimationFrame(render);

        // update physics
        world.step(worldStep);

        // cameraHandler.update();

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

        inputHandler.addKeyPressListener(() => {
            if (inputHandler.isKeyPressed('R')) {
                vehicle.resetPosition();
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

            vehicle.setEngineForce(engineForce);
            vehicle.setSteeringValue(steeringValue);
            vehicle.setBrakeForce(Number(inputHandler.isKeyPressed(' ')));
        });
    }
})();

function getAspectRatio() {
    return window.innerWidth / window.innerHeight;
}
