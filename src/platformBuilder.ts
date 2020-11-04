import { Body, Box, ConvexPolyhedron, Cylinder, SHAPE_TYPES, Shape, Vec3, World } from 'cannon-es';
import {
    BoxBufferGeometry, BufferGeometry, CylinderBufferGeometry, Geometry, Mesh, MeshLambertMaterial, Scene, Vector3,
} from 'three';
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import cfg from './config';
import { setUpEditor } from './editor/editor';

type PlatformType = 'box'|'cylinder'|'ramp';

interface Vec3like {
    x: number;
    y: number;
    z: number;
}

interface CommonPlatformProps {
    type?: PlatformType;
    position?: Vec3like;
    rotationAxis?: Vec3like;
    rotation?: number;
    mass?: number;
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

type PlatformId = string;
type BoxProps = CommonPlatformProps & BoxShapeProps;
type BoxPropsSimple = CommonPlatformProps & BoxShapePropsSimple;
type CylinderProps = CommonPlatformProps & CylinderShapeProps;
export type PlatformProps = BoxProps & CylinderProps;
export type PlatformComponentStore = Map<string, Mesh|Body|Function|PlatformProps>;

const tmp_vec3 = new Vec3();
const shapeTypeMap = {
    Box: 'box',
    Cylinder: 'cylinder',
    ConvexPolyhedron: 'ramp',
};

let gId = 0;

export class PlatformBuilder {
    scene: Scene;
    world: World;
    selectedPlatformId: PlatformId;
    perviousSelectedPlatformId: PlatformId;
    platformComponentStore: PlatformComponentStore = new Map();
    platformIdStore = new Set<string>();

    constructor(scene: Scene, world: World) {
        this.scene = scene;
        this.world = world;

        window.importMap = this.importMap;
        window.exportMap = this.exportMap;
    }

    get platformIdList() {
        return Array.from(this.platformIdStore);
    }

    getBodyFromStore(id: PlatformId) {
        return this.platformComponentStore.get(`body_${id}`) as Body;
    }

    getMeshFromStore(id: PlatformId) {
        return this.platformComponentStore.get(`mesh_${id}`) as Mesh;
    }

    getPropsFromStore(id: PlatformId) {
        return this.platformComponentStore.get(`props_${id}`) as PlatformProps;
    }

    private addToWorld(visualShape: Geometry | BufferGeometry, physicalShape: Shape, props: PlatformProps) {
        const platformId = String(gId++);
        const mesh = new Mesh(visualShape, new MeshLambertMaterial());
        const body = new Body({ shape: physicalShape, mass: props.mass || 0 });
        const updateVisuals = () => {
            mesh.position.copy(body.position as unknown as Vector3);
            mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        };

        if (props.position) {
            body.position.set(props.position.x, props.position.y, props.position.z);
        }
        mesh.position.copy(body.position as unknown as Vector3);

        if (props.rotation) {
            const rotationAxis = props.rotationAxis
                ? tmp_vec3.set(props.rotationAxis.x, props.rotationAxis.y, props.rotationAxis.z)
                : Vec3.UNIT_X;
            body.quaternion.setFromAxisAngle(rotationAxis, props.rotation);
            mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        }

        if (cfg.renderShadows) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        this.world.addBody(body);
        this.scene.add(mesh);

        if (props.mass) {
            this.world.addEventListener('postStep', updateVisuals);
        }
        props.type = shapeTypeMap[physicalShape.constructor.name];

        body.aabbNeedsUpdate = true;

        this.platformIdStore.add(platformId);
        this.platformComponentStore.set(`mesh_${platformId}`, mesh);
        this.platformComponentStore.set(`body_${platformId}`, body);
        this.platformComponentStore.set(`updateMethod_${platformId}`, updateVisuals);
        this.platformComponentStore.set(`props_${platformId}`, props);

        if (false/* editMode */) {
            this.selectPlatform(String(gId));
        }

        return platformId;
    }

    destroy = (id: PlatformId) => {
        const mesh = this.getMeshFromStore(id);
        mesh.geometry.dispose();
        (mesh.material as MeshLambertMaterial).dispose();

        this.scene.remove(mesh);
        this.world.removeBody(this.getBodyFromStore(id));
        this.world.removeEventListener('postStep', this.platformComponentStore.get(`updateMethod_${id}`) as Function);

        this.platformIdStore.delete(id);
        this.platformComponentStore.delete(`mesh_${id}`);
        this.platformComponentStore.delete(`body_${id}`);
        this.platformComponentStore.delete(`updateMethod_${id}`);
        this.platformComponentStore.delete(`props_${id}`);

        if (this.selectedPlatformId === id) {
            this.selectedPlatformId = undefined;
        }
    }

    clone(id: PlatformId) {
        const mesh = this.getMeshFromStore(id);
        const body = this.getBodyFromStore(id);
        const props = this.getPropsFromStore(id);

        this.addToWorld(mesh.geometry, body.shapes[0], props);
    }

    importMap(mapData: Record<string, PlatformProps>) {
        this.platformIdStore.forEach(this.destroy);

        Object.entries(mapData).forEach(([platformId, platformProps]) => {
            const [platformType] = platformId.split('_');
            switch (platformType) {
                case 'box':
                    this.buildBox(platformProps);
                    break;
                case 'cylinder':
                    this.buildCylinder(platformProps);
                    break;
                case 'ramp':
                    this.buildRamp(platformProps);
                    break;
                default:
            }
        });
    }

    exportMap() {
        const exportData = Array.from(this.platformComponentStore.entries())
            .filter(([key]) => key.startsWith('props'))
            .reduce((data, [key, props]) => {
                const id = key.replace('props_', '');
                const { type: platformType, ...platformProps } = props as PlatformProps;
                data[`${platformType}_${id}`] = platformProps;

                return data;
            }, {} as Record<string, Omit<PlatformProps, 'type'>>);

        console.log(JSON.stringify(exportData));
    }

    selectPlatform = (id: PlatformId) => {
        if (this.selectedPlatformId) {
            this.perviousSelectedPlatformId = this.selectedPlatformId;
        }

        this.selectedPlatformId = id;

        this.highlightSelectedPlatform();
    }

    private highlightSelectedPlatform() {
        if (this.perviousSelectedPlatformId) {
            const previousSelected = this.getMeshFromStore(this.perviousSelectedPlatformId);
            const material = previousSelected.material as MeshLambertMaterial;
            material.color.setHex(0xFFFFFF);
            // material.transparent = true;
            // material.opacity = 0.7;
        }
        const selected = this.getMeshFromStore(this.selectedPlatformId);
        (selected.material as MeshLambertMaterial).color.setHex(0xFFC266);
    }

    showGUI() {
        setUpEditor(this);
    }

    // hideGUI() {}

    buildBox(props: BoxPropsSimple): string;
    buildBox(props: BoxProps): string;
    buildBox(props: BoxPropsSimple & BoxProps) {
        const { size = 1, width = size, height = size, length = size } = props;

        return this.addToWorld(
            new BoxBufferGeometry(width * 2, height * 2, length * 2),
            new Box(new Vec3(width, height, length)),
            props,
        );
    }

    buildCylinder(props: CylinderProps) {
        const { radiusTop = 1, radiusBottom = 1, height = 1, sides = 6 } = props;
        const cylinderSides = Math.max(3, sides);

        return this.addToWorld(
            new CylinderBufferGeometry(radiusTop, radiusBottom, height * 2, cylinderSides),
            new Cylinder(radiusTop, radiusBottom, height * 2, cylinderSides),
            props,
        );
    }

    buildRamp(props: BoxProps) {
        const shape = getRampShape(props.width, props.height, props.length);

        return this.addToWorld(
            new ConvexBufferGeometry(shape.vertices.map(({ x, y, z }) => new Vector3(x, y, z))),
            shape,
            props,
        );
    }

    translate(id: PlatformId, { position, rotation, rotationAxis }: CommonPlatformProps) {
        const body = this.getBodyFromStore(id);
        const updateVisuals = this.platformComponentStore.get(`updateMethod_${id}`) as Function;

        if (position) {
            body.position.set(position.x, position.y, position.z);
        }
        if (rotation !== undefined) {
            const axis = rotationAxis
                ? tmp_vec3.set(rotationAxis.x, rotationAxis.y, rotationAxis.z)
                : Vec3.UNIT_X;
            body.quaternion.setFromAxisAngle(axis, rotation * Math.PI / 180);
        }

        updateVisuals();
        body.aabbNeedsUpdate = true;
    }

    transform(id: PlatformId, props: BoxProps): void;
    transform(id: PlatformId, props: CylinderProps): void;
    transform(id: PlatformId, {
        width = 1, height = 1, length = 1, radiusBottom = 1, radiusTop = 1, sides = 6,
    }: BoxProps & CylinderProps) {
        const mesh = this.getMeshFromStore(id);
        const body = this.getBodyFromStore(id);
        const shape = body.shapes[0];
        const cylinderSides = Math.max(3, sides);
        // https://github.com/schteppe/cannon.js/issues/329
        const shapeType = shape.type === SHAPE_TYPES.CONVEXPOLYHEDRON && shape.constructor.name === 'Cylinder'
            ? SHAPE_TYPES.CYLINDER
            : shape.type;
        let modifiedShape: Shape;
        let modifiedGeometry: BufferGeometry;

        switch (shapeType) {
            case SHAPE_TYPES.BOX:
                (shape as Box).halfExtents.set(width, height, length);
                modifiedShape = shape;
                modifiedGeometry = new BoxBufferGeometry(width * 2, height * 2, length * 2);
                break;
            case SHAPE_TYPES.CYLINDER:
                modifiedShape = new Cylinder(radiusTop, radiusBottom, height * 2, sides);
                modifiedGeometry = new CylinderBufferGeometry(radiusTop, radiusBottom, height * 2, cylinderSides);
                break;
            case SHAPE_TYPES.CONVEXPOLYHEDRON:
                modifiedShape = getRampShape(width, height, length);
                modifiedGeometry = new ConvexBufferGeometry(
                    (modifiedShape as ConvexPolyhedron).vertices.map(({ x, y, z }) => new Vector3(x, y, z)),
                );
                break;
            default:
                return;
        }

        body.shapes.length = 0;
        body.addShape(modifiedShape);

        mesh.geometry.dispose();
        mesh.geometry = modifiedGeometry;
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
