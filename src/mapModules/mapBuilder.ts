import {
    Body,
    Box,
    ContactEquation,
    ContactMaterial,
    ConvexPolyhedron,
    Cylinder,
    Material,
    Shape,
    Sphere,
    Vec3,
    World,
} from 'cannon-es';
import {
    BoxBufferGeometry,
    BufferGeometry,
    CylinderBufferGeometry,
    Geometry,
    Mesh,
    MeshLambertMaterial,
    Scene,
    SphereBufferGeometry,
    Vector3,
} from 'three';
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';

import EventListener from '../common/EventListener';
import cfg from '../config';
import { renderEditor } from '../mapEditorUI/editor';
import { degToRad, NOP } from '../utils';
import { generateLoop, generateSlopeTransition } from './compoundPlatformGenerator';

export enum MapBuilderEvent {
    select = 'select',
}

export enum MapTriggerElementEvent {
    checkpoint = 'checkpoint',
    finish = 'finish',
    setCameraPosition = 'setCameraPosition',
}

export enum MapElementType {
    box = 'box',
    cylinder = 'cylinder',
    ramp = 'ramp',
    sphere = 'sphere',
    triangularRamp = 'triangularRamp',
    trigger = 'trigger',
    vehicle = 'vehicle',
}

export interface MapElementOrientationProps {
    position_x?: number;
    position_y?: number;
    position_z?: number;
    rotation_x?: number;
    rotation_y?: number;
    rotation_z?: number;
}

interface CommonMapElementProps extends MapElementOrientationProps {
    type?: MapElementType;
    mass?: number;
    lowFriction?: boolean;
    fixedRotation?: boolean;
}

interface BoxShapeProps {
    width?: number;
    height?: number;
    length?: number;
}

interface BoxShapePropsSimple {
    size?: number;
}

interface CylinderShapeProps {
    radiusTop?: number;
    radiusBottom?: number;
    height?: number;
    sides?: number;
}

interface EventTriggerProps {
    event?: MapTriggerElementEvent|string;
    size?: number;
    position_x?: number;
    position_y?: number;
    position_z?: number;
    dataSet?: string;
}

interface CollisionEvent {
    type: typeof Body.COLLIDE_EVENT_NAME;
    body: Body | null;
    contact: ContactEquation | null;
    target: Body;
}

export interface TriggeredEvent {
    target: Body;
    relatedTarget: Body | null;
    dataSet?: string;
}

type MapElementId = string;
type BoxProps = CommonMapElementProps & BoxShapeProps;
type BoxPropsSimple = CommonMapElementProps & BoxShapePropsSimple;
type CylinderProps = CommonMapElementProps & CylinderShapeProps;
export type MapElementProps = BoxProps & CylinderProps & EventTriggerProps;
export type PlatformComponentStore = Map<string, Mesh|Body|VoidFnc|MapElementProps>;

const defaultPlatformColor = 0xDDDDDD;
const dynamicPlatformColor = 0x95C0E5;
const normalMaterial = new Material('normalMaterial');
const lowFrictionMaterial = new Material('lowFrictionMaterial');
const normal_to_normal_cm = new ContactMaterial(normalMaterial, normalMaterial, {
    friction: 1e-3,
});
const normal_to_lowFriction_cm = new ContactMaterial(normalMaterial, lowFrictionMaterial, {
    friction: 0,
    contactEquationStiffness: 1e8,
});
let gId = 0;

export class MapBuilder {
    scene: Scene;
    world: World;
    selectedMapElementId: MapElementId;
    perviousSelectedMapElementId: MapElementId;
    private mapElementComponentStore: PlatformComponentStore = new Map();
    private mapElementIdStore = new Set<string>();
    listeners = new EventListener<MapBuilderEvent>();
    eventTriggerListeners = new EventListener<MapTriggerElementEvent>();
    editMode = false;
    onPlaceVehicle = NOP as (pX: number, pY: number, pZ: number, rX: number, rY: number, rZ: number) => void;

    constructor(scene: Scene, world: World) {
        this.scene = scene;
        this.world = world;

        window.importMap = this.importMap;
        window.exportMap = this.exportMap;

        world.addContactMaterial(normal_to_normal_cm);
        world.addContactMaterial(normal_to_lowFriction_cm);
    }

    get mapElementIdList() {
        return Array.from(this.mapElementIdStore);
    }

    getBodyFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_body`) as Body;
    }

    getMeshFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_mesh`) as Mesh;
    }

    getPropsFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_props`) as MapElementProps;
    }

    private addToWorld(visualShape: Geometry | BufferGeometry, physicalShape: Shape, props: MapElementProps) {
        const mapElementId = `${props.type}_${gId++}`;
        const {
            position_x = 0,
            position_y = 0,
            position_z = 0,
            rotation_x = 0,
            rotation_y = 0,
            rotation_z = 0,
            mass = 0,
            lowFriction = false,
            fixedRotation = false,
        } = props;

        const color = mass ? dynamicPlatformColor : defaultPlatformColor;
        const mesh = new Mesh(visualShape, new MeshLambertMaterial({ color }));
        const body = new Body({
            shape: physicalShape,
            mass,
            material: lowFriction ? lowFrictionMaterial : normalMaterial,
        });
        const updateVisuals = () => {
            mesh.position.copy(body.position as unknown as Vector3);
            mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        };

        body.position.set(position_x, position_y, position_z);
        mesh.position.copy(body.position as unknown as Vector3);
        mesh.name = mapElementId;

        if (rotation_x || rotation_y || rotation_z) {
            body.quaternion.setFromEuler(
                degToRad(rotation_x),
                degToRad(rotation_y),
                degToRad(rotation_z),
            );
            mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        }
        if (fixedRotation) {
            body.fixedRotation = true;
            body.updateMassProperties();
        }

        if (cfg.renderShadows) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        this.world.addBody(body);
        this.scene.add(mesh);

        if (mass) {
            this.world.addEventListener('postStep', updateVisuals);
        }

        body.aabbNeedsUpdate = true;

        this.mapElementIdStore.add(mapElementId);
        this.mapElementComponentStore.set(`${mapElementId}_mesh`, mesh);
        this.mapElementComponentStore.set(`${mapElementId}_body`, body);
        this.mapElementComponentStore.set(`${mapElementId}_updateMethod`, updateVisuals);
        this.mapElementComponentStore.set(`${mapElementId}_props`, props);

        if (this.editMode) {
            this.selectPlatform(mapElementId);
        }

        return mapElementId;
    }

    destroy = (id: MapElementId) => {
        if (id === 'vehicle_0') {
            return;
        }
        const [type] = id.split('_');
        const body = this.getBodyFromStore(id);
        const mesh = this.getMeshFromStore(id);
        mesh.geometry.dispose();
        (mesh.material as MeshLambertMaterial).dispose();

        this.scene.remove(mesh);
        this.world.removeBody(body);
        this.world.removeEventListener('postStep', this.mapElementComponentStore.get(`${id}_updateMethod`) as VoidFnc);

        if (type === 'trigger') {
            const listener = this.mapElementComponentStore.get(`${id}_listener`) as VoidFnc;
            body.removeEventListener(Body.COLLIDE_EVENT_NAME, listener);
            this.mapElementComponentStore.delete(`${id}_listener`);
        }

        this.mapElementIdStore.delete(id);
        this.mapElementComponentStore.delete(`${id}_mesh`);
        this.mapElementComponentStore.delete(`${id}_body`);
        this.mapElementComponentStore.delete(`${id}_updateMethod`);
        this.mapElementComponentStore.delete(`${id}_props`);

        if (this.selectedMapElementId === id) {
            this.selectedMapElementId = undefined;
            this.listeners.dispatch(MapBuilderEvent.select, this.selectedMapElementId);
        }
        if (this.perviousSelectedMapElementId === id) {
            this.perviousSelectedMapElementId = undefined;
        }
    }

    selectPlatform = (id: MapElementId) => {
        if (this.selectedMapElementId) {
            this.perviousSelectedMapElementId = this.selectedMapElementId;
        }

        this.selectedMapElementId = id;
        this.listeners.dispatch(MapBuilderEvent.select, this.selectedMapElementId);

        this.highlightSelectedPlatform();
    }

    private highlightSelectedPlatform() {
        if (this.perviousSelectedMapElementId) {
            const previousSelected = this.getMeshFromStore(this.perviousSelectedMapElementId);
            if (previousSelected) {
                const material = previousSelected.material as MeshLambertMaterial;
                material.color.setHex(0xFFFFFF);
                // material.transparent = true;
                // material.opacity = 0.7;
            }
        }
        const selected = this.getMeshFromStore(this.selectedMapElementId);
        if (selected) {
            (selected.material as MeshLambertMaterial).color.setHex(0xFFC266);
        }
    }

    toggleEditMode() {
        this.editMode = !this.editMode;

        if (this.editMode) {
            renderEditor(this);
            this.mapElementIdList.forEach((id) => {
                this.setEventTriggerVisibility(id, true);
            });
            document.getElementById('editorPanel').classList.remove('hidden');
        } else {
            this.mapElementIdList.forEach((id) => {
                this.setEventTriggerVisibility(id, false);
            });
            document.getElementById('editorPanel').classList.add('hidden');
        }
    }

    clone(id: MapElementId) {
        const props = { ...this.getPropsFromStore(id) };

        return this.build(props.type, props);
    }

    build(type: MapElementType, props: BoxPropsSimple|BoxProps|CylinderProps = {}) {
        switch (type) {
            case MapElementType.box:
                return this.buildBox(props);
            case MapElementType.cylinder:
                return this.buildCylinder(props);
            case MapElementType.ramp:
                return this.buildRamp(props);
            case MapElementType.sphere:
                return this.buildSphere(props);
            case MapElementType.triangularRamp:
                return this.buildTriangularRamp(props);
            case MapElementType.trigger:
                return this.placeEventTrigger(props);
            default:
                return '';
        }
    }

    buildBox(props: BoxPropsSimple): string;
    buildBox(props: BoxProps): string;
    buildBox(props: BoxPropsSimple & BoxProps) {
        const { size = 1, width = size, height = size, length = size } = props;

        return this.addToWorld(
            new BoxBufferGeometry(width * 2, height * 2, length * 2),
            new Box(new Vec3(width, height, length)),
            { type: MapElementType.box, ...props },
        );
    }

    buildCylinder(props: CylinderProps) {
        const { radiusTop = 1, radiusBottom = 1, height = 1, sides = 6 } = props;
        const cylinderSides = Math.max(3, sides);

        return this.addToWorld(
            new CylinderBufferGeometry(radiusTop, radiusBottom, height * 2, cylinderSides),
            new Cylinder(radiusTop, radiusBottom, height * 2, cylinderSides),
            { type: MapElementType.cylinder, ...props },
        );
    }

    buildRamp(props: BoxProps) {
        const shape = getRampShape(props.width, props.height, props.length);

        return this.addToWorld(
            new ConvexBufferGeometry(shape.vertices.map(({ x, y, z }) => new Vector3(x, y, z))),
            shape,
            { type: MapElementType.ramp, ...props },
        );
    }

    buildSphere(props: BoxPropsSimple) {
        const { size = 1 } = props;

        return this.addToWorld(
            new SphereBufferGeometry(size),
            new Sphere(size),
            { type: MapElementType.sphere, ...props },
        );
    }

    buildTriangularRamp(props: BoxProps) {
        const shape = getTriangularRampShape(props.width, props.height, props.length);

        return this.addToWorld(
            new ConvexBufferGeometry(shape.vertices.map(({ x, y, z }) => new Vector3(x, y, z))),
            shape,
            { type: MapElementType.triangularRamp, ...props },
        );
    }

    placeEventTrigger(props: EventTriggerProps) {
        const { event = MapTriggerElementEvent.setCameraPosition, dataSet = '', size = 1 } = props;

        const triggerId = this.addToWorld(
            new SphereBufferGeometry(size),
            new Sphere(size),
            { type: MapElementType.trigger, ...props },
        );
        const triggerElement = this.getBodyFromStore(triggerId);
        const mesh = this.getMeshFromStore(triggerId);
        const material = mesh.material as MeshLambertMaterial;
        const listener = ({ target, body }: CollisionEvent) => {
            this.eventTriggerListeners.dispatch(
                event as MapTriggerElementEvent,
                { target, dataSet, relatedTarget: body },
            );
        };

        this.mapElementComponentStore.set(`${triggerId}_listener`, listener);

        triggerElement.collisionResponse = false;
        triggerElement.addEventListener(Body.COLLIDE_EVENT_NAME, listener);

        material.color.setHex(0xCD72D3);
        material.transparent = true;
        material.opacity = 0.3;

        if (!this.editMode) {
            mesh.visible = false;
        }

        return triggerId;
    }

    placeVehicle(props: CommonMapElementProps) {
        const mapElementId = 'vehicle_0';
        const {
            position_x: pX, position_y: pY, position_z: pZ, rotation_x: rX, rotation_y: rY, rotation_z: rZ,
        } = props;

        this.mapElementIdStore.add(mapElementId);
        this.mapElementComponentStore.set(`${mapElementId}_props`, { type: MapElementType.vehicle, ...props });
        this.mapElementComponentStore.set(`${mapElementId}_updateMethod`, () => {
            const {
                position_x, position_y, position_z, rotation_x, rotation_y, rotation_z,
            } = this.getPropsFromStore(mapElementId);
            this.onPlaceVehicle(position_x, position_y, position_z, rotation_x, rotation_y, rotation_z);
        });

        this.onPlaceVehicle(pX, pY, pZ, rX, rY, rZ);
    }

    setEventTriggerVisibility(id: MapElementId, visible = false) {
        if (id.startsWith('trigger')) {
            const mesh = this.getMeshFromStore(id);
            mesh.visible = visible;
        }
    }

    resetDynamicMapElements() {
        this.mapElementIdList.forEach(this.resetElementIfDynamic);
    }

    resetElementIfDynamic = (id: MapElementId) => {
        const {
            type,
            mass,
            position_x = 0,
            position_y = 0,
            position_z = 0,
            rotation_x = 0,
            rotation_y = 0,
            rotation_z = 0,
        } = this.getPropsFromStore(id);

        if (type === MapElementType.vehicle) {
            this.onPlaceVehicle(position_x, position_y, position_z, rotation_x, rotation_y, rotation_z);
            return;
        }
        if (!mass) {
            return;
        }
        const body = this.getBodyFromStore(id);
        body.velocity.copy(Vec3.ZERO);
        body.angularVelocity.copy(Vec3.ZERO);

        body.position.set(position_x, position_y, position_z);
        body.quaternion.setFromEuler(
            degToRad(rotation_x),
            degToRad(rotation_y),
            degToRad(rotation_z),
        );
    }

    translate(id: MapElementId, props: CommonMapElementProps) {
        const body = this.getBodyFromStore(id);
        const mapElementProps = this.getPropsFromStore(id);
        const updateVisuals = this.mapElementComponentStore.get(`${id}_updateMethod`) as VoidFnc;

        Object.assign(mapElementProps, { ...props });

        if (body) {
            const {
                position_x = 0,
                position_y = 0,
                position_z = 0,
                rotation_x = 0,
                rotation_y = 0,
                rotation_z = 0,
            } = mapElementProps;

            body.position.set(
                position_x,
                position_y,
                position_z,
            );
            body.quaternion.setFromEuler(
                degToRad(rotation_x),
                degToRad(rotation_y),
                degToRad(rotation_z),
            );
            body.aabbNeedsUpdate = true;
        }

        updateVisuals();
    }

    transform(id: MapElementId, props: BoxProps & BoxPropsSimple & CylinderProps) {
        const mesh = this.getMeshFromStore(id);
        const body = this.getBodyFromStore(id);
        const storedProps = this.getPropsFromStore(id);
        const shape = body.shapes[0];
        const {
            size = storedProps.size || 1,
            width = storedProps.width || size,
            height = storedProps.height || size,
            length = storedProps.length || size,
            radiusBottom = storedProps.radiusBottom || 1,
            radiusTop = storedProps.radiusTop || 1,
            sides = storedProps.sides || 6,
        } = props;
        const cylinderSides = Math.max(3, sides);
        let transformedShape: Shape;
        let transformedGeometry: BufferGeometry;

        switch (storedProps.type) {
            case MapElementType.box:
                (shape as Box).halfExtents.set(width, height, length);
                (shape as Box).updateConvexPolyhedronRepresentation();
                transformedShape = shape;
                transformedGeometry = new BoxBufferGeometry(width * 2, height * 2, length * 2);
                Object.assign(this.getPropsFromStore(id), { width, height, length });
                break;
            case MapElementType.cylinder:
                transformedShape = new Cylinder(radiusTop, radiusBottom, height * 2, cylinderSides);
                transformedGeometry = new CylinderBufferGeometry(radiusTop, radiusBottom, height * 2, cylinderSides);
                Object.assign(this.getPropsFromStore(id), { radiusTop, radiusBottom, height, sides: cylinderSides });
                break;
            case MapElementType.ramp:
                transformedShape = getRampShape(width, height, length);
                transformedGeometry = new ConvexBufferGeometry(
                    (transformedShape as ConvexPolyhedron).vertices.map(({ x, y, z }) => new Vector3(x, y, z)),
                );
                Object.assign(this.getPropsFromStore(id), { width, height, length });
                break;
            case MapElementType.sphere:
            case MapElementType.trigger:
                transformedShape = new Sphere(size);
                transformedGeometry = new SphereBufferGeometry(size);
                Object.assign(this.getPropsFromStore(id), { size });
                break;
            case MapElementType.triangularRamp:
                transformedShape = getTriangularRampShape(width, height, length);
                transformedGeometry = new ConvexBufferGeometry(
                    (transformedShape as ConvexPolyhedron).vertices.map(({ x, y, z }) => new Vector3(x, y, z)),
                );
                Object.assign(this.getPropsFromStore(id), { width, height, length });
                break;
            default:
        }

        body.shapes.length = 0;
        body.addShape(transformedShape);

        mesh.geometry.dispose();
        mesh.geometry = transformedGeometry;
    }

    // ToDo
    setMass(id: MapElementId, mass: number) {
        Object.assign(this.getPropsFromStore(id), { mass });
    }

    importMap = (mapData: Record<string, MapElementProps>) => {
        this.mapElementIdStore.forEach(this.destroy);
        gId = 0;

        Object.entries(mapData).forEach(([id, props]) => {
            const [type] = id.split('_') as [MapElementType];

            if (type === MapElementType.vehicle) {
                this.placeVehicle(props);
            } else {
                this.build(type, props);
            }
        });

        // generateLoop.call(this, {
        //     position: new Vec3(40, 2, -50),
        //     segmentWidth: 3,
        //     segmentHeight: 0.3,
        //     segmentLength: 1,
        //     segmentCount: 10,
        //     width: 10,
        //     radius: 10,
        // });

        // generateSlopeTransition.call(this, {
        //     position: new Vec3(20, 0.1, 1),
        //     segmentCount: 15,
        //     segmentWidth: 3,
        //     segmentHeight: 0.2,
        //     segmentLength: 2,
        // });
    }

    exportMap = () => {
        const exportData = Array.from(this.mapElementComponentStore.entries())
            .filter(([key]) => key.endsWith('props'))
            .reduce((data, [key, props]) => {
                const id = key.replace('_props', '');
                const { type, ...mapElementProps } = props as MapElementProps;
                data[id] = mapElementProps;

                return data;
            }, {} as Record<string, Omit<MapElementProps, 'type'>>);

        return exportData;
    }
}

function getRampShape(width = 1, height = 1, length = 1) {
    // List of vertices that can be assigned to a face
    const vertices = [
        new Vec3(0, 0, 0),
        new Vec3(width * 2, 0, 0),
        new Vec3(width * 2, height * 2, 0),
        new Vec3(0, height * 2, 0),
        new Vec3(0, 0, length * 2),
        new Vec3(width * 2, 0, length * 2),
    ];
    // List of vertex index groups that are assigned to individual faces
    // ! CCW order is important for correct normals !
    const faces = [
        [0, 3, 2, 1],
        [2, 3, 4, 5],
        [0, 1, 5, 4],
        [5, 1, 2],
        [4, 3, 0],
    ];

    return new ConvexPolyhedron({ vertices, faces });
}

function getTriangularRampShape(width = 1, height = 1, length = 1) {
    const vertices = [
        new Vec3(0, 0, 0),
        new Vec3(width * 2, 0, 0),
        new Vec3(0, height * 2, 0),
        new Vec3(0, 0, length * 2),
    ];
    const faces = [
        [0, 2, 1],
        [1, 2, 3],
        [0, 1, 3],
        [3, 2, 0],
    ];

    return new ConvexPolyhedron({ vertices, faces });
}
