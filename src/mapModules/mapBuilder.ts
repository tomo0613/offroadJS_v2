import { Body, BODY_TYPES, ContactEquation, ContactMaterial, Material, Quaternion, Vec3, World } from 'cannon-es';
import { Group, Mesh, MeshLambertMaterial, Scene, Vector3, Euler, MathUtils, ColorRepresentation } from 'three';

import EventListener from '../common/EventListener';
import cfg from '../config';
import { mountEditorPanel } from '../mapEditorUI/editor';
import { ColorPicker } from '../uiComponents';
import { noop } from '../utils';
import { AnimationProps, defineAnimationProps } from './animatedMapElementHelper';
import { getBaseElementComponents } from './baseMapElementComponents';
import {
    compoundShapes, getCompoundElementChildrenPropertyList, LoopProps, SlopeTransitionProps, CantedCurveProps,
} from './compoundMapElementComponents';

const { degToRad } = MathUtils;

export enum MapBuilderEvent {
    mapElementChange = 'mapElementChange',
    mapElementSelect = 'mapElementSelect',
    editModeChange = 'editModeChange',
}

export enum TriggerMapElementEvent {
    checkpoint = 'checkpoint',
    finish = 'finish',
    reset = 'reset',
    setCameraMode = 'setCameraMode',
    setCameraPosition = 'setCameraPosition',
    startAnimation = 'startAnimation',
}

export enum MapElementType {
    default = 'default',
    compound = 'compound',
    animated = 'animated',
    trigger = 'trigger',
    vehicle = 'vehicle',
}

export enum MapElementShape {
    box = 'box',
    cylinder = 'cylinder',
    sphere = 'sphere',
    tetrahedron = 'tetrahedron',
    triangularPrism = 'triangularPrism',
    trapezoidalPrism = 'trapezoidalPrism',
    loop = 'loop',
    slopeTransition = 'slopeTransition',
    cantedCurve = 'cantedCurve',
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
    shape?: MapElementShape;
    mass?: number;
    color?: ColorRepresentation;
    lowFriction?: boolean;
    fixedRotation?: boolean;
}

interface BoxShapeProps {
    width?: number;
    height?: number;
    length?: number;
}

interface SphereShapeProps {
    radius?: number;
}

interface CylinderShapeProps {
    radiusTop?: number;
    radiusBottom?: number;
    height?: number;
    sides?: number;
}

interface PrismShapeProps extends BoxShapeProps {
    offset?: number;
    lengthBack?: number;
    lengthTop?: number;
    skew?: number;
}

interface EventTriggerProps {
    event?: TriggerMapElementEvent|string;
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
type CylinderProps = CommonMapElementProps & CylinderShapeProps;
type PrismProps = CommonMapElementProps & PrismShapeProps;
type SphereProps = CommonMapElementProps & SphereShapeProps;
type CompoundProps = LoopProps & SlopeTransitionProps & CantedCurveProps;
export type MapElementProps = BoxProps & CylinderProps & SphereProps & PrismProps & EventTriggerProps & CompoundProps;
export type MapElementComponentStore = Map<string, Mesh|Group|Body|VoidFnc|MapElementProps|AnimationProps>;

export interface MapData {
    meta: {
        author?: string;
        goals?: {
            time?: number;
            respawnCount?: number;
        };
        next?: string;
    };
    elements: MapElementProps[];
}

export const vehicleMapElementId = 'vehicle_0';
const defaultPlatformColor = 0xBBBBBB;
const dynamicPlatformColor = 0x95C0E5;
const kinematicPlatformColor = 0x9FA8BB;
const triggerOutlieColor = 0xCD72D3;

const tmp_euler = new Euler();

let lowFrictionMaterial: Material;
let generalMaterial: Material;
let gId = 0;

ColorPicker.addColorValues(defaultPlatformColor, dynamicPlatformColor, kinematicPlatformColor);

export class MapBuilder {
    scene: Scene;
    world: World;
    selectedMapElementId: MapElementId | undefined;
    perviousSelectedMapElementId: MapElementId;
    private mapElementComponentStore: MapElementComponentStore = new Map();
    private mapElementIdStore = new Set<string>();
    listeners = new EventListener<MapBuilderEvent>();
    eventTriggerListeners = new EventListener<TriggerMapElementEvent>();
    editMode = false;
    onPlaceVehicle = noop as (pX: number, pY: number, pZ: number, rX: number, rY: number, rZ: number) => void;

    constructor(scene: Scene, world: World) {
        this.scene = scene;
        this.world = world;

        const contactMaterials = Object.values(world.contactMaterialTable.data).filter(isContactMaterial);
        const materialMap = contactMaterials.reduce<Map<string, Material>>((m, cm) => {
            const [material_1, material_2] = cm.materials;

            m.set(material_1.name, material_1);
            m.set(material_2.name, material_2);

            return m;
        }, new Map());

        generalMaterial = materialMap.get('general');
        lowFrictionMaterial = materialMap.get('lowFriction');

        mountEditorPanel(this);
    }

    get mapElementIdList() {
        return Array.from(this.mapElementIdStore);
    }

    getBodyFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_body`) as Body;
    }

    getMeshFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_mesh`) as Mesh|Group;
    }

    getPropsFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_props`) as MapElementProps;
    }

    getUpdateMethodFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_updateMethod`) as VoidFnc;
    }

    getAnimationPropsFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_animationProps`) as AnimationProps;
    }

    private addToWorld(body: Body, mesh: Mesh|Group, props: MapElementProps) {
        const mapElementId = `${props.type || props.shape}_${gId++}`;
        const {
            type, mass = 0,
            position_x = 0, position_y = 0, position_z = 0,
            rotation_x = 0, rotation_y = 0, rotation_z = 0,
            fixedRotation = false,
        } = props;

        const updateOrientation = () => {
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

        this.world.addBody(body);
        this.scene.add(mesh);

        if (type === MapElementType.animated) {
            const animationProps = defineAnimationProps(body, props.dataSet);

            body.type = BODY_TYPES.KINEMATIC;

            if (!animationProps.triggerStart) {
                body.velocity.set(animationProps.velocity_x, animationProps.velocity_y, animationProps.velocity_z);
            }

            this.mapElementComponentStore.set(`${mapElementId}_animationProps`, animationProps);
            this.world.addEventListener('preStep', animationProps.movementHandler);
        }

        if (mass || type === MapElementType.animated) {
            this.world.addEventListener('postStep', updateOrientation);
        }

        body.aabbNeedsUpdate = true;

        this.mapElementIdStore.add(mapElementId);
        this.mapElementComponentStore.set(`${mapElementId}_mesh`, mesh);
        this.mapElementComponentStore.set(`${mapElementId}_body`, body);
        this.mapElementComponentStore.set(`${mapElementId}_props`, props);
        this.mapElementComponentStore.set(`${mapElementId}_updateMethod`, updateOrientation);

        if (this.editMode) {
            this.selectMapElement(mapElementId);
        }

        return mapElementId;
    }

    destroy = (id: MapElementId) => {
        if (id === vehicleMapElementId) {
            return;
        }
        const body = this.getBodyFromStore(id);
        const mesh = this.getMeshFromStore(id);
        const { type } = this.getPropsFromStore(id);

        this.scene.remove(mesh);
        this.world.removeBody(body);
        this.world.removeEventListener('postStep', this.getUpdateMethodFromStore(id));

        if (isCompoundMesh(mesh)) {
            (mesh.children as Mesh[]).forEach(disposeGeometryAndMaterial);
        } else {
            disposeGeometryAndMaterial(mesh);
        }

        if (type === MapElementType.trigger) {
            const listener = this.mapElementComponentStore.get(`${id}_listener`) as VoidFnc;
            body.removeEventListener(Body.COLLIDE_EVENT_NAME, listener);
            this.mapElementComponentStore.delete(`${id}_listener`);
        }

        if (type === MapElementType.animated) {
            const animationProps = this.getAnimationPropsFromStore(id);
            this.world.removeEventListener('preStep', animationProps.movementHandler);
            this.mapElementComponentStore.delete(`${id}_animationProps`);
        }

        this.mapElementIdStore.delete(id);
        this.mapElementComponentStore.delete(`${id}_mesh`);
        this.mapElementComponentStore.delete(`${id}_body`);
        this.mapElementComponentStore.delete(`${id}_updateMethod`);
        this.mapElementComponentStore.delete(`${id}_props`);

        if (this.selectedMapElementId === id) {
            this.selectedMapElementId = undefined;
            this.listeners.dispatch(MapBuilderEvent.mapElementSelect, undefined);
        }
        if (this.perviousSelectedMapElementId === id) {
            this.perviousSelectedMapElementId = undefined;
        }
    }

    selectMapElement = (id: MapElementId) => {
        if (this.selectedMapElementId) {
            this.perviousSelectedMapElementId = this.selectedMapElementId;
        }

        this.selectedMapElementId = id;

        this.listeners.dispatch(MapBuilderEvent.mapElementSelect, this.selectedMapElementId);
    }

    toggleEditMode() {
        this.editMode = !this.editMode;

        if (this.editMode) {
            this.mapElementIdList.forEach((id) => {
                this.setEventTriggerVisibility(id, true);
            });
        } else {
            this.mapElementIdList.forEach((id) => {
                this.setEventTriggerVisibility(id, false);
            });
        }

        this.listeners.dispatch(MapBuilderEvent.editModeChange, this.editMode);
    }

    clone(id: MapElementId) {
        return this.build({ ...this.getPropsFromStore(id) });
    }

    build(props: MapElementProps) {
        const meshMaterial = new MeshLambertMaterial({ color: getColorValueByProps(props) });
        const bodyMaterial = props.lowFriction ? lowFrictionMaterial : generalMaterial;
        const mapElementBody = new Body({ mass: props.mass, material: bodyMaterial });
        let mapElementMesh: Mesh|Group;

        if (compoundShapes.includes(props.shape) && !props.type) {
            props.type = MapElementType.compound;
        }

        if (props.type === MapElementType.compound) {
            mapElementMesh = new Group();
            getCompoundElementChildrenPropertyList(props).forEach((childProps) => {
                // ToDo reuse geometries|shapes ?
                const [shape, geometry] = getBaseElementComponents(childProps);
                const mesh = new Mesh(geometry, meshMaterial);

                if (cfg.renderShadows) {
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                }

                tmp_euler.set(
                    degToRad(childProps.rotation_x || 0),
                    degToRad(childProps.rotation_y || 0),
                    degToRad(childProps.rotation_z || 0),
                );
                mesh.quaternion.setFromEuler(tmp_euler);
                mesh.position.set(childProps.position_x, childProps.position_y, childProps.position_z);
                mapElementMesh.add(mesh);
                mapElementBody.addShape(
                    shape,
                    mesh.position as unknown as Vec3,
                    mesh.quaternion as unknown as Quaternion,
                );
            });
        } else {
            const [shape, geometry] = getBaseElementComponents(props);
            mapElementBody.addShape(shape);
            mapElementMesh = new Mesh(geometry, meshMaterial);

            if (cfg.renderShadows) {
                mapElementMesh.castShadow = true;
                mapElementMesh.receiveShadow = true;
            }
        }

        const mapElementId = this
            .addToWorld(mapElementBody, mapElementMesh, props);

        if (props.type === MapElementType.trigger) {
            this.setUpEventTrigger(mapElementId, props);
        }

        return mapElementId;
    }

    setUpEventTrigger(id: MapElementId, props: MapElementProps) {
        const { event = TriggerMapElementEvent.setCameraPosition, dataSet = '0,0,0' } = props;
        const triggerElementBody = this.getBodyFromStore(id);
        const triggerElementMesh = this.getMeshFromStore(id) as Mesh;
        const oldListener = this.mapElementComponentStore.get(`${id}_listener`) as VoidFnc;
        const listener = ({ target, body }: CollisionEvent) => {
            this.eventTriggerListeners.dispatch(
                event as TriggerMapElementEvent,
                { target, dataSet, relatedTarget: body },
            );
        };

        if (oldListener) {
            triggerElementBody.removeEventListener(Body.COLLIDE_EVENT_NAME, oldListener);
        }

        this.mapElementComponentStore.set(`${id}_listener`, listener);

        triggerElementBody.collisionResponse = false;
        triggerElementBody.addEventListener(Body.COLLIDE_EVENT_NAME, listener);

        setMeshColor(triggerElementMesh, triggerOutlieColor, 0.3);

        triggerElementMesh.castShadow = false;
        triggerElementMesh.receiveShadow = false;

        if (!this.editMode) {
            triggerElementMesh.visible = false;
        }
    }

    convertEventTriggerToDefaultElement(id: MapElementId) {
        const mapElementBody = this.getBodyFromStore(id);
        const triggerElementMesh = this.getMeshFromStore(id) as Mesh;

        const listener = this.mapElementComponentStore.get(`${id}_listener`) as VoidFnc;
        mapElementBody.removeEventListener(Body.COLLIDE_EVENT_NAME, listener);
        this.mapElementComponentStore.delete(`${id}_listener`);

        mapElementBody.collisionResponse = true;

        setMeshColor(triggerElementMesh, defaultPlatformColor, 1);
    }

    placeVehicle(props: CommonMapElementProps) {
        const {
            position_x: pX, position_y: pY, position_z: pZ, rotation_x: rX, rotation_y: rY, rotation_z: rZ,
        } = props;

        this.mapElementIdStore.add(vehicleMapElementId);
        this.mapElementComponentStore.set(`${vehicleMapElementId}_props`, { ...props });
        this.mapElementComponentStore.set(`${vehicleMapElementId}_updateMethod`, () => {
            const {
                position_x, position_y, position_z, rotation_x, rotation_y, rotation_z,
            } = this.getPropsFromStore(vehicleMapElementId);
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
            type, mass,
            position_x = 0, position_y = 0, position_z = 0,
            rotation_x = 0, rotation_y = 0, rotation_z = 0,
        } = this.getPropsFromStore(id);

        if (type === MapElementType.vehicle) {
            this.onPlaceVehicle(position_x, position_y, position_z, rotation_x, rotation_y, rotation_z);
            return;
        }
        if (!mass && type !== MapElementType.animated) {
            return;
        }
        const body = this.getBodyFromStore(id);

        if (type === MapElementType.animated) {
            const {
                triggerStart,
                velocity_x, velocity_y, velocity_z,
            } = this.getAnimationPropsFromStore(id);

            if (triggerStart) {
                body.velocity.setZero();
            } else {
                body.velocity.set(velocity_x, velocity_y, velocity_z);
            }
        } else {
            body.velocity.setZero();
            body.angularVelocity.setZero();
        }

        body.position.set(position_x, position_y, position_z);
        body.quaternion.setFromEuler(
            degToRad(rotation_x),
            degToRad(rotation_y),
            degToRad(rotation_z),
        );
    }

    translate(id: MapElementId, translateProps: MapElementOrientationProps) {
        const body = this.getBodyFromStore(id);
        const mapElementProps = this.getPropsFromStore(id);
        const mapElementUpdateMethod = this.getUpdateMethodFromStore(id);

        Object.assign(mapElementProps, { ...translateProps });

        if (body) {
            const {
                position_x = 0, position_y = 0, position_z = 0,
                rotation_x = 0, rotation_y = 0, rotation_z = 0,
            } = mapElementProps;

            body.position.set(position_x, position_y, position_z);
            body.quaternion.setFromEuler(degToRad(rotation_x), degToRad(rotation_y), degToRad(rotation_z));
            body.aabbNeedsUpdate = true;
        }

        mapElementUpdateMethod();
        this.listeners.dispatch(MapBuilderEvent.mapElementChange, { ...mapElementProps });
    }

    transform(id: MapElementId, transformProps: MapElementProps) {
        const mapElementMesh = this.getMeshFromStore(id);
        const mapElementBody = this.getBodyFromStore(id);
        const mapElementProps = this.getPropsFromStore(id);

        Object.assign(mapElementProps, { ...transformProps });

        /*  remove current shape(s)  */
        mapElementBody.shapes.length = 0;
        mapElementBody.shapeOffsets.length = 0;
        mapElementBody.shapeOrientations.length = 0;

        if (isCompoundMesh(mapElementMesh)) {
            const compoundElementChildrenPropertyList = getCompoundElementChildrenPropertyList(mapElementProps);
            const compoundElementChildrenCount = compoundElementChildrenPropertyList.length;
            const leftoverMeshCount = Math.max(0, mapElementMesh.children.length - compoundElementChildrenCount);

            for (let i = 0; i < leftoverMeshCount; i++) {
                const lastChildIndex = mapElementMesh.children.length - 1;
                const childMesh = (mapElementMesh.children as Mesh[])[lastChildIndex];
                childMesh.geometry.dispose();
                mapElementMesh.remove(childMesh);
            }

            for (let i = 0; i < compoundElementChildrenCount; i++) {
                const childProps = compoundElementChildrenPropertyList[i];
                const [transformedShape, transformedGeometry] = getBaseElementComponents(childProps);
                let childMesh = (mapElementMesh.children as Mesh[])[i];

                if (childMesh) {
                    childMesh.geometry.dispose();
                } else {
                    childMesh = new Mesh();
                    childMesh.material = (mapElementMesh.children as Mesh[])[0].material;
                    mapElementMesh.add(childMesh);
                }

                tmp_euler.set(
                    degToRad(childProps.rotation_x || 0),
                    degToRad(childProps.rotation_y || 0),
                    degToRad(childProps.rotation_z || 0),
                );
                childMesh.quaternion.setFromEuler(tmp_euler);
                childMesh.position.set(childProps.position_x, childProps.position_y, childProps.position_z);
                childMesh.geometry = transformedGeometry;
                mapElementBody.addShape(
                    transformedShape,
                    childMesh.position as unknown as Vec3,
                    childMesh.quaternion as unknown as Quaternion,
                );
            }
        } else {
            const [transformedShape, transformedGeometry] = getBaseElementComponents(mapElementProps);

            mapElementBody.addShape(transformedShape);
            mapElementMesh.geometry.dispose();
            mapElementMesh.geometry = transformedGeometry;
        }
        this.listeners.dispatch(MapBuilderEvent.mapElementChange, { ...mapElementProps });
    }

    setAttribute(id: MapElementId, attributeProps: MapElementProps) {
        // 'lowFriction'
        // 'fixedRotation'

        const mapElementProps = this.getPropsFromStore(id);
        const mapElementBody = this.getBodyFromStore(id);
        const prevType = mapElementProps.type;

        Object.assign(mapElementProps, { ...attributeProps });

        if ('color' in attributeProps) {
            setMeshColor(this.getMeshFromStore(id), attributeProps.color);
        }

        if (prevType === MapElementType.trigger && attributeProps.type === MapElementType.default) {
            this.convertEventTriggerToDefaultElement(id);
        } else if ('type' in attributeProps || 'event' in attributeProps || 'dataSet' in attributeProps) {
            this.setUpEventTrigger(id, mapElementProps);

            if (mapElementProps.mass) {
                attributeProps.mass = 0;
            }
        }

        if ('mass' in attributeProps) {
            const mapElementUpdateMethod = this.getUpdateMethodFromStore(id);

            mapElementBody.mass = attributeProps.mass;
            mapElementBody.updateMassProperties();
            mapElementBody.velocity.set(0, 0, 0);
            mapElementBody.angularVelocity.set(0, 0, 0);

            if (attributeProps.mass > 0 && mapElementBody.type === BODY_TYPES.STATIC) {
                mapElementBody.type = BODY_TYPES.DYNAMIC;
                this.world.addEventListener('postStep', mapElementUpdateMethod);
            } else if (!attributeProps.mass && mapElementBody.type === BODY_TYPES.DYNAMIC) {
                mapElementBody.type = BODY_TYPES.STATIC;
                this.world.removeEventListener('postStep', mapElementUpdateMethod);
            }
        }

        this.listeners.dispatch(MapBuilderEvent.mapElementChange, { ...mapElementProps });
    }

    importMap = (mapElementData: MapElementProps[]) => {
        this.mapElementIdStore.forEach(this.destroy);
        gId = 0;

        mapElementData.forEach((props) => {
            if (props.type === MapElementType.vehicle) {
                this.placeVehicle({ ...props });
            } else {
                this.build({ ...props });
            }
        });
    }

    exportMap = () => ({
        meta: {},
        // ToDo remove default values
        elements: Array.from(this.mapElementComponentStore.entries())
            .filter(([key]) => key.endsWith('props'))
            .map(([, value]) => value),
    })
}

function disposeGeometryAndMaterial(mesh: Mesh) {
    mesh.geometry.dispose();
    (mesh.material as MeshLambertMaterial).dispose();
}

export function setMeshColor(mesh: Mesh|Group, colorValue?: ColorRepresentation, opacity?: number) {
    const material = (isCompoundMesh(mesh)
        ? (mesh.children[0] as Mesh).material
        : mesh.material) as MeshLambertMaterial;

    if (colorValue) {
        material.color.set(colorValue);
    }
    if (opacity) {
        material.transparent = opacity < 1;
        material.opacity = opacity;
    }
}

export function getColorValueByProps(mapElementProps: MapElementProps) {
    if (mapElementProps.type === MapElementType.trigger) {
        return triggerOutlieColor;
    }
    if (mapElementProps.type === MapElementType.animated) {
        return kinematicPlatformColor;
    }
    if (mapElementProps.color) {
        return mapElementProps.color;
    }

    return mapElementProps.mass ? dynamicPlatformColor : defaultPlatformColor;
}

function isCompoundMesh(mesh: Mesh|Group): mesh is Group {
    return !!mesh.children.length;
}

function isContactMaterial(value: unknown): value is ContactMaterial {
    return value instanceof ContactMaterial;
}
