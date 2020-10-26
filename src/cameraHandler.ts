import { Camera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import cfg from './config';

// let cameraNeedsUpdate = false;

export default {
    init,
    update,
};

function init(camera: Camera, domElement: HTMLElement) {
    const cameraController = new OrbitControls(camera, domElement);
    // cameraController.target.copy(target.model.position);
    cameraController.minDistance = 1;
    camera.position.set(cfg.camera.initialPosition.x, cfg.camera.initialPosition.y, cfg.camera.initialPosition.z);
    cameraController.update();
}

function update() {
    // if (!cameraNeedsUpdate) {
    //     return;
    // }
    //
}

function switchCamera() {
    //
}
