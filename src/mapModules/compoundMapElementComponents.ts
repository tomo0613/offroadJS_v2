import { Object3D, Vector3, MathUtils } from 'three';

import { MapElementOrientationProps, MapElementProps, MapElementShape } from './mapBuilder';

const { degToRad, radToDeg } = MathUtils;

export const loopDefaultProps = {
    segmentCount: 13,
    segmentWidth: 4,
    segmentHeight: 0.1,
    segmentLength: 4,
    segmentPositionOffset: 0.4,
    radius: 8,
};
export const loopPropKeys = Object
    .keys(loopDefaultProps) as (keyof typeof loopDefaultProps)[];

export const slopeTransitionDefaultProps = {
    segmentCount: 2,
    segmentWidth: 2,
    segmentHeight: 0.4,
    segmentLength: 4,
    angle: 30,
};
export const slopeTransitionPropKeys = Object
    .keys(slopeTransitionDefaultProps) as (keyof typeof slopeTransitionDefaultProps)[];

export const cantedCurveDefaultProps = {
    segmentCount: 10,
    segmentWidth: 4,
    segmentHeight: 0.1,
    segmentLength: 2,
    angle: 30,
    radius: 8,
};
export const cantedCurvePropKeys = Object
    .keys(cantedCurveDefaultProps) as (keyof typeof cantedCurveDefaultProps)[];

export type LoopProps = Partial<typeof loopDefaultProps> & MapElementOrientationProps;
export type SlopeTransitionProps = Partial<typeof slopeTransitionDefaultProps> & MapElementOrientationProps;
export type CantedCurveProps = Partial<typeof cantedCurveDefaultProps> & MapElementOrientationProps;

export const compoundShapes = ['loop', 'slopeTransition', 'cantedCurve', 'cantedCurveB'];

const tmp_rotationAxis = new Vector3();
const tmp_position = new Vector3();
const tmp_vector_0 = new Vector3();
const tmp_vector_1 = new Vector3();
const tmp_object3d = new Object3D();

export function getCompoundElementChildrenPropertyList(props: MapElementProps) {
    switch (props.shape) {
        case MapElementShape.loop:
            return generateLoopElementChildrenPropertyList(props);
        case MapElementShape.slopeTransition:
            return generateSlopeTransitionElementChildrenPropertyList(props);
        case MapElementShape.cantedCurve:
            return generateCantedCurveElementChildrenPropertyList(props);
        case MapElementShape.cantedCurveB:
            return _generateCantedCurveElementChildrenPropertyList(props);
        default:
            return [];
    }
}

function generateLoopElementChildrenPropertyList(props: LoopProps) {
    const {
        segmentCount, segmentWidth, segmentHeight, segmentLength, segmentPositionOffset, radius,
    } = assignDefaultValues(props, loopDefaultProps);

    const loopElementChildrenPropertyList: MapElementProps[] = [];
    const innerTriangleAlpha = Math.atan(radius / (segmentLength / 2));
    const rotationPerSegment = Math.PI - 2 * innerTriangleAlpha;
    const xAxis = tmp_rotationAxis.set(1, 0, 0);

    for (let i = 0; i < segmentCount; i++) {
        tmp_position.set(segmentPositionOffset * i, -radius, 0).applyAxisAngle(xAxis, rotationPerSegment * i);

        loopElementChildrenPropertyList.push({
            shape: MapElementShape.box,
            width: segmentWidth,
            height: segmentHeight,
            length: segmentLength,
            position_x: tmp_position.x,
            position_y: tmp_position.y,
            position_z: tmp_position.z,
            rotation_x: radToDeg(rotationPerSegment * i),
        });
    }

    return loopElementChildrenPropertyList;
}

// const a = new Vector3(-halfWidth, -halfHeight, -halfLength);
// const b = new Vector3(halfWidth, -halfHeight, -halfLength + overlap);
// const b = new Vector3(halfWidth, -halfHeight, -halfLength);
// const c = new Vector3().copy(b).setY(halfHeight);
// const d = new Vector3().copy(a).setY(halfHeight);
// const e = new Vector3(-halfWidth, -halfHeight, halfLength);
// const f = new Vector3(halfWidth, -halfHeight, halfLength);
// const g = new Vector3().copy(f).setY(halfHeight);
// const h = new Vector3().copy(e).setY(halfHeight);
/**
 *    D------C.
 *   /|      | `.
 *  H-+------+---G
 *  | |      |   |
 *  | A------B.  height(y)
 *  |length(-z)`.|
 *  E--width(x)--F
 */
function _generateCantedCurveElementChildrenPropertyList(props: CantedCurveProps) {
    const {
        segmentCount, segmentWidth, segmentHeight, segmentLength, angle, radius,
    } = assignDefaultValues(props, cantedCurveDefaultProps);
    const cantedCurveElementChildrenPropertyList: MapElementProps[] = [];
    const elevation = 1;

    tmp_rotationAxis.set(0, 1, 0);

    const halfWidth = segmentWidth / 2;
    const halfHeight = segmentHeight / 2;
    const outerX = -radius - halfWidth;
    const innerX = -radius + halfWidth;
    const rotationAngle = calculateIsoscelesTriangleAngle(Math.abs(outerX), segmentLength);

    tmp_vector_0.set(outerX, 0, 0).applyAxisAngle(tmp_rotationAxis, rotationAngle);
    tmp_vector_1.set(innerX, 0, 0).applyAxisAngle(tmp_rotationAxis, rotationAngle);
    const a = new Vector3(outerX, -halfHeight, 0);
    const b = new Vector3(innerX, -halfHeight, 0);
    const c = new Vector3().copy(b).setY(halfHeight);
    const d = new Vector3().copy(a).setY(halfHeight);
    const e = new Vector3(tmp_vector_0.x, -halfHeight, tmp_vector_0.z);
    const f = new Vector3(tmp_vector_1.x, -halfHeight, tmp_vector_1.z);
    const g = new Vector3().copy(f).setY(halfHeight);
    const h = new Vector3().copy(e).setY(halfHeight);

    tmp_object3d.position.set(-radius, 0, 0);
    tmp_object3d.rotation.set(0, 0, 0);

    for (let i = 0; i < segmentCount; i++) {
        tmp_object3d.rotateOnAxis(tmp_rotationAxis, rotationAngle);

        cantedCurveElementChildrenPropertyList.push({
            shape: MapElementShape.convexGeometry,
            points: [a, b, c, d, e, f, g, h].map((v) => v.toArray()),
            position_x: tmp_object3d.position.x,
            position_y: tmp_object3d.position.y,
            position_z: tmp_object3d.position.z,
            rotation_x: radToDeg(tmp_object3d.rotation.x),
            rotation_y: radToDeg(tmp_object3d.rotation.y),
            rotation_z: radToDeg(tmp_object3d.rotation.z),
        });
    }

    return cantedCurveElementChildrenPropertyList;
}

function generateCantedCurveElementChildrenPropertyList(props: CantedCurveProps) {
    const {
        segmentCount, segmentWidth, segmentHeight, segmentLength, angle, radius,
    } = assignDefaultValues(props, cantedCurveDefaultProps);
    const cantedCurveElementChildrenPropertyList: MapElementProps[] = [];
    const rotationAxis = tmp_rotationAxis;
    rotationAxis.set(0, 1, 0);

    const cantAngle = degToRad(angle);
    const _c = segmentWidth / 2;
    const _a = _c * Math.cos(cantAngle); // c * sin(α) / sin(γ) # sin(γ) = 1
    const _b = Math.sqrt(_c ** 2 - _a ** 2);
    const halfSegmentLength = segmentLength / 2;
    const innerTriangleAlpha = Math.atan((radius - _a) / halfSegmentLength);
    const rotationPerSegment = Math.PI - 2 * innerTriangleAlpha;

    const segmentDiagonalLength = Math.sqrt(segmentLength ** 2 + segmentWidth ** 2);

    const peekVertex = tmp_vector_0.set(halfSegmentLength, _b, -radius + -_a);
    const peekVertexRotated = tmp_vector_1.copy(peekVertex).applyAxisAngle(rotationAxis, rotationPerSegment);
    const peekToPeekLen = peekVertexRotated.sub(peekVertex).length();

    const _s = (segmentWidth + segmentDiagonalLength + peekToPeekLen) / 2; // semi perimeter
    const cmpSegmentArea = Math.sqrt(_s * (_s - segmentWidth) * (_s - segmentDiagonalLength) * (_s - peekToPeekLen));
    const cmpSegmentHeight = 2 * cmpSegmentArea / segmentWidth;

    const cmpSegmentOffset = segmentWidth / 2 - (segmentWidth - Math
        .sqrt(segmentDiagonalLength ** 2 - cmpSegmentHeight ** 2));
    const _z = cmpSegmentOffset * Math.cos(cantAngle);
    const _y = Math.sqrt(cmpSegmentOffset ** 2 - _z ** 2);
    const cmpPeekVertex = tmp_vector_1.set(halfSegmentLength + cmpSegmentHeight, _y, -radius + -_z);
    cmpPeekVertex.applyAxisAngle(rotationAxis, rotationPerSegment);
    const cmpPeekToPeekLen = cmpPeekVertex.sub(peekVertex).length();

    const cmpRotation = Math.acos(
        (cmpSegmentHeight ** 2 + cmpSegmentHeight ** 2 - cmpPeekToPeekLen ** 2)
        / (2 * cmpSegmentHeight * cmpSegmentHeight),
    );
    const cmpOffsetX = cmpSegmentHeight / 2 * Math.sin(cmpRotation);

    for (let i = 0; i < segmentCount + 1; i++) {
        rotationAxis.set(0, 1, 0);
        tmp_position.set(0, 0, -radius).applyAxisAngle(rotationAxis, rotationPerSegment * i);
        tmp_object3d.position.copy(tmp_position);
        tmp_object3d.rotation.set(0, rotationPerSegment * i, Math.PI / 2);

        tmp_object3d.rotateOnAxis(rotationAxis, -cantAngle);
        tmp_object3d.translateZ(segmentHeight / 2);

        if (i < segmentCount) {
            cantedCurveElementChildrenPropertyList.push({
                shape: MapElementShape.triangularPrism,
                width: segmentHeight,
                height: segmentLength,
                length: segmentWidth,
                offset: segmentWidth / 2,
                position_x: tmp_object3d.position.x,
                position_y: tmp_object3d.position.y,
                position_z: tmp_object3d.position.z,
                rotation_x: radToDeg(tmp_object3d.rotation.x),
                rotation_y: radToDeg(tmp_object3d.rotation.y),
                rotation_z: radToDeg(tmp_object3d.rotation.z),
            });
        }

        if (i) {
            rotationAxis.set(1, 0, 0);
            tmp_object3d.rotateOnAxis(rotationAxis, Math.PI);
            tmp_object3d.translateY(segmentLength / 2 + cmpSegmentHeight / 2);

            rotationAxis.set(0, 0, 1);
            tmp_object3d.rotateOnAxis(rotationAxis, -cmpRotation);
            tmp_object3d.translateX(cmpOffsetX);
            tmp_object3d.translateY(0);

            cantedCurveElementChildrenPropertyList.push({
                shape: MapElementShape.triangularPrism,
                width: segmentHeight,
                height: cmpSegmentHeight,
                length: segmentWidth,
                offset: cmpSegmentOffset,
                position_x: tmp_object3d.position.x,
                position_y: tmp_object3d.position.y,
                position_z: tmp_object3d.position.z,
                rotation_x: radToDeg(tmp_object3d.rotation.x),
                rotation_y: radToDeg(tmp_object3d.rotation.y),
                rotation_z: radToDeg(tmp_object3d.rotation.z),
            });
        }
    }

    return cantedCurveElementChildrenPropertyList;
}

function generateSlopeTransitionElementChildrenPropertyList(props: SlopeTransitionProps) {
    const {
        segmentCount, segmentWidth, segmentHeight, segmentLength,
    } = assignDefaultValues(props, slopeTransitionDefaultProps);

    const slopeTransitionElementChildrenPropertyList: MapElementProps[] = [];
    const baseHeight = 0.1;
    const rotationPerSegment = Math.atan(segmentHeight / segmentWidth);

    tmp_object3d.position.set(0, baseHeight, 0);
    tmp_object3d.rotation.set(0, 0, 0);

    for (let i = 0; i < segmentCount; i++) {
        if (i) {
            tmp_object3d.translateY(segmentHeight);
            tmp_object3d.translateZ(-segmentLength);
        }

        tmp_object3d.rotation.set(0, 0, -rotationPerSegment * i);

        slopeTransitionElementChildrenPropertyList.push({
            shape: MapElementShape.tetrahedron,
            width: segmentWidth / 2,
            height: segmentHeight / 2,
            length: segmentLength / 2,
            position_x: tmp_object3d.position.x,
            position_y: tmp_object3d.position.y,
            position_z: tmp_object3d.position.z,
            rotation_z: radToDeg(tmp_object3d.rotation.z),
        });

        tmp_position.copy(tmp_object3d.position);
        tmp_object3d.translateX(segmentWidth / 2);
        tmp_object3d.translateY(-baseHeight / 2);
        tmp_object3d.translateZ(segmentLength / 2);

        slopeTransitionElementChildrenPropertyList.push({
            shape: MapElementShape.box,
            width: segmentWidth,
            height: baseHeight,
            length: segmentLength,
            position_x: tmp_object3d.position.x,
            position_y: tmp_object3d.position.y,
            position_z: tmp_object3d.position.z,
            rotation_z: radToDeg(tmp_object3d.rotation.z),
        });

        tmp_object3d.position.copy(tmp_position);
    }

    return slopeTransitionElementChildrenPropertyList;
}

function assignDefaultValues<O1, O2>(props: O1, defaultProps: O2) {
    return {
        ...defaultProps,
        ...props,
    };
}

/**
 * γ = cos⁻¹((2a²-b²) / 2a²)
 */
function calculateIsoscelesTriangleAngle(legLength: number, baseLength: number) {
    const x = 2 * legLength ** 2;
    const y = baseLength ** 2;

    return Math.acos((x - y) / x);
}
