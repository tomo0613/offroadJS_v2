import { Object3D, Vector3 } from 'three';

import { radToDeg } from '../utils';
import { MapElementOrientationProps, MapElementProps, MapElementShape } from './mapBuilder';

export const loopDefaultProps = {
    segmentCount: 13,
    segmentWidth: 2,
    segmentHeight: 0.1,
    segmentLength: 2,
    segmentPositionOffset: 0.4,
    radius: 4,
};

export const loopPropKeys = Object
    .keys(loopDefaultProps) as (keyof typeof loopDefaultProps)[];

export const slopeTransitionDefaultProps = {
    segmentCount: 2,
    segmentWidth: 2,
    segmentHeight: 0.4,
    segmentLength: 4,
};

export const slopeTransitionPropKeys = Object
    .keys(slopeTransitionDefaultProps) as (keyof typeof slopeTransitionDefaultProps)[];

export type LoopProps = Partial<typeof loopDefaultProps> & MapElementOrientationProps;

export type SlopeTransitionProps = Partial<typeof slopeTransitionDefaultProps> & MapElementOrientationProps;

export const compoundShapes = ['loop', 'slopeTransition'];

const xAxis = new Vector3(1, 0, 0);
const tmp_position = new Vector3();
const tmp_object3d = new Object3D();

export function getCompoundElementChildrenPropertyList(props: MapElementProps) {
    switch (props.shape) {
        case MapElementShape.loop:
            return generateLoopElementChildrenPropertyList(props);
        case MapElementShape.slopeTransition:
            return generateSlopeTransitionElementChildrenPropertyList(props);
        default:
            return [];
    }
}

function generateLoopElementChildrenPropertyList(props: LoopProps) {
    const {
        segmentCount = loopDefaultProps.segmentCount,
        segmentWidth = loopDefaultProps.segmentWidth,
        segmentHeight = loopDefaultProps.segmentHeight,
        segmentLength = loopDefaultProps.segmentLength,
        segmentPositionOffset = loopDefaultProps.segmentPositionOffset,
        radius = loopDefaultProps.radius,
    } = props;

    const loopElementChildrenPropertyList: MapElementProps[] = [];
    const innerTriangleAlpha = Math.atan(radius / (segmentLength / 2));
    const rotationPerSegment = Math.PI - 2 * innerTriangleAlpha;

    for (let i = 0; i < segmentCount; i++) {
        tmp_position.set(segmentPositionOffset * i, -radius * 2, 0).applyAxisAngle(xAxis, rotationPerSegment * i);

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

function generateSlopeTransitionElementChildrenPropertyList(props: SlopeTransitionProps) {
    const {
        segmentCount = slopeTransitionDefaultProps.segmentCount,
        segmentWidth = slopeTransitionDefaultProps.segmentWidth,
        segmentHeight = slopeTransitionDefaultProps.segmentHeight,
        segmentLength = slopeTransitionDefaultProps.segmentLength,
    } = props;

    const slopeTransitionElementChildrenPropertyList: MapElementProps[] = [];
    const baseHeight = 0.1;
    const rotationPerSegment = Math.atan(segmentHeight / segmentWidth);

    tmp_object3d.position.set(0, baseHeight, 0);
    tmp_object3d.rotation.set(0, 0, 0);

    for (let i = 0; i < segmentCount; i++) {
        if (i) {
            tmp_object3d.translateY(segmentHeight * 2);
            tmp_object3d.translateZ(-segmentLength * 2);
        }

        tmp_object3d.rotation.set(0, 0, -rotationPerSegment * i);

        slopeTransitionElementChildrenPropertyList.push({
            shape: MapElementShape.triangularRamp,
            width: segmentWidth,
            height: segmentHeight,
            length: segmentLength,
            position_x: tmp_object3d.position.x,
            position_y: tmp_object3d.position.y,
            position_z: tmp_object3d.position.z,
            rotation_z: radToDeg(tmp_object3d.rotation.z),
        });

        tmp_position.copy(tmp_object3d.position);
        tmp_object3d.translateX(segmentWidth);
        tmp_object3d.translateY(-baseHeight);
        tmp_object3d.translateZ(segmentLength);

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
