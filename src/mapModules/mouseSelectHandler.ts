import { Camera, Object3D, Raycaster, Scene, Vector2, Intersection, Mesh } from 'three';

import { MapBuilder } from './mapBuilder';

export class MouseSelectHandler {
    private _enabled = false;
    private scene: Scene;
    private camera: Camera;
    private domElement: HTMLElement;
    private mapBuilder: MapBuilder
    private raycaster = new Raycaster();
    private mousePosition = new Vector2();
    private raycastResult = [] as Intersection[];
    hoveredObject: Object3D;
    onSelect?: VoidFnc;

    constructor(scene: Scene, camera: Camera, domElement: HTMLElement, mapBuilder: MapBuilder) {
        this.camera = camera;
        this.scene = scene;
        this.domElement = domElement;
        this.mapBuilder = mapBuilder;
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(enabled: boolean) {
        if (this._enabled === enabled) {
            return;
        }
        if (enabled) {
            this.domElement.addEventListener('click', this.onClick);
        } else {
            this.domElement.removeEventListener('click', this.onClick);
            this.hoveredObject = undefined;
        }
        this._enabled = enabled;
    }

    onClick = (e: MouseEvent) => {
        if (!e.altKey) {
            return;
        }
        this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mousePosition, this.camera);

        this.raycastResult.length = 0;
        this.raycaster.intersectObjects(this.scene.children, true, this.raycastResult);

        const { mapElementIdList } = this.mapBuilder;
        let selectedMapElementMesh: Object3D;

        for (let i = 0; i < this.raycastResult.length; i++) {
            const objectAtIntersection = this.raycastResult[i].object;

            if (mapElementIdList.includes(objectAtIntersection.name)) {
                selectedMapElementMesh = objectAtIntersection;
                break;
            } else if (mapElementIdList.includes(objectAtIntersection.parent.name)) {
                selectedMapElementMesh = objectAtIntersection.parent;
                break;
            }
        }

        if (selectedMapElementMesh) {
            this.mapBuilder.selectMapElement(selectedMapElementMesh.name);
        }
    }
}
