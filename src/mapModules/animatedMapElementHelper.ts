import { Body, Vec3 } from 'cannon-es';

const tmp_direction = new Vec3();

export type AnimationProps = ReturnType<typeof defineAnimationProps>;

export function defineAnimationProps(body: Body, dataSet: string) {
    const initialVelocity = new Vec3();
    const inverseVelocity = new Vec3();
    const startPosition = new Vec3();
    const endPosition = new Vec3();
    const {
        movement: { x = 0, y = 0, z = 0 },
        speed = 1,
        triggerStart = true,
        alternate = true,
        alternateDelay = 0,
    } = JSON.parse(dataSet);
    const movementPrecision = speed * 0.05;

    startPosition.copy(body.position);
    endPosition.set(x, y, z);
    endPosition.vadd(body.position, endPosition);

    endPosition.vsub(startPosition, tmp_direction);
    tmp_direction.normalize();
    tmp_direction.scale(speed, initialVelocity);
    initialVelocity.negate(inverseVelocity);

    return {
        triggerStart,
        movementHandler,
        velocity_x: initialVelocity.x,
        velocity_y: initialVelocity.y,
        velocity_z: initialVelocity.z,
    };

    function movementHandler() {
        if (body.position.almostEquals(endPosition, movementPrecision) && isMovingTowards(endPosition)) {
            if (alternate) {
                if (alternateDelay) {
                    body.velocity.setZero();
                    window.setTimeout(startMovingTowardsStartPosition, alternateDelay * 1000);
                } else {
                    startMovingTowardsStartPosition();
                }
            } else {
                body.velocity.setZero();
            }
            body.position.copy(endPosition);
        } else if (body.position.almostEquals(startPosition, movementPrecision) && isMovingTowards(startPosition)) {
            if (alternateDelay) {
                body.velocity.setZero();
                window.setTimeout(startMovingTowardsEndPosition, alternateDelay * 1000);
            } else {
                startMovingTowardsEndPosition();
            }
            body.position.copy(startPosition);
        }
    }

    function startMovingTowardsStartPosition() {
        body.velocity.copy(inverseVelocity);
    }

    function startMovingTowardsEndPosition() {
        body.velocity.copy(initialVelocity);
    }

    function isMovingTowards(targetPosition: Vec3) {
        targetPosition.vsub(body.position, tmp_direction);

        return tmp_direction.dot(body.velocity) > 0;
    }
}
