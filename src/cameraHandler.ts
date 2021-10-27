import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import cfg from './config';
import { popUpNotification } from './notificationModules/notificationManager';
import { noop, valueBetween } from './utils';
import Vehicle from './vehicle/Vehicle';

export enum CameraMode {
    cinematic = 'cinematic',
    free = 'free',
    chase = 'chase',
    hood = 'hood',
}

const cameraModeList = [
    CameraMode.cinematic,
    CameraMode.free,
    CameraMode.chase,
    CameraMode.hood,
];

const chaseCameraMountOffset = new Vector3(0, 5, 10);
const chaseCameraLookOffset = new Vector3(0, 1, -5);

export class CameraHandler {
    domElement: HTMLElement;
    camera: PerspectiveCamera;
    orbitControls: OrbitControls;
    cameraTarget?: Vehicle;
    cameraPosition = new Vector3();
    cameraSpeed = 0.2;
    private currentCameraMode?: CameraMode;
    private idealChaseCameraLookPosition = new Vector3();
    private idealChaseCameraMountPosition = new Vector3();
    private actualChaseCameraLookPosition = new Vector3();
    update = noop as (delta: number) => void;

    constructor(domElement: HTMLElement) {
        this.domElement = domElement;
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
            case CameraMode.cinematic:
            case CameraMode.chase:
                this.update = noop;
                break;
            case CameraMode.hood:
                this.cameraTarget.chassisMesh.remove(this.camera);
                this.camera.position.copy(this.cameraTarget.chassisMesh.position);
                this.camera.position.y += 5;

                this.camera.fov = cfg.camera.fov;
                this.camera.updateProjectionMatrix();
                break;
            case CameraMode.free:
                this.orbitControls.enabled = false;
                break;
            default:
        }

        switch (mode) {
            case CameraMode.cinematic:
                this.update = this.updateDynamicCamera;
                popUpNotification('Camera mode is set to: "cinematic"');
                break;
            case CameraMode.chase:
                this.update = this.updateChaseCamera;
                popUpNotification('Camera mode is set to: "chase"');
                break;
            case CameraMode.hood:
                this.cameraTarget.chassisMesh.add(this.camera);
                this.camera.position.set(0, 1.1, -0.47);
                this.camera.rotation.set(0, 0, 0);
                this.camera.fov = 60;
                this.camera.updateProjectionMatrix();
                this.update = noop;
                popUpNotification('Camera mode is set to: "hood"');
                break;
            case CameraMode.free:
                this.orbitControls.enabled = true;
                popUpNotification('Camera mode is set to: "free" (use mouse to look around)');
                break;
            default:
        }

        this.currentCameraMode = mode;
    }

    setIdealChaseCameraMountPosition() {
        this.idealChaseCameraMountPosition.copy(chaseCameraMountOffset);
        this.idealChaseCameraMountPosition.applyQuaternion(this.cameraTarget.chassisMesh.quaternion);
        this.idealChaseCameraMountPosition.add(this.cameraTarget.chassisMesh.position);

        // do not let camera below target
        if (this.idealChaseCameraMountPosition.y < this.cameraTarget.chassisMesh.position.y) {
            this.idealChaseCameraMountPosition.setY(this.cameraTarget.chassisMesh.position.y);
        }
    }

    setIdealChaseCameraLookPosition() {
        this.idealChaseCameraLookPosition.copy(chaseCameraLookOffset);
        this.idealChaseCameraLookPosition.applyQuaternion(this.cameraTarget.chassisMesh.quaternion);
        this.idealChaseCameraLookPosition.add(this.cameraTarget.chassisMesh.position);
    }

    updateDynamicCamera(delta: number) {
        if (!this.camera.position.equals(this.cameraPosition)) {
            const t = 1 - this.cameraSpeed ** delta;
            this.camera.position.lerp(this.cameraPosition, t);
        }
        if (this.cameraTarget) {
            this.camera.lookAt(this.cameraTarget.chassisMesh.position);
        }
    }

    updateChaseCamera(delta: number) {
        const cameraLookTarget = this.cameraTarget?.chassisMesh;
        // const { currentVehicleSpeedKmHour: speed } = this.cameraTarget.base;

        if (!cameraLookTarget) {
            return;
        }

        this.setIdealChaseCameraMountPosition();
        this.setIdealChaseCameraLookPosition();

        // https://www.youtube.com/watch?v=UuNPHOJ_V5o&t=650s
        const dt = 1 - this.cameraSpeed ** delta;

        this.camera.position.lerp(this.idealChaseCameraMountPosition, dt);
        this.actualChaseCameraLookPosition.lerp(this.idealChaseCameraLookPosition, dt);

        this.camera.lookAt(this.idealChaseCameraLookPosition);
    }

    switchMode() {
        const currentModeIndex = cameraModeList.indexOf(this.currentCameraMode);
        const nextModeIndex = currentModeIndex < cameraModeList.length - 1 ? currentModeIndex + 1 : 0;
        const nextMode = cameraModeList[nextModeIndex] as CameraMode;

        this.cameraMode = nextMode;
    }

    setCameraTarget(cameraTarget?: Vehicle) {
        if (cameraTarget === this.cameraTarget) {
            return;
        }
        this.cameraTarget = cameraTarget;
    }
}
