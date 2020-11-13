import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import cfg from './config';
import { showPopUpMessage } from './notificationModules/notificationManager';
import { NOP } from './utils';
import Vehicle from './vehicle/vehicle';

enum CameraMode {
    'dynamic',
    'free',
    'chase',
    'hood',
}

const cameraModeList = [
    CameraMode.dynamic,
    CameraMode.free,
    CameraMode.chase,
    CameraMode.hood,
];

const tmp_vector3 = new Vector3();
const tmp_vector3_2 = new Vector3();
const tmp_vector3_3 = new Vector3(0, 2, 0);

export class CameraHelper {
    camera: PerspectiveCamera;
    orbitControls: OrbitControls;
    cameraTarget?: Vehicle;
    cameraPosition = new Vector3();
    cameraSpeed = 0.03;
    private currentCameraMode?: CameraMode;
    private previousCameraMode?: CameraMode;
    chaseCameraPositionHelper = new Object3D();
    update = NOP;

    constructor(domElement: HTMLElement) {
        this.camera = new PerspectiveCamera(cfg.camera.fov, window.aspectRatio, cfg.camera.near, cfg.camera.far);
        this.camera.position.set(
            cfg.camera.initialPosition.x, cfg.camera.initialPosition.y, cfg.camera.initialPosition.z,
        );
        this.cameraPosition.copy(this.camera.position);

        this.orbitControls = new OrbitControls(this.camera, domElement);
        this.orbitControls.minDistance = 1;
        this.orbitControls.enabled = false;
    }

    set cameraMode(mode: CameraMode) {
        if (this.previousCameraMode === mode) {
            return;
        }

        this.previousCameraMode = this.currentCameraMode;
        this.currentCameraMode = mode;

        switch (this.previousCameraMode) {
            case CameraMode.dynamic:
            case CameraMode.chase:
                this.update = NOP;
                break;
            case CameraMode.hood:
                this.cameraTarget.chassisMesh.remove(this.camera);
                this.camera.fov = cfg.camera.fov;
                break;
            case CameraMode.free:
                this.orbitControls.enabled = false;
                break;
            default:
        }

        switch (this.currentCameraMode) {
            case CameraMode.dynamic:
                this.update = this.updateDynamicCamera;
                showPopUpMessage('Camera mode is set to: "dynamic"');
                break;
            case CameraMode.chase:
                this.update = this.updateChaseCamera;
                showPopUpMessage('Camera mode is set to: "chase"');
                break;
            case CameraMode.hood:
                this.cameraTarget.chassisMesh.add(this.camera);
                this.camera.position.set(0, 1.1, 0);
                this.camera.rotation.set(0, 0, 0);
                this.camera.fov = 70;
                this.update = NOP;
                showPopUpMessage('Camera mode is set to: "hood"');
                break;
            case CameraMode.free:
                this.orbitControls.enabled = true;
                showPopUpMessage('Camera mode is set to: "free" (use mouse to look around)');
                break;
            default:
        }
    }

    updateDynamicCamera() {
        this.camera.position.lerp(this.cameraPosition, this.cameraSpeed);

        if (this.cameraTarget) {
            this.camera.lookAt(this.cameraTarget.chassisMesh.position);
        }
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

        this.camera.position.lerp(tmp_vector3, this.cameraSpeed);

        tmp_vector3_2.copy(cameraTargetObject.position).add(tmp_vector3_3);
        this.camera.lookAt(tmp_vector3_2);
    }

    switchMode() {
        const currentModeIndex = cameraModeList.indexOf(this.currentCameraMode);
        const nextModeIndex = currentModeIndex < cameraModeList.length - 1 ? currentModeIndex + 1 : 0;
        const nextMode = cameraModeList[nextModeIndex] as CameraMode;

        this.cameraMode = nextMode;
    }

    setCameraTarget(cameraTarget?: Vehicle) {
        const cameraTargetObject = cameraTarget.chassisMesh;
        if (cameraTarget === this.cameraTarget) {
            return;
        }
        if (cameraTarget) {
            cameraTargetObject.add(this.chaseCameraPositionHelper);
            this.chaseCameraPositionHelper.position.set(0, 3, 10);
        } else if (!cameraTarget && this.cameraTarget) {
            cameraTargetObject.remove(this.chaseCameraPositionHelper);
        }
        this.cameraTarget = cameraTarget;

        this.cameraMode = CameraMode.dynamic;
    }
}
