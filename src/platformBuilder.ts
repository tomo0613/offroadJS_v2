import { Body, Box, ConvexPolyhedron, Cylinder, SHAPE_TYPES, Shape, Vec3, World } from 'cannon-es';
import {
    BoxBufferGeometry, BufferGeometry, CylinderBufferGeometry, Geometry, Mesh, MeshLambertMaterial, Scene, Vector3,
} from 'three';
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import cfg from './config';
import { setUpEditor } from './editor/editor';

interface CommonPlatformProps {
    position?: Vec3;
    rotationAxis?: Vec3;
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

let gId = 0;

export class PlatformBuilder {
    scene: Scene;
    world: World;
    selectedPlatformId: PlatformId;
    perviousSelectedPlatformId: PlatformId;
    platformComponentStore: PlatformComponentStore = new Map();

    constructor(scene: Scene, world: World) {
        this.scene = scene;
        this.world = world;
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
        const mesh = new Mesh(visualShape, new MeshLambertMaterial());
        const body = new Body({ shape: physicalShape, mass: props.mass || 0 });
        const updateVisuals = () => {
            mesh.position.copy(body.position as unknown as Vector3);
            mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        };

        if (props.position) {
            body.position.copy(props.position);
        }
        mesh.position.copy(body.position as unknown as Vector3);

        if (props.rotation) {
            body.quaternion.setFromAxisAngle(props.rotationAxis || Vec3.UNIT_X, props.rotation);
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

        body.aabbNeedsUpdate = true;

        this.platformComponentStore.set(`mesh_${gId}`, mesh);
        this.platformComponentStore.set(`body_${gId}`, body);
        this.platformComponentStore.set(`updateMethod_${gId}`, updateVisuals);
        this.platformComponentStore.set(`props_${gId}`, props);

        if (false/* editMode */) {
            this.selectPlatform(String(gId));
        }

        return gId++;
    }

    destroy(id: PlatformId) {
        const mesh = this.getMeshFromStore(id);
        mesh.geometry.dispose();
        (mesh.material as MeshLambertMaterial).dispose();

        this.scene.remove(mesh);
        this.world.removeBody(this.getBodyFromStore(id));
        this.world.removeEventListener('postStep', this.platformComponentStore.get(`updateMethod_${id}`) as Function);

        this.platformComponentStore.delete(`mesh_${id}`);
        this.platformComponentStore.delete(`body_${id}`);
        this.platformComponentStore.delete(`updateMethod_${id}`);
        this.platformComponentStore.delete(`props_${id}`);

        if (this.selectedPlatformId === id) {
            this.selectedPlatformId = undefined;
        }
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

    // updateGUI() ?

    buildBox(props: BoxPropsSimple): number;
    buildBox(props: BoxProps): number;
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
        const cylinderSides = Math.max(4, sides);

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
            body.quaternion.setFromAxisAngle(rotationAxis || Vec3.UNIT_X, rotation * Math.PI / 180);
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
        // https://github.com/schteppe/cannon.js/issues/329
        const cylinderSides = Math.max(4, sides);
        const shapeType = shape.type === SHAPE_TYPES.CONVEXPOLYHEDRON && (shape as ConvexPolyhedron).faces.length > 5
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
                modifiedShape = new Cylinder(radiusTop, radiusBottom, height * 2, cylinderSides);
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
