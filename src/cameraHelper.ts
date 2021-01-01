import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import cfg from './config';
import { showNotification } from './notificationModules/notificationManager';
import { NOP, valueBetween } from './utils';
import Vehicle from './vehicle/Vehicle';

export enum CameraMode {
    dynamic = 'dynamic',
    free = 'free',
    chase = 'chase',
    hood = 'hood',
}

const cameraModeList = [
    CameraMode.dynamic,
    CameraMode.free,
    CameraMode.chase,
    CameraMode.hood,
];

const chaseCameraMountPosition = new Vector3();
const chaseCameraLookPosition = new Vector3();

export class CameraHelper {
    camera: PerspectiveCamera;
    orbitControls: OrbitControls;
    cameraTarget?: Vehicle;
    cameraPosition = new Vector3();
    cameraSpeed = 0.03;
    private currentCameraMode?: CameraMode;
    chaseCameraMountPositionHelper = new Object3D();
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
        if (this.currentCameraMode === mode) {
            return;
        }

        switch (this.currentCameraMode) {
            case CameraMode.dynamic:
            case CameraMode.chase:
                this.update = NOP;
                break;
            case CameraMode.hood:
                this.chaseCameraMountPositionHelper.getWorldPosition(chaseCameraMountPosition);
                this.camera.position.copy(chaseCameraMountPosition);
                this.cameraPosition.copy(chaseCameraMountPosition);

                this.cameraTarget.chassisMesh.remove(this.camera);
                this.camera.fov = cfg.camera.fov;
                this.camera.updateProjectionMatrix();
                break;
            case CameraMode.free:
                this.orbitControls.enabled = false;
                break;
            default:
        }

        switch (mode) {
            case CameraMode.dynamic:
                this.update = this.updateDynamicCamera;
                showNotification('Camera mode is set to: "dynamic"');
                break;
            case CameraMode.chase:
                this.update = this.updateChaseCamera;
                showNotification('Camera mode is set to: "chase"');
                break;
            case CameraMode.hood:
                this.cameraTarget.chassisMesh.add(this.camera);
                this.camera.position.set(0, 1.1, -0.47);
                this.camera.rotation.set(0, 0, 0);
                this.camera.fov = 60;
                this.camera.updateProjectionMatrix();
                this.update = NOP;
                showNotification('Camera mode is set to: "hood"');
                break;
            case CameraMode.free:
                this.orbitControls.enabled = true;
                showNotification('Camera mode is set to: "free" (use mouse to look around)');
                break;
            default:
        }

        this.currentCameraMode = mode;
    }

    updateDynamicCamera() {
        if (!this.camera.position.equals(this.cameraPosition)) {
            this.camera.position.lerp(this.cameraPosition, this.cameraSpeed);
        }
        if (this.cameraTarget) {
            this.camera.lookAt(this.cameraTarget.chassisMesh.position);
        }
    }

    updateChaseCamera() {
        const cameraLookTarget = this.cameraTarget?.chassisMesh;
        const { currentVehicleSpeedKmHour: speed } = this.cameraTarget.base;

        if (!cameraLookTarget) {
            return;
        }

        this.chaseCameraMountPositionHelper.getWorldPosition(chaseCameraMountPosition);

        if (chaseCameraMountPosition.y < cameraLookTarget.position.y) {
            chaseCameraMountPosition.setY(cameraLookTarget.position.y);
        }

        this.camera.position.lerp(chaseCameraMountPosition, this.cameraSpeed);

        chaseCameraLookPosition.copy(cameraLookTarget.position);
        chaseCameraLookPosition.y += valueBetween(speed * -0.01, -4, 4);
        this.camera.lookAt(chaseCameraLookPosition);
    }

    switchMode() {
        const currentModeIndex = cameraModeList.indexOf(this.currentCameraMode);
        const nextModeIndex = currentModeIndex < cameraModeList.length - 1 ? currentModeIndex + 1 : 0;
        const nextMode = cameraModeList[nextModeIndex] as CameraMode;

        this.cameraMode = nextMode;
    }

    setCameraTarget(cameraTarget?: Vehicle) {
        const cameraLookTarget = cameraTarget.chassisMesh;
        if (cameraTarget === this.cameraTarget) {
            return;
        }
        if (cameraTarget) {
            const { x, y, z } = cfg.vehicle.cameraMountPosition;
            cameraLookTarget.add(this.chaseCameraMountPositionHelper);
            this.chaseCameraMountPositionHelper.position.set(x, y, z);
        } else if (!cameraTarget && this.cameraTarget) {
            cameraLookTarget.remove(this.chaseCameraMountPositionHelper);
        }
        this.cameraTarget = cameraTarget;

        this.cameraMode = CameraMode.dynamic;
    }
}
