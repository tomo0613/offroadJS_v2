import { PerspectiveCamera, Vector3 } from 'three';
// eslint-disable-next-line import/extensions
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import cfg from './config';
import { popUpNotification } from './notificationModules/notificationManager';
import { noop } from './utils';
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

const xAxis = new Vector3(0, 1, 0);
const cameraSpeed = 0.2;
const chaseCameraMountOffset = new Vector3(...cfg.camera.mountOffset_v3);
const chaseCameraLookOffset = new Vector3(...cfg.camera.lookOffset_v3);
// const chaseCameraMinDistance = chaseCameraMountOffset.distanceTo(new Vector3(0, 0, 0));

// chase-camera reverse "swing": orbit the camera around the car's up axis so it ends up looking
// in the travel direction when reversing. Driven by the signed forward speed (m/s) with a deadzone
// for hysteresis; the angle is eased toward its target so the camera lags/swings around smoothly.
const chaseUpAxis = new Vector3(0, 1, 0);
const chaseLocalForward = new Vector3(0, 0, -1); // car front in its local frame
const chaseReverseSwingTargetAngle = Math.PI;
const chaseReverseSpeedThreshold = -1; // below this -> reversing
const chaseForwardSpeedThreshold = 0.5; // above this -> driving forward
const chaseReverseSwingSmoothing = 0.1; // smaller = snappier swing
const tmp_forward = new Vector3();

export class CameraHandler {
    domElement: HTMLElement;
    camera: PerspectiveCamera;
    orbitControls: OrbitControls;
    cameraTarget?: Vehicle;
    cameraPosition = new Vector3();
    private currentCameraMode?: CameraMode;
    private idealChaseCameraLookPosition = new Vector3();
    private idealChaseCameraMountPosition = new Vector3();
    private actualChaseCameraLookPosition = new Vector3();
    private chaseReverseSwing = 0; // current orbit angle (rad): 0 = behind, PI = swung to front
    private chaseReverseSwingTarget = 0;
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
                this.camera.position.copy(this.cameraTargetPosition);
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
                // start behind the car and snap straight to the ideal pose (no swing-in from elsewhere)
                this.chaseReverseSwing = 0;
                this.chaseReverseSwingTarget = 0;
                this.setIdealChaseCameraMountPosition();
                this.setIdealChaseCameraLookPosition();
                this.camera.position.copy(this.idealChaseCameraMountPosition);
                this.actualChaseCameraLookPosition.copy(this.idealChaseCameraLookPosition);
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
                this.orbitControls.target.copy(this.cameraTargetPosition);

                popUpNotification('Camera mode is set to: "free" (use mouse to look around)');
                break;
            default:
        }

        this.currentCameraMode = mode;
    }

    get cameraTargetPosition() {
        return this.cameraTarget.chassisMesh.position;
    }

    rotate(angle: number) {
        this.camera.rotateOnAxis(xAxis, angle);
    }

    setIdealChaseCameraMountPosition() {
        // place the camera behind & above the car (rear = local +z), orbited by the reverse swing
        this.idealChaseCameraMountPosition
            .copy(chaseCameraMountOffset)
            .applyAxisAngle(chaseUpAxis, this.chaseReverseSwing)
            .applyQuaternion(this.cameraTarget.chassisMesh.quaternion)
            .add(this.cameraTargetPosition);

        // do not let camera below target
        if (this.idealChaseCameraMountPosition.y < this.cameraTargetPosition.y) {
            this.idealChaseCameraMountPosition.setY(this.cameraTargetPosition.y);
        }
    }

    setIdealChaseCameraLookPosition() {
        // look at a point ahead of the car (local -z = front), orbited by the same reverse swing
        this.idealChaseCameraLookPosition
            .copy(chaseCameraLookOffset)
            .applyAxisAngle(chaseUpAxis, this.chaseReverseSwing)
            .applyQuaternion(this.cameraTarget.chassisMesh.quaternion)
            .add(this.cameraTargetPosition);
    }

    private updateReverseSwing(delta: number) {
        // signed speed along the car's forward axis: negative = reversing
        const velocity = this.cameraTarget.chassisBody.linvel();
        tmp_forward.copy(chaseLocalForward).applyQuaternion(this.cameraTarget.chassisMesh.quaternion);
        const forwardSpeed = velocity.x * tmp_forward.x + velocity.y * tmp_forward.y + velocity.z * tmp_forward.z;

        if (forwardSpeed < chaseReverseSpeedThreshold) {
            this.chaseReverseSwingTarget = chaseReverseSwingTargetAngle;
        } else if (forwardSpeed > chaseForwardSpeedThreshold) {
            this.chaseReverseSwingTarget = 0;
        } // else: within the deadzone -> hold the current target (hysteresis)

        // frame-rate independent easing -> the camera lags/swings around smoothly
        const t = 1 - chaseReverseSwingSmoothing ** delta;
        this.chaseReverseSwing += (this.chaseReverseSwingTarget - this.chaseReverseSwing) * t;
    }

    updateDynamicCamera(delta: number) {
        // https://github.com/mrdoob/three.js/issues/7346
        if (this.camera.position.manhattanDistanceTo(this.cameraPosition) > Number.EPSILON) {
            const t = 1 - cameraSpeed ** delta;
            this.camera.position.lerp(this.cameraPosition, t);
        }

        this.camera.lookAt(this.cameraTargetPosition);
    }

    updateChaseCamera(delta: number) {
        this.updateReverseSwing(delta);
        this.setIdealChaseCameraMountPosition();
        this.setIdealChaseCameraLookPosition();

        // distance-based damping: snap quicker when far behind (after a turn), drift when close
        // https://www.youtube.com/watch?v=UuNPHOJ_V5o&t=650s
        const dt = 1 - this.calculateCameraSpeedByDistance(this.idealChaseCameraMountPosition) ** delta;

        this.camera.position.lerp(this.idealChaseCameraMountPosition, dt);
        this.actualChaseCameraLookPosition.lerp(this.idealChaseCameraLookPosition, dt);

        this.camera.lookAt(this.actualChaseCameraLookPosition);
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

    private calculateCameraSpeedByDistance(targetPosition: Vector3) {
        const cameraSpeedFastest = 0.001;
        const cameraSpeedSlowest = 0.2;
        const minDistance = 10;
        const maxDistance = 50;

        const distanceToTargetPosition = this.camera.position.distanceTo(targetPosition);
        const clampedDistance = Math.min(Math.max(distanceToTargetPosition, minDistance), maxDistance);
        const normalizedDistance = (clampedDistance - minDistance) / (maxDistance - minDistance);

        return cameraSpeedSlowest + (cameraSpeedFastest - cameraSpeedSlowest) * normalizedDistance;
    }
}

