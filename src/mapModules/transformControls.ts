import { MathUtils } from 'three';
// eslint-disable-next-line import/extensions
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { CameraHandler } from '../CameraHandler';
import inputHandler from '../inputHandler';
import { round, throttle } from '../utils';
import { MapBuilder } from './mapBuilder';

const { radToDeg } = MathUtils;

export function initTransformControls(cameraHandler: CameraHandler, mapBuilder: MapBuilder) {
    const transformControls = new TransformControls(cameraHandler.camera, cameraHandler.domElement);
    let dragging = false;
    let orbitControlsEnabled = false;

    function changeHandler() {
        const mesh = transformControls.object;
        const mapElementId = mesh.name;

        mapBuilder.translate(mapElementId, {
            position_x: round(mesh.position.x),
            position_y: round(mesh.position.y),
            position_z: round(mesh.position.z),
            rotation_x: round(radToDeg(mesh.rotation.x)),
            rotation_y: round(radToDeg(mesh.rotation.y)),
            rotation_z: round(radToDeg(mesh.rotation.z)),
        });
    }

    transformControls.addEventListener('objectChange', throttle(changeHandler, 100));

    transformControls.addEventListener('dragging-changed', (e) => {
        if (dragging) {
            // drag end
            cameraHandler.orbitControls.enabled = orbitControlsEnabled;
        } else {
            // drag start
            orbitControlsEnabled = cameraHandler.orbitControls.enabled;
            cameraHandler.orbitControls.enabled = false;
        }
        dragging = Boolean(e.value);
    });

    inputHandler.addKeyPressListener('KeyG', () => {
        if (transformControls.mode === 'translate') {
            transformControls.setMode('rotate');
        } else {
            transformControls.setMode('translate');
        }
    });

    inputHandler.addKeyDownChangeListener((keysDown) => {
        if (keysDown.has('ShiftLeft')) {
            transformControls.setTranslationSnap(1);
        } else {
            transformControls.setTranslationSnap(null);
        }
    });

    return transformControls;
}
