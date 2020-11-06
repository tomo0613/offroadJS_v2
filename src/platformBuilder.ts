import { Body, Box, ConvexPolyhedron, Cylinder, SHAPE_TYPES, Shape, Vec3, World } from 'cannon-es';
import {
    BoxBufferGeometry, BufferGeometry, CylinderBufferGeometry, Geometry, Mesh, MeshLambertMaterial, Scene, Vector3,
} from 'three';
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import cfg from './config';
import { setUpEditor } from './editor/editor';

type PlatformType = 'box'|'cylinder'|'ramp';

interface CommonPlatformProps {
    type?: PlatformType;
    position_x?: number;
    position_y?: number;
    position_z?: number;
    rotation_x?: number;
    rotation_y?: number;
    rotation_z?: number;
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

const shapeTypeMap = {
    Box: 'box',
    Cylinder: 'cylinder',
    ConvexPolyhedron: 'ramp',
};
const defaultPlatformColor = 0xFFFFFF;
const dynamicPlatformColor = 0x95C0E5;

let gId = 0;

export class PlatformBuilder {
    scene: Scene;
    world: World;
    selectedPlatformId: PlatformId;
    perviousSelectedPlatformId: PlatformId;
    platformComponentStore: PlatformComponentStore = new Map();
    platformIdStore = new Set<string>();
    editMode = false;

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
        const platformType = shapeTypeMap[physicalShape.constructor.name];
        const platformId = `${platformType}_${gId++}`;
        const platformProps = {
            ...props,
            type: platformType,
        };
        const {
            position_x = 0,
            position_y = 0,
            position_z = 0,
            rotation_x = 0,
            rotation_y = 0,
            rotation_z = 0,
        } = platformProps;

        const color = platformProps.mass ? dynamicPlatformColor : defaultPlatformColor;
        const mesh = new Mesh(visualShape, new MeshLambertMaterial({ color }));
        const body = new Body({ shape: physicalShape, mass: platformProps.mass || 0 });
        const updateVisuals = () => {
            mesh.position.copy(body.position as unknown as Vector3);
            mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        };

        body.position.set(position_x, position_y, position_z);
        mesh.position.copy(body.position as unknown as Vector3);

        if (rotation_x || rotation_y || rotation_z) {
            body.quaternion.setFromEuler(
                rotation_x / 180 * Math.PI,
                rotation_y / 180 * Math.PI,
                rotation_z / 180 * Math.PI,
            );
            mesh.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);
        }

        if (cfg.renderShadows) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        this.world.addBody(body);
        this.scene.add(mesh);

        if (platformProps.mass) {
            this.world.addEventListener('postStep', updateVisuals);
        }

        body.aabbNeedsUpdate = true;

        this.platformIdStore.add(platformId);
        this.platformComponentStore.set(`mesh_${platformId}`, mesh);
        this.platformComponentStore.set(`body_${platformId}`, body);
        this.platformComponentStore.set(`updateMethod_${platformId}`, updateVisuals);
        this.platformComponentStore.set(`props_${platformId}`, platformProps);

        if (this.editMode) {
            this.selectPlatform(platformId);
        }

        return platformId;
    }

    clone(id: PlatformId) {
        const props = { ...this.getPropsFromStore(id) };

        switch (props.type) {
            case 'box':
                return this.buildBox(props);
            case 'cylinder':
                return this.buildCylinder(props);
            case 'ramp':
                return this.buildRamp(props);
            default:
                return '';
        }
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
        this.editMode = true;
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

    resetDynamicPlatforms() {
        this.platformIdList.forEach(this.resetPlatformIfDynamic);
    }

    resetPlatformIfDynamic = (id: PlatformId) => {
        const {
            mass,
            position_x = 0,
            position_y = 0,
            position_z = 0,
            rotation_x = 0,
            rotation_y = 0,
            rotation_z = 0,
        } = this.getPropsFromStore(id);

        if (!mass) {
            return;
        }
        const body = this.getBodyFromStore(id);
        body.velocity.copy(Vec3.ZERO);
        body.angularVelocity.copy(Vec3.ZERO);

        body.position.set(position_x, position_y, position_z);
        body.quaternion.setFromEuler(
            rotation_x / 180 * Math.PI,
            rotation_y / 180 * Math.PI,
            rotation_z / 180 * Math.PI,
        );
    }

    translate(id: PlatformId, props: CommonPlatformProps) {
        const body = this.getBodyFromStore(id);
        const platformProps = this.getPropsFromStore(id);
        const updateVisuals = this.platformComponentStore.get(`updateMethod_${id}`) as Function;

        Object.assign(platformProps, { ...props });

        const {
            position_x = 0,
            position_y = 0,
            position_z = 0,
            rotation_x = 0,
            rotation_y = 0,
            rotation_z = 0,
        } = platformProps;

        body.position.set(
            position_x,
            position_y,
            position_z,
        );
        body.quaternion.setFromEuler(
            rotation_x / 180 * Math.PI,
            rotation_y / 180 * Math.PI,
            rotation_z / 180 * Math.PI,
        );

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
        let transformedShape: Shape;
        let transformedGeometry: BufferGeometry;

        switch (shapeType) {
            case SHAPE_TYPES.BOX:
                (shape as Box).halfExtents.set(width, height, length);
                (shape as Box).updateConvexPolyhedronRepresentation();
                transformedShape = shape;
                transformedGeometry = new BoxBufferGeometry(width * 2, height * 2, length * 2);
                Object.assign(this.getPropsFromStore(id), { width, height, length });
                break;
            case SHAPE_TYPES.CYLINDER:
                transformedShape = new Cylinder(radiusTop, radiusBottom, height * 2, cylinderSides);
                transformedGeometry = new CylinderBufferGeometry(radiusTop, radiusBottom, height * 2, cylinderSides);
                Object.assign(this.getPropsFromStore(id), { radiusTop, radiusBottom, height, sides: cylinderSides });
                break;
            case SHAPE_TYPES.CONVEXPOLYHEDRON:
                transformedShape = getRampShape(width, height, length);
                transformedGeometry = new ConvexBufferGeometry(
                    (transformedShape as ConvexPolyhedron).vertices.map(({ x, y, z }) => new Vector3(x, y, z)),
                );
                Object.assign(this.getPropsFromStore(id), { width, height, length });
                break;
            default:
                return;
        }

        body.shapes.length = 0;
        body.addShape(transformedShape);

        mesh.geometry.dispose();
        mesh.geometry = transformedGeometry;
    }

    importMap = (mapData: Record<string, PlatformProps>) => {
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

    exportMap = () => {
        const exportData = Array.from(this.platformComponentStore.entries())
            .filter(([key]) => key.startsWith('props'))
            .reduce((data, [key, props]) => {
                const id = key.replace('props_', '');
                const { type, ...platformProps } = props as PlatformProps;
                data[id] = platformProps;

                return data;
            }, {} as Record<string, Omit<PlatformProps, 'type'>>);

        console.log(JSON.stringify(exportData));
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
