import RAPIER from '@dimforge/rapier3d-compat';
import {
    BoxGeometry, BufferGeometry, BufferAttribute, CylinderGeometry, Mesh, SphereGeometry, Vector3,
} from 'three';
// eslint-disable-next-line import/extensions
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

import { MapElementProps, MapElementShape } from './mapBuilder';

export function getBaseElementComponents({
    shape, width, height, length, lengthTop, radius, radiusTop, radiusBottom, sides, offset, skew, points,
}: MapElementProps): [RAPIER.ColliderDesc, BufferGeometry]|[] {
    switch (shape) {
        case MapElementShape.box:
            return [
                getBoxShape(width, height, length),
                getBoxGeometry(width, height, length),
            ];
        case MapElementShape.cylinder:
            return [
                getCylinderShape(radiusTop, radiusBottom, height),
                getCylinderGeometry(radiusTop, radiusBottom, height, sides),
            ];
        case MapElementShape.sphere:
            return [
                getSphereShape(radius),
                getSphereGeometry(radius),
            ];
        case MapElementShape.tetrahedron: {
            const geometry = makeTetrahedronGeometry(width, height, length);

            return [
                convexHullFromGeometry(geometry),
                geometry,
            ];
        }
        case MapElementShape.triangularPrism: {
            const geometry = makeTriangularPrismGeometry(width, height, length, offset);

            return [
                convexHullFromGeometry(geometry),
                geometry,
            ];
        }
        case MapElementShape.trapezoidalPrism: {
            const geometry = makeTrapezoidalPrismGeometry(width, height, lengthTop, length, skew);

            return [
                convexHullFromGeometry(geometry),
                geometry,
            ];
        }
        case MapElementShape.convexGeometry: {
            const geometry = makeConvexGeometry(points);

            return [
                convexHullFromGeometry(geometry),
                geometry,
            ];
        }
        default:
            return [];
    }
}

function getBoxGeometry(width = 2, height = 2, length = 2) {
    return new BoxGeometry(width, height, length);
}

function getBoxShape(width = 2, height = 2, length = 2) {
    return RAPIER.ColliderDesc.cuboid(width / 2, height / 2, length / 2);
}

function getCylinderGeometry(radiusTop = 1, radiusBottom = 1, height = 2, sides = 6) {
    return new CylinderGeometry(radiusTop, radiusBottom, height, Math.max(3, sides));
}

function getCylinderShape(radiusTop = 1, radiusBottom = 1, height = 2) {
    return RAPIER.ColliderDesc.cylinder(height / 2, Math.max(radiusTop, radiusBottom));
}

function getSphereGeometry(radius = 1) {
    return new SphereGeometry(radius);
}

function getSphereShape(radius = 1) {
    return RAPIER.ColliderDesc.ball(radius);
}

function makeTrapezoidalPrismGeometry(width = 2, height = 2, lengthTop = 4, lengthBack = 2, skew = 0) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfLengthTop = lengthTop / 2;
    const halfLengthBack = lengthBack / 2;
    const a = new Vector3(-halfLengthBack, -halfHeight, -halfWidth + skew);
    const b = new Vector3(halfLengthBack, -halfHeight, -halfWidth - skew);
    const c = new Vector3(halfLengthTop, halfHeight, -halfWidth - skew);
    const d = new Vector3(-halfLengthTop, halfHeight, -halfWidth + skew);
    const e = new Vector3(-halfLengthBack, -halfHeight, halfWidth + skew);
    const f = new Vector3(halfLengthBack, -halfHeight, halfWidth - skew);
    const g = new Vector3(halfLengthTop, halfHeight, halfWidth - skew);
    const h = new Vector3(-halfLengthTop, halfHeight, halfWidth + skew);

    return new ConvexGeometry([a, b, c, d, e, f, g, h]);
}

function makeConvexGeometry(points: number[][] = []) {
    return new ConvexGeometry(points.map((p) => new Vector3().fromArray(p)));
}

function makeTetrahedronGeometry(width = 1, height = 1, length = 1) {
    const a = new Vector3(0, 0, 0);
    const b = new Vector3(width * 2, 0, 0);
    const c = new Vector3(0, height * 2, 0);
    const d = new Vector3(0, 0, length * 2);

    return new ConvexGeometry([a, b, c, d]);
}

function makeTriangularPrismGeometry(width = 2, height = 2, length = 2, offset = 0) {
    const halfExtentX = width / 2;
    const halfExtentY = height / 2;
    const halfExtentZ = length / 2;
    const vertices = [
        new Vector3(halfExtentX, halfExtentY, offset),
        new Vector3(halfExtentX, -halfExtentY, -halfExtentZ),
        new Vector3(halfExtentX, -halfExtentY, halfExtentZ),
        new Vector3(-halfExtentX, halfExtentY, offset),
        new Vector3(-halfExtentX, -halfExtentY, -halfExtentZ),
        new Vector3(-halfExtentX, -halfExtentY, halfExtentZ),
    ];

    return new ConvexGeometry(vertices);
}

function convexHullFromGeometry(geometry: BufferGeometry) {
    const positionAttribute = geometry.getAttribute('position') as BufferAttribute;
    const vertices = new Float32Array(positionAttribute.count * 3);

    for (let i = 0; i < positionAttribute.count; i++) {
        const offset = i * 3;
        vertices[offset] = positionAttribute.getX(i);
        vertices[offset + 1] = positionAttribute.getY(i);
        vertices[offset + 2] = positionAttribute.getZ(i);
    }

    const shape = RAPIER.ColliderDesc.convexHull(vertices);

    return shape || RAPIER.ColliderDesc.ball(1);
}
