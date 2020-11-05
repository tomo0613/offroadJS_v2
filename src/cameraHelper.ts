import { Object3D, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import cfg from './config';
import { map1 } from './maps';
import { NOP } from './utils';
import Vehicle from './vehicle/vehicle';

const cameraModes = ['chase', 'hood'] as const;

type CameraMode = typeof cameraModes[number];

const cameraSpeed = 0.05;

// const v_1 = new Vector3(0, 0, 0);
const tmp_vector3 = new Vector3();
const tmp_vector3_2 = new Vector3();
const tmp_vector3_3 = new Vector3(0, 2, 0);
// const sphere = new SphereBufferGeometry();
// const object = new Mesh(sphere, new MeshBasicMaterial());
// object.position.set(0, 2, 5);

export class CameraHelper {
    camera: PerspectiveCamera;
    cameraTarget?: Vehicle;
    cameraMode: CameraMode = cameraModes[0];
    chaseCameraPositionHelper = new Object3D();
    // chaseCameraPositionHelper = new Vector3();
    chaseCameraRotationHelper = new Quaternion();
    update = NOP;

    constructor(camera: PerspectiveCamera) {
        this.chaseCameraPositionHelper.position.set(0, 3, 10);
        camera.position.set(cfg.camera.initialPosition.x, cfg.camera.initialPosition.y, cfg.camera.initialPosition.z);
        this.camera = camera;
    }

    initOrbitCamera(domElement: HTMLElement) {
        const cameraController = new OrbitControls(this.camera, domElement);
        cameraController.minDistance = 1;
        this.camera.position.set(
            cfg.camera.initialPosition.x,
            cfg.camera.initialPosition.y,
            cfg.camera.initialPosition.z,
        );
        cameraController.update();
    }

    updateChaseCamera() {
        const cameraTargetObject = this.cameraTarget.chassisMesh;
        if (!cameraTargetObject) {
            return;
        }

        this.chaseCameraPositionHelper.getWorldPosition(tmp_vector3);

        if (tmp_vector3.y < cameraTargetObject.position.y) {
            tmp_vector3.setY(cameraTargetObject.position.y);
        }

        this.camera.position.lerp(tmp_vector3, cameraSpeed);

        tmp_vector3_2.copy(cameraTargetObject.position).add(tmp_vector3_3);
        this.camera.lookAt(tmp_vector3_2);
    }

    switchMode(mode?: CameraMode) {
        let nextMode: CameraMode;

        if (mode) {
            nextMode = mode;
        } else {
            const currentModeIndex = cameraModes.indexOf(this.cameraMode);
            const nextModeIndex = currentModeIndex < cameraModes.length - 1 ? currentModeIndex + 1 : 0;
            nextMode = cameraModes[nextModeIndex];
        }

        switch (nextMode) {
            case 'chase':
                this.update = this.updateChaseCamera;
                break;
            case 'hood':
                this.cameraTarget.chassisMesh.add(this.camera);
                this.camera.position.set(0, 1.5, 0);
                this.camera.rotation.set(0, 0, 0);
                this.camera.fov = 70;
                this.update = NOP;
                break;
            // case 'fixedAngle':
            default:
                break;
        }
    }

    setCameraTarget(cameraTarget?: Vehicle) {
        const cameraTargetObject = cameraTarget.chassisMesh;
        if (cameraTarget === this.cameraTarget) {
            return;
        }
        if (cameraTarget) {
            cameraTargetObject.add(this.chaseCameraPositionHelper);
        } else if (!cameraTarget && this.cameraTarget) {
            cameraTargetObject.remove(this.chaseCameraPositionHelper);
        }
        this.cameraTarget = cameraTarget;
    }
}
