import { Box, ConvexPolyhedron, Cylinder, Shape, Sphere, Vec3 } from 'cannon-es';
import { BoxBufferGeometry, BufferGeometry, CylinderBufferGeometry, SphereBufferGeometry, Vector3 } from 'three';
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';

import { MapElementProps, MapElementShape } from './mapBuilder';

export function getBaseElementComponents(props: MapElementProps): [Shape, BufferGeometry]|[] {
    const { width, height, length, size, radiusTop, radiusBottom, sides } = props;

    let shape: Shape;
    let geometry: BufferGeometry;

    switch (props.shape) {
        case MapElementShape.box:
            shape = getBoxShape(width, height, length);
            geometry = getBoxGeometry(width, height, length);
            break;
        case MapElementShape.cylinder:
            shape = getCylinderShape(radiusTop, radiusBottom, height, sides);
            geometry = getCylinderGeometry(radiusTop, radiusBottom, height, sides);
            break;
        case MapElementShape.ramp:
            shape = getRampShape(width, height, length);
            geometry = getConvexGeometryByShape(shape as ConvexPolyhedron);
            break;
        case MapElementShape.sphere:
            shape = getSphereShape(size);
            geometry = getSphereGeometry(size);
            break;
        case MapElementShape.triangularRamp:
            shape = getTriangularRampShape(width, height, length);
            geometry = getConvexGeometryByShape(shape as ConvexPolyhedron);
            break;
        default:
            return [];
    }

    return [
        shape,
        geometry,
    ];
}

/*  Box  */
function getBoxGeometry(width = 1, height = 1, length = 1) {
    return new BoxBufferGeometry(width * 2, height * 2, length * 2);
}

function getBoxShape(width = 1, height = 1, length = 1) {
    return new Box(new Vec3(width, height, length));
}

/*  Cylinder  */
function getCylinderGeometry(radiusTop = 1, radiusBottom = 1, height = 1, sides = 6) {
    return new CylinderBufferGeometry(radiusTop, radiusBottom, height * 2, Math.max(3, sides));
}

function getCylinderShape(radiusTop = 1, radiusBottom = 1, height = 1, sides = 6) {
    return new Cylinder(radiusTop, radiusBottom, height * 2, Math.max(3, sides));
}

/*  Sphere  */
function getSphereGeometry(size = 1) {
    return new SphereBufferGeometry(size);
}

function getSphereShape(size = 1) {
    return new Sphere(size);
}

/*  Ramp  */
function getConvexGeometryByShape(convexShape: ConvexPolyhedron) {
    return new ConvexBufferGeometry(convexShape.vertices.map(({ x, y, z }) => new Vector3(x, y, z)));
}

function getRampShape(width = 1, height = 1, length = 1) {
    /*  List of vertices that can be assigned to a face  */
    const vertices = [
        new Vec3(0, 0, 0),
        new Vec3(width * 2, 0, 0),
        new Vec3(width * 2, height * 2, 0),
        new Vec3(0, height * 2, 0),
        new Vec3(0, 0, length * 2),
        new Vec3(width * 2, 0, length * 2),
    ];
    /*
     * List of vertex index groups that are assigned to individual faces
     * ! CCW order is important for correct face normals !
     */
    const faces = [
        [0, 3, 2, 1],
        [2, 3, 4, 5],
        [0, 1, 5, 4],
        [5, 1, 2],
        [4, 3, 0],
    ];

    return new ConvexPolyhedron({ vertices, faces });
}

/*  TriangularRamp  */
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
