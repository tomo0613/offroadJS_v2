import RAPIER from '@dimforge/rapier3d-compat';
import {
    Group, Mesh, MeshLambertMaterial, Scene, Euler, MathUtils, ColorRepresentation, Quaternion as _Quaternion,
} from 'three';

import EventListener from '../common/EventListener';
import cfg from '../config';
import { mountEditorPanel } from '../mapEditorUI/editor';
import {
    defaultInteractionGroups,
    PhysicsWorld,
    sensorInteractionGroups,
} from '../physics/rapierRuntime';
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
    convexGeometry = 'convexGeometry',
    box = 'box',
    cylinder = 'cylinder',
    sphere = 'sphere',
    tetrahedron = 'tetrahedron',
    triangularPrism = 'triangularPrism',
    trapezoidalPrism = 'trapezoidalPrism',
    loop = 'loop',
    slopeTransition = 'slopeTransition',
    cantedCurve = 'cantedCurve',
    cantedCurveB = 'cantedCurveB',
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

interface ConvexGeometryShapeProps {
    points?: [number, number, number][];
}

interface EventTriggerProps {
    event?: TriggerMapElementEvent|string;
    dataSet?: string;
}

interface CollisionEvent {
    body: RAPIER.RigidBody | null;
    target: RAPIER.RigidBody;
}

export interface TriggeredEvent {
    target: RAPIER.RigidBody;
    relatedTarget: RAPIER.RigidBody | null;
    dataSet?: string;
}

type MapElementId = string;
type ConvexGeometryProps = CommonMapElementProps & ConvexGeometryShapeProps;
type BoxProps = CommonMapElementProps & BoxShapeProps;
type CylinderProps = CommonMapElementProps & CylinderShapeProps;
type SphereProps = CommonMapElementProps & SphereShapeProps;
type PrismProps = CommonMapElementProps & PrismShapeProps;
type CompoundProps = LoopProps & SlopeTransitionProps & CantedCurveProps;
export type MapElementProps = BoxProps
    & CylinderProps
    & SphereProps
    & PrismProps
    & EventTriggerProps
    & ConvexGeometryProps
    & CompoundProps;
export type MapElementComponentStore = Map<string, Mesh|Group|RAPIER.RigidBody|VoidFnc|MapElementProps|AnimationProps>;

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
const tmp_quaternion = new _Quaternion();
let gId = 0;

ColorPicker.addColorValues(defaultPlatformColor, dynamicPlatformColor, kinematicPlatformColor);

export class MapBuilder {
    scene: Scene;
    world: PhysicsWorld;
    selectedMapElementId: MapElementId | undefined;
    perviousSelectedMapElementId: MapElementId;
    private mapElementComponentStore: MapElementComponentStore = new Map();
    private mapElementIdStore = new Set<string>();
    listeners = new EventListener<MapBuilderEvent>();
    eventTriggerListeners = new EventListener<TriggerMapElementEvent>();
    editMode = false;
    onPlaceVehicle = noop as (pX: number, pY: number, pZ: number, rX: number, rY: number, rZ: number) => void;

    constructor(scene: Scene, world: PhysicsWorld) {
        this.scene = scene;
        this.world = world;

        mountEditorPanel(this);
    }

    get mapElementIdList() {
        return Array.from(this.mapElementIdStore);
    }

    getBodyFromStore(id: MapElementId) {
        return this.mapElementComponentStore.get(`${id}_body`) as RAPIER.RigidBody;
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

    private addToWorld(
        body: RAPIER.RigidBody,
        mesh: Mesh|Group,
        props: MapElementProps,
        colliderDescs: RAPIER.ColliderDesc[],
    ) {
        const mapElementId = `${props.type || props.shape}_${gId++}`;
        const {
            type, mass = 0,
            position_x = 0, position_y = 0, position_z = 0,
            rotation_x = 0, rotation_y = 0, rotation_z = 0,
            fixedRotation = false,
        } = props;

        const updateOrientation = () => {
            copyBodyToMesh(body, mesh);
        };

        setBodyTransform(body, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z);
        mesh.name = mapElementId;

        this.world.setBodyFixedRotation(body, fixedRotation);
        this.world.setBodyColliders(body, colliderDescs);

        this.scene.add(mesh);

        if (type === MapElementType.animated) {
            const animationProps = defineAnimationProps(body, props.dataSet);

            body.setBodyType(RAPIER.RigidBodyType.KinematicVelocityBased, true);

            if (!animationProps.triggerStart) {
                body.setLinvel({
                    x: animationProps.velocity_x,
                    y: animationProps.velocity_y,
                    z: animationProps.velocity_z,
                }, true);
            }

            this.mapElementComponentStore.set(`${mapElementId}_animationProps`, animationProps);
            this.world.addEventListener('preStep', animationProps.movementHandler);
        }

        if (mass || type === MapElementType.animated) {
            this.world.addEventListener('postStep', updateOrientation);
        } else {
            updateOrientation();
        }

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
            this.world.removeBodyCollisionListener(body, listener as (event: CollisionEvent) => void);
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
        const rbDesc = (props.mass
            ? RAPIER.RigidBodyDesc.dynamic().setAdditionalMass(props.mass)
            : RAPIER.RigidBodyDesc.fixed())
            .setCanSleep(false);
        const mapElementBody = this.world.addRigidBody(rbDesc, !!props.fixedRotation);
        let mapElementMesh: Mesh|Group;
        const colliderDescs: RAPIER.ColliderDesc[] = [];

        if (compoundShapes.includes(props.shape) && !props.type) {
            props.type = MapElementType.compound;
        }

        if (props.type === MapElementType.compound) {
            mapElementMesh = new Group();
            getCompoundElementChildrenPropertyList(props).forEach((childProps) => {
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

                shape
                    .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
                    .setRotation(mesh.quaternion);
                if (props.lowFriction) {
                    shape.setFriction(0);
                }
                colliderDescs.push(shape);
            });
        } else {
            const [shape, geometry] = getBaseElementComponents(props);
            mapElementMesh = new Mesh(geometry, meshMaterial);

            if (cfg.renderShadows) {
                mapElementMesh.castShadow = true;
                mapElementMesh.receiveShadow = true;
            }
            if (props.lowFriction) {
                shape.setFriction(0);
            }
            colliderDescs.push(shape);
        }

        const mapElementId = this.addToWorld(mapElementBody, mapElementMesh, props, colliderDescs);

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
            this.world.removeBodyCollisionListener(triggerElementBody, oldListener as (event: CollisionEvent) => void);
        }

        this.mapElementComponentStore.set(`${id}_listener`, listener);

        const colliders = this.world.bodyToColliders.get(triggerElementBody) || [];
        colliders.forEach((collider) => {
            collider.setSensor(true);
            collider.setCollisionGroups(sensorInteractionGroups);
        });
        this.world.addBodyCollisionListener(triggerElementBody, listener);

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
        this.world.removeBodyCollisionListener(mapElementBody, listener as (event: CollisionEvent) => void);
        this.mapElementComponentStore.delete(`${id}_listener`);

        const colliders = this.world.bodyToColliders.get(mapElementBody) || [];
        colliders.forEach((collider) => {
            collider.setSensor(false);
            collider.setCollisionGroups(defaultInteractionGroups);
        });

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
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            } else {
                body.setLinvel({ x: velocity_x, y: velocity_y, z: velocity_z }, true);
            }
        } else {
            body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }

        setBodyTransform(body, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z);
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

            setBodyTransform(body, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z);
        }

        mapElementUpdateMethod();
        this.listeners.dispatch(MapBuilderEvent.mapElementChange, { ...mapElementProps });
    }

    transform(id: MapElementId, transformProps: MapElementProps) {
        const mapElementMesh = this.getMeshFromStore(id);
        const mapElementBody = this.getBodyFromStore(id);
        const mapElementProps = this.getPropsFromStore(id);
        const colliderDescs: RAPIER.ColliderDesc[] = [];

        Object.assign(mapElementProps, { ...transformProps });

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

                transformedShape
                    .setTranslation(childMesh.position.x, childMesh.position.y, childMesh.position.z)
                    .setRotation(childMesh.quaternion);
                if (mapElementProps.lowFriction) {
                    transformedShape.setFriction(0);
                }
                colliderDescs.push(transformedShape);
            }
        } else {
            const [transformedShape, transformedGeometry] = getBaseElementComponents(mapElementProps);

            if (mapElementProps.lowFriction) {
                transformedShape.setFriction(0);
            }
            colliderDescs.push(transformedShape);
            mapElementMesh.geometry.dispose();
            mapElementMesh.geometry = transformedGeometry;
        }

        this.world.setBodyColliders(mapElementBody, colliderDescs);
        this.listeners.dispatch(MapBuilderEvent.mapElementChange, { ...mapElementProps });
    }

    setAttribute(id: MapElementId, attributeProps: MapElementProps) {
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

        if ('fixedRotation' in attributeProps) {
            this.world.setBodyFixedRotation(mapElementBody, !!attributeProps.fixedRotation);
        }

        if ('lowFriction' in attributeProps) {
            const colliders = this.world.bodyToColliders.get(mapElementBody) || [];
            colliders.forEach((collider) => collider.setFriction(attributeProps.lowFriction ? 0 : 0.001));
        }

        if ('mass' in attributeProps) {
            const mapElementUpdateMethod = this.getUpdateMethodFromStore(id);
            const nextType = attributeProps.mass > 0 ? RAPIER.RigidBodyType.Dynamic : RAPIER.RigidBodyType.Fixed;

            this.world.rebuildBodyAsType(mapElementBody, nextType, attributeProps.mass);

            if (attributeProps.mass > 0) {
                this.world.addEventListener('postStep', mapElementUpdateMethod);
            } else {
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
    if (opacity !== undefined) {
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

function copyBodyToMesh(body: RAPIER.RigidBody, mesh: Mesh | Group) {
    const p = body.translation();
    const q = body.rotation();

    mesh.position.set(p.x, p.y, p.z);
    mesh.quaternion.set(q.x, q.y, q.z, q.w);
}

function setBodyTransform(
    body: RAPIER.RigidBody,
    position_x: number,
    position_y: number,
    position_z: number,
    rotation_x: number,
    rotation_y: number,
    rotation_z: number,
) {
    body.setTranslation({ x: position_x, y: position_y, z: position_z }, true);

    tmp_euler.set(degToRad(rotation_x), degToRad(rotation_y), degToRad(rotation_z));
    tmp_quaternion.setFromEuler(tmp_euler);
    body.setRotation(tmp_quaternion, true);
}
