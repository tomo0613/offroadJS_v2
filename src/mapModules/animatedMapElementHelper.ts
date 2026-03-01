import RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';

const tmp_direction = new Vector3();

export type AnimationProps = ReturnType<typeof defineAnimationProps>;

export function defineAnimationProps(body: RAPIER.RigidBody, dataSet: string) {
    const initialVelocity = new Vector3();
    const inverseVelocity = new Vector3();
    const startPosition = new Vector3();
    const endPosition = new Vector3();
    const {
        movement: { x = 0, y = 0, z = 0 },
        speed = 1,
        triggerStart = true,
        alternate = true,
        alternateDelay = 0,
    } = JSON.parse(dataSet);
    const movementPrecision = speed * 0.05;

    startPosition.copy(body.translation() as unknown as Vector3);
    endPosition.set(x, y, z).add(startPosition);

    tmp_direction.copy(endPosition).sub(startPosition).normalize().multiplyScalar(speed);
    initialVelocity.copy(tmp_direction);
    inverseVelocity.copy(initialVelocity).negate();

    return {
        triggerStart,
        movementHandler,
        velocity_x: initialVelocity.x,
        velocity_y: initialVelocity.y,
        velocity_z: initialVelocity.z,
    };

    function movementHandler() {
        const currentPosition = body.translation() as unknown as Vector3;
        if (currentPosition.distanceTo(endPosition) <= movementPrecision && isMovingTowards(endPosition)) {
            if (alternate) {
                if (alternateDelay) {
                    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                    window.setTimeout(startMovingTowardsStartPosition, alternateDelay * 1000);
                } else {
                    startMovingTowardsStartPosition();
                }
            } else {
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            }
            body.setTranslation(endPosition, true);
        } else if (currentPosition.distanceTo(startPosition) <= movementPrecision && isMovingTowards(startPosition)) {
            if (alternateDelay) {
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                window.setTimeout(startMovingTowardsEndPosition, alternateDelay * 1000);
            } else {
                startMovingTowardsEndPosition();
            }
            body.setTranslation(startPosition, true);
        }
    }

    function startMovingTowardsStartPosition() {
        body.setLinvel(inverseVelocity, true);
    }

    function startMovingTowardsEndPosition() {
        body.setLinvel(initialVelocity, true);
    }

    function isMovingTowards(targetPosition: Vector3) {
        const velocity = body.linvel() as unknown as Vector3;
        tmp_direction.copy(targetPosition).sub(body.translation() as unknown as Vector3);

        return tmp_direction.dot(velocity) > 0;
    }
}
