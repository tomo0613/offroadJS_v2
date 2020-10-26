import { Body, Box, Vec3, World } from 'cannon-es';
import { BoxGeometry, Mesh, MeshLambertMaterial, Scene, Vector3 } from 'three';

interface CommonProps {
    position?: Vec3;
}

interface PlatformProps extends CommonProps {
    width?: number;
    height?: number;
    length?: number;
}

interface BoxProps extends CommonProps {
    size?: number;
    mass?: number;
}

let gScene: Scene;
let gWorld: World;

export default {
    init,
    create,
    createBox,
};

function init(scene: Scene, world: World) {
    gScene = scene;
    gWorld = world;
}

function create({ width = 1, height = 1, length = 1, position }: PlatformProps) {
    const platformGeometry = new BoxGeometry(width * 2, height * 2, length * 2);
    const platformMesh = new Mesh(platformGeometry, new MeshLambertMaterial());

    const platformBody = new Body({
        mass: 0,
        shape: new Box(new Vec3(width, height, length)),
    });

    append(platformBody, platformMesh, position);
}

function createBox({ size = 1, mass = 10, position }: BoxProps) {
    const boxGeometry = new BoxGeometry(size * 2, size * 2, size * 2);
    const boxMesh = new Mesh(boxGeometry, new MeshLambertMaterial());

    const boxBody = new Body({
        mass,
        shape: new Box(new Vec3(size, size, size)),
    });

    gWorld.addEventListener('postStep', () => {
        boxMesh.position.copy(boxBody.position as unknown as Vector3);
        boxMesh.quaternion.copy(boxBody.quaternion as unknown as THREE.Quaternion);
    });

    append(boxBody, boxMesh, position);
}

function append(body: Body, mesh: Mesh, position = new Vec3()) {
    body.position.set(position.x, position.y, position.z);
    mesh.position.copy(body.position as unknown as Vector3);

    body.aabbNeedsUpdate = true;

    gScene.add(mesh);
    gWorld.addBody(body);
}

function createSlope() {
    //
}
