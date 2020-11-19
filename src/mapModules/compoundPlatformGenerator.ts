import { Vec3 } from 'cannon-es';
import { Euler, Group, Object3D, Quaternion, Vector3 } from 'three';

import { degToRad, radToDeg } from '../utils';
import { MapBuilder, MapElementOrientationProps } from './mapBuilder';

interface CompoundPlatformProps {
    segmentWidth: number;
    segmentHeight: number;
    segmentLength: number;
    segmentCount: number;
    position: Vec3;
}

const xAxis = new Vector3(1, 0, 0);
const tmp_vector = new Vector3();
const tmp_quaternion = new Quaternion();
const tmp_euler = new Euler();
const tmp_object3d = new Object3D();
const tmp_group = new Group();

export function generateLoop(this: MapBuilder, props: CompoundPlatformProps) {
    const { position } = props;
    const rotationZ = 90;
    const radius = 10;
    const totalElevation = 2;

    const segmentCount = 7;
    const segmentWidth = 3;
    const segmentHeight = 0.1;
    const segmentLength = 2;
    // ****************************************************

    // const circumference = 2 * radius * Math.PI;
    const segmentPositionOffset = totalElevation / segmentCount;

    const innerTriangleAlpha = Math.atan(radius / (segmentLength / 2));
    const anglePerSegment = Math.PI - 2 * innerTriangleAlpha;

    const group = tmp_group;
    // group.clear
    group.position.set(position.x, position.y, position.z);
    group.rotation.set(0, Math.PI / 2, Math.PI / 2);
    group.add(tmp_object3d);

    for (let i = 0; i < segmentCount; i++) {
        tmp_vector.set(segmentPositionOffset * i, -radius * 2, 0).applyAxisAngle(xAxis, anglePerSegment * i);
        tmp_object3d.position.copy(tmp_vector);
        tmp_object3d.rotation.set(anglePerSegment * i, 0, 0);

        tmp_object3d.getWorldPosition(tmp_vector);
        tmp_object3d.getWorldQuaternion(tmp_quaternion);
        tmp_euler.setFromQuaternion(tmp_quaternion);

        this.buildBox({
            width: segmentWidth,
            height: segmentHeight,
            length: segmentLength,

            position_x: tmp_vector.x,
            position_y: tmp_vector.y,
            position_z: tmp_vector.z,

            rotation_x: radToDeg(tmp_euler.x),
            rotation_y: radToDeg(tmp_euler.y),
            rotation_z: radToDeg(tmp_euler.z),
        });
    }
}

export function generateSlopeTransition(this: MapBuilder, props: CompoundPlatformProps) {
    const { segmentWidth = 2, segmentLength = 1, segmentHeight = 0.5, segmentCount = 2, position } = props;

    const width = segmentWidth;
    const height = segmentHeight;
    const boxHeight = 0.1;
    const length = segmentLength;
    const rotationPerSegment_deg = radToDeg(Math.atan(height / width));
    let prevRampId: string;

    for (let i = 0; i < segmentCount; i++) {
        const rampId = this.buildTriangularRamp({
            width,
            height,
            length,
            position_x: position.x,
            position_y: position.y,
            position_z: position.z - segmentLength * 2 * i,
            rotation_z: -rotationPerSegment_deg * i,
        });
        const rampMesh = this.getMeshFromStore(rampId);
        const rampBody = this.getBodyFromStore(rampId);

        if (prevRampId) {
            const prevRampMesh = this.getMeshFromStore(prevRampId);
            tmp_vector.copy(prevRampMesh.position);
            prevRampMesh.translateY(segmentHeight * 2);

            rampMesh.position.setX(prevRampMesh.position.x);
            rampMesh.position.setY(prevRampMesh.position.y);
            rampBody.position.x = prevRampMesh.position.x;
            rampBody.position.y = prevRampMesh.position.y;

            prevRampMesh.position.copy(tmp_vector);
        }

        const boxId = this.buildBox({
            width,
            height: boxHeight,
            length,
            rotation_z: -rotationPerSegment_deg * i,
        });
        const boxMesh = this.getMeshFromStore(boxId);
        const boxBody = this.getBodyFromStore(boxId);
        boxMesh.position.copy(rampMesh.position);
        boxMesh.translateX(segmentWidth);
        boxMesh.translateY(-boxHeight);
        boxMesh.translateZ(segmentLength);
        boxBody.position.copy(boxMesh.position as unknown as Vec3);

        prevRampId = rampId;
    }
}
