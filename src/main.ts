import { AmbientLight, CubeTexture, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { SAPBroadphase, Vec3, World } from 'cannon-es';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import wireframeRenderer from 'cannon-es-debugger';

import * as utils from './utils';
import Vehicle from './vehicle';
import cameraHandler from './cameraHandler';
import cfg from './config';
import inputHandler from './inputHandler';
import platforms from './platforms';

const worldStep = 1 / 60;

(async function init() {
    const scene = new Scene();

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    const sunLight = new DirectionalLight(0xf5f4d3, 0.9);
    sunLight.position.set(-1, 100, -1).normalize();
    scene.add(ambientLight);
    scene.add(sunLight);

    const world = new World();
    const { x: gravityX, y: gravityY, z: gravityZ } = cfg.world.gravity;
    world.gravity.set(gravityX, gravityY, gravityZ);
    world.broadphase = new SAPBroadphase(world);
    world.defaultContactMaterial.friction = 0.001;

    const renderer = new WebGLRenderer(/* {antialias: true} */);
    // renderer.gammaOutput = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(cfg.camera.fov, getAspectRatio(), cfg.camera.near, cfg.camera.far);
    cameraHandler.init(camera, renderer.domElement);

    window.onresize = utils.debounce(onWindowResize, 500);

    await loadAssets();

    platforms.init(scene, world);
    platforms.create({
        width: 15,
        height: 0.1,
        length: 15,
        position: new Vec3(0, 0, 0),
    });
    platforms.create({
        width: 5,
        height: 0.1,
        length: 15,
        position: new Vec3(10, 0, -30),
    });
    platforms.createBox({
        size: 1,
        mass: 40,
        position: new Vec3(10, 2, 0),
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
