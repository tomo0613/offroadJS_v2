import { Body, Box, ConvexPolyhedron, Cylinder, Quaternion, Shape, Vec3, World } from 'cannon-es';
import {
    BoxBufferGeometry, BufferGeometry, CylinderBufferGeometry, Geometry, Mesh, MeshLambertMaterial, Scene, Vector3,
} from 'three';
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import cfg from './config';

interface PlatformProps {
    position?: Vec3;
    rotation?: Quaternion;
    mass?: number;
}

interface BoxProps extends PlatformProps {
    width?: number;
    height?: number;
    length?: number;
}

interface BoxPropsSimple extends PlatformProps {
    size?: number;
}

interface CylinderProps extends PlatformProps {
    radiusTop?: number;
    radiusBottom?: number;
    height?: number;
    sides?: number;
}

let gId = 0;

export class PlatformBuilder {
    scene: Scene;
    world: World;
    platformComponentStore = new Map<string, Mesh|Body|Function>();

    constructor(scene: Scene, world: World) {
        this.scene = scene;
        this.world = world;
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
        // body.position.set(
        //     props.position?.x || 0,
        //     props.position?.y || 0,
        //     props.position?.z || 0,
        // );
        mesh.position.copy(body.position as unknown as Vector3);

        if (props.rotation) {
            body.quaternion.copy(props.rotation);
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

        // eslint-disable-next-line no-param-reassign
        body.aabbNeedsUpdate = true;

        this.platformComponentStore.set(`mesh_${gId}`, mesh);
        this.platformComponentStore.set(`body_${gId}`, body);
        this.platformComponentStore.set(`updateMethod_${gId}`, updateVisuals);

        return gId++;
    }

    destroy(id: number) {
        this.world.removeBody(this.platformComponentStore.get(`body_${id}`) as Body);
        this.scene.remove(this.platformComponentStore.get(`mesh_${id}`) as Mesh);
        this.world.removeEventListener('postStep', this.platformComponentStore.get(`updateMethod_${id}`) as Function);

        this.platformComponentStore.delete(`mesh_${id}`);
        this.platformComponentStore.delete(`body_${id}`);
        this.platformComponentStore.delete(`updateMethod_${id}`);
    }

    showGUI() {
        createPanelIfNotExists();
        this.platformComponentStore.forEach(() => {});
    }

    // hideGUI() {}

    // updateGUI() ?

    // move() {}

    // rotate() {}

    // setProperties() {}
    // update()

    buildBox({ size, mass }: BoxPropsSimple): number;
    buildBox({ width, height, length, mass }: BoxProps): number;
    buildBox({ size = 1, width = size, height = size, length = size, ...propsToPass }: BoxPropsSimple & BoxProps) {
        return this.addToWorld(
            new BoxBufferGeometry(width * 2, height * 2, length * 2),
            new Box(new Vec3(width, height, length)),
            propsToPass,
        );
    }

    buildCylinder({ radiusTop = 1, radiusBottom = 1, height = 1, sides = 6, ...propsToPass }: CylinderProps) {
        return this.addToWorld(
            new CylinderBufferGeometry(radiusTop, radiusBottom, height * 2, sides),
            new Cylinder(radiusTop, radiusBottom, height * 2, sides),
            propsToPass,
        );
    }

    buildRamp({ width = 1, height = 1, length = 1, ...propsToPass }: BoxProps) {
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

        return this.addToWorld(
            new ConvexBufferGeometry(vertices.map(({ x, y, z }) => new Vector3(x, y, z))),
            new ConvexPolyhedron({ vertices, faces }),
            propsToPass,
        );
    }
}

function createPanelIfNotExists() {
    // document.documentElement
}
