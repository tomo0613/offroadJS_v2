import { Body, Vec3 } from 'cannon-es';

const tmp_direction = new Vec3();

export type AnimationProps = ReturnType<typeof defineAnimationProps>;

export function defineAnimationProps(body: Body, dataSet: string) {
    const initialVelocity = new Vec3();
    const inverseVelocity = new Vec3();
    const origin = new Vec3();
    const target = new Vec3();
    const {
        movement: { x = 0, y = 0, z = 0 },
        speed = 1,
        triggerStart = true,
        alternate = true,
        alternateDelay = 0,
    } = JSON.parse(dataSet);

    origin.copy(body.position);
    target.set(x, y, z);
    target.vadd(body.position, target);

    target.vsub(origin, tmp_direction);
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
        if (body.position.almostEquals(target, 0.05) && isMovingTowards(target)) {
            if (alternate) {
                if (alternateDelay) {
                    body.velocity.setZero();
                    window.setTimeout(moveTowardsOrigin, alternateDelay * 1000);
                } else {
                    moveTowardsOrigin();
                }
            } else {
                body.velocity.setZero();
            }
            body.position.copy(target);
        } else if (body.position.almostEquals(origin, 0.05) && isMovingTowards(origin)) {
            if (alternateDelay) {
                body.velocity.setZero();
                window.setTimeout(moveTowardsTarget, alternateDelay * 1000);
            } else {
                moveTowardsTarget();
            }
            body.position.copy(origin);
        }
    }

    function moveTowardsOrigin() {
        body.velocity.copy(inverseVelocity);
    }

    function moveTowardsTarget() {
        body.velocity.copy(initialVelocity);
    }

    function isMovingTowards(targetPosition: Vec3) {
        targetPosition.vsub(body.position, tmp_direction);

        return tmp_direction.dot(body.velocity) > 0;
    }
}
