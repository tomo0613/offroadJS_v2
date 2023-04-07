import { Box, ConvexPolyhedron, Cylinder, Shape, Sphere, Vec3 } from 'cannon-es';
import {
    BoxGeometry, BufferGeometry, CylinderGeometry, Quaternion, SphereGeometry, Vector3,
} from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';

import { MapElementProps, MapElementShape } from './mapBuilder';

export function getBaseElementComponents(props: MapElementProps): [Shape, BufferGeometry]|[] {
    const { width, height, length, radius, radiusTop, radiusBottom, sides, offset } = props;

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
        case MapElementShape.sphere:
            shape = getSphereShape(radius);
            geometry = getSphereGeometry(radius);
            break;
        case MapElementShape.tetrahedron:
            shape = getTetrahedronShape(width, height, length);
            geometry = getConvexGeometryByShape(shape as ConvexPolyhedron);
            break;
        case MapElementShape.triangularPrism:
            shape = getTriangularPrismShape(width, height, length, offset);
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
function getBoxGeometry(width = 2, height = 2, length = 2) {
    return new BoxGeometry(width, height, length);
}

function getBoxShape(width = 2, height = 2, length = 2) {
    return new Box(new Vec3(width / 2, height / 2, length / 2));
}

/*  Cylinder  */
function getCylinderGeometry(radiusTop = 1, radiusBottom = 1, height = 2, sides = 6) {
    return new CylinderGeometry(radiusTop, radiusBottom, height, Math.max(3, sides));
}

function getCylinderShape(radiusTop = 1, radiusBottom = 1, height = 2, sides = 6) {
    return new Cylinder(radiusTop, radiusBottom, height, Math.max(3, sides));
}

/*  Sphere  */
function getSphereGeometry(radius = 1) {
    return new SphereGeometry(radius);
}

function getSphereShape(radius = 1) {
    return new Sphere(radius);
}

/* TriangularPrism & Tetrahedron */
function getConvexGeometryByShape(convexShape: ConvexPolyhedron) {
    return new ConvexGeometry(convexShape.vertices.map(({ x, y, z }) => new Vector3(x, y, z)));
}

function getTetrahedronShape(width = 1, height = 1, length = 1) {
    const vertices = [
        new Vec3(0, 0, 0),
        new Vec3(width * 2, 0, 0),
        new Vec3(0, height * 2, 0),
        new Vec3(0, 0, length * 2),
    ];
        /*
     * List of vertex index groups that are assigned to individual faces
     * ! CCW order is important for correct face normals !
     */
    const faces = [
        [0, 2, 1],
        [1, 2, 3],
        [0, 1, 3],
        [3, 2, 0],
    ];
    // ToDo
    // const vertices = [
    //     new Vec3(-width, -height, -length),
    //     new Vec3(width, -height, -length),
    //     new Vec3(-width, height, -length),
    //     new Vec3(-width, -height, length),
    // ];
    // const faces = [
    //     [2, 1, 0],
    //     [3, 0, 1],
    //     [0, 3, 2],
    //     [3, 1, 2],
    // ];
    // const normals = computeFaceNormals(vertices, faces);
    // orderFaceVerticesAroundFaceNormals(vertices, faces, normals);
    // return new ConvexPolyhedron({ vertices, faces, normals });
    return new ConvexPolyhedron({ vertices, faces });
}

function getTriangularPrismShape(width = 2, height = 2, length = 2, offset = 0) {
    const halfExtentX = width / 2;
    const halfExtentY = height / 2;
    const halfExtentZ = length / 2;
    const vertices = [
        new Vec3(halfExtentX, halfExtentY, offset),
        new Vec3(halfExtentX, -halfExtentY, -halfExtentZ),
        new Vec3(halfExtentX, -halfExtentY, halfExtentZ),
        new Vec3(-halfExtentX, halfExtentY, offset),
        new Vec3(-halfExtentX, -halfExtentY, -halfExtentZ),
        new Vec3(-halfExtentX, -halfExtentY, halfExtentZ),
    ];
    const faces = [
        [2, 1, 0], // +x
        [4, 5, 3], // -x
        [4, 1, 2, 5], // -y
        [3, 0, 1, 4],
        [5, 2, 0, 3],
    ];
    const normals = computeFaceNormals(vertices, faces);

    // orderFaceVerticesAroundFaceNormals(vertices, faces, normals);

    return new ConvexPolyhedron({ vertices, faces, normals });
}

const tmp_vec_1 = new Vec3();
const tmp_vec_2 = new Vec3();
const centroid = new Vec3();
const tmp_vec_0 = new Vector3();
const tmp_quat = new Quaternion();
const zAxis = new Vector3(0, 0, 1);
const vertexProjectionAngles: number[] = [];

function computeFaceNormals(vertices: Vec3[], faces: number[][]) {
    calculateCentroid(vertices);

    return faces.map((faceVertexIndices: number[]) => {
        const A = vertices[faceVertexIndices[0]];
        const A_to_B = tmp_vec_1.copy(vertices[faceVertexIndices[1]]);
        const A_to_C = tmp_vec_2.copy(vertices[faceVertexIndices[2]]);
        A_to_B.vsub(A, A_to_B);
        A_to_C.vsub(A, A_to_C);

        const faceNormal = new Vec3().copy(A_to_B);
        faceNormal.cross(A_to_C, faceNormal).normalize();

        const centroid_to_A = tmp_vec_1.copy(A);
        A.vsub(centroid, centroid_to_A);

        if (faceNormal.dot(centroid_to_A) < 0) {
            faceNormal.negate();
        }

        return faceNormal;
    });
}

function calculateCentroid(vertices: Vec3[]) {
    const { length: vertexCount } = vertices;

    centroid.set(0, 0, 0);

    for (let i = 0; i < vertexCount; i++) {
        centroid.vadd(vertices[i], centroid);
    }

    centroid.scale(1 / vertexCount, centroid);
}

// https://github.com/mrdoob/three.js/blob/5ad3317bf251bf0520d73704f2af66fafb770a77/src/math/Quaternion.js#L492
function orderFaceVerticesAroundFaceNormals(vertices: Vec3[], faces: number[][], normals: Vec3[]) {
    faces.forEach((faceVertexIndices: number[], faceIndex: number) => {
        /* https://stackoverflow.com/questions/6264664/transform-3d-points-to-2d */
        const faceNormal = normals[faceIndex] as unknown as Vector3;
        const rotationAxis = tmp_vec_0.crossVectors(faceNormal, zAxis);
        const faceAngle = Math.acos(zAxis.dot(faceNormal));
        const rotation = tmp_quat.setFromAxisAngle(rotationAxis, faceAngle);

        vertexProjectionAngles.length = 0;
        for (let i = 0; i < faceVertexIndices.length; i++) {
            const vertexIndex = faceVertexIndices[i];
            const projection = tmp_vec_0.copy(vertices[vertexIndex] as unknown as Vector3).applyQuaternion(rotation);

            vertexProjectionAngles[vertexIndex] = Math.atan2(projection.y, projection.x);
        }

        faceVertexIndices.sort(compareVertexProjectionAngles);
    });
}

function compareVertexProjectionAngles(vertexIndex_a: number, vertexIndex_b: number) {
    const angle_a = vertexProjectionAngles[vertexIndex_a];
    const angle_b = vertexProjectionAngles[vertexIndex_b];

    if (angle_a < angle_b) {
        return -1;
    }
    if (angle_a > angle_b) {
        return 1;
    }
    return 0;
}
