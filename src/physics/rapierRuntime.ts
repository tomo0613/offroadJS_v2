import RAPIER from '@dimforge/rapier3d-compat';
// eslint-disable-next-line import/extensions
// import { RapierPhysics } from 'three/addons/physics/RapierPhysics.js';

type StepListener = (dt?: number) => void;
type CollisionListener = (event: { target: RAPIER.RigidBody; body: RAPIER.RigidBody | null }) => void;

const fixedRotationState = new WeakMap<RAPIER.RigidBody, boolean>();

const allGroupBits = 0xFFFF;

export const CollisionGroupBits = {
    solid: 0b0001,
    sensor: 0b0010,
} as const;

export function createInteractionGroups(memberships: number, filter: number) {
    // eslint-disable-next-line no-bitwise
    const membershipsMask = memberships & allGroupBits;
    // eslint-disable-next-line no-bitwise
    const filterMask = filter & allGroupBits;

    return membershipsMask * 0x10000 + filterMask;
}

export const defaultInteractionGroups = createInteractionGroups(allGroupBits, allGroupBits);
export const sensorInteractionGroups = createInteractionGroups(CollisionGroupBits.sensor, allGroupBits);
export const wheelQueryInteractionGroups = createInteractionGroups(
    CollisionGroupBits.solid,
    CollisionGroupBits.solid,
);

export async function initPhysics() {
    await RAPIER.init();
}

export class PhysicsWorld {
    raw: RAPIER.World;
    eventQueue: RAPIER.EventQueue;
    private preStepListeners = new Set<StepListener>();
    private postStepListeners = new Set<StepListener>();
    private colliderHandleToBody = new Map<number, RAPIER.RigidBody>();
    private collisionListeners = new Map<RAPIER.RigidBody, Set<CollisionListener>>();
    bodyToColliders = new Map<RAPIER.RigidBody, RAPIER.Collider[]>();

    constructor(gravity: { x: number; y: number; z: number }) {
        this.raw = new RAPIER.World(gravity);
        this.eventQueue = new RAPIER.EventQueue(true);
    }

    addEventListener(type: 'preStep' | 'postStep', listener: StepListener) {
        if (type === 'preStep') {
            this.preStepListeners.add(listener);
        } else {
            this.postStepListeners.add(listener);
        }
    }

    removeEventListener(type: 'preStep' | 'postStep', listener: StepListener) {
        if (type === 'preStep') {
            this.preStepListeners.delete(listener);
        } else {
            this.postStepListeners.delete(listener);
        }
    }

    addRigidBody(desc: RAPIER.RigidBodyDesc, fixedRotation = false) {
        const body = this.raw.createRigidBody(desc);

        fixedRotationState.set(body, fixedRotation);
        if (fixedRotation) {
            body.lockRotations(true, true);
        }

        return body;
    }

    setBodyFixedRotation(body: RAPIER.RigidBody, fixedRotation: boolean) {
        fixedRotationState.set(body, fixedRotation);
        body.lockRotations(fixedRotation, true);
    }

    setBodyColliders(body: RAPIER.RigidBody, colliderDescs: RAPIER.ColliderDesc[]) {
        const oldColliders = this.bodyToColliders.get(body);
        if (oldColliders?.length) {
            oldColliders.forEach((collider) => {
                this.colliderHandleToBody.delete(collider.handle);
                this.raw.removeCollider(collider, true);
            });
        }

        const newColliders = colliderDescs.map((desc) => {
            const collider = this.raw.createCollider(desc, body);
            this.colliderHandleToBody.set(collider.handle, body);

            return collider;
        });

        this.bodyToColliders.set(body, newColliders);
    }

    removeBody(body: RAPIER.RigidBody) {
        const colliders = this.bodyToColliders.get(body);
        if (colliders?.length) {
            colliders.forEach((collider) => {
                this.colliderHandleToBody.delete(collider.handle);
            });
        }

        this.bodyToColliders.delete(body);
        this.collisionListeners.delete(body);
        this.raw.removeRigidBody(body);
    }

    addBodyCollisionListener(body: RAPIER.RigidBody, listener: CollisionListener) {
        if (!this.collisionListeners.has(body)) {
            this.collisionListeners.set(body, new Set());
        }
        this.collisionListeners.get(body).add(listener);
    }

    removeBodyCollisionListener(body: RAPIER.RigidBody, listener: CollisionListener) {
        this.collisionListeners.get(body)?.delete(listener);
    }

    step(fixedTimeStep: number, dt = fixedTimeStep) {
        this.preStepListeners.forEach((listener) => listener(dt));

        this.raw.timestep = fixedTimeStep;
        this.raw.step(this.eventQueue);

        this.eventQueue.drainCollisionEvents((colliderHandleA, colliderHandleB, started) => {
            if (!started) {
                return;
            }

            const bodyA = this.colliderHandleToBody.get(colliderHandleA);
            const bodyB = this.colliderHandleToBody.get(colliderHandleB);

            if (!bodyA || !bodyB) {
                return;
            }

            this.collisionListeners.get(bodyA)?.forEach((listener) => {
                listener({ target: bodyA, body: bodyB });
            });
            this.collisionListeners.get(bodyB)?.forEach((listener) => {
                listener({ target: bodyB, body: bodyA });
            });
        });

        this.postStepListeners.forEach((listener) => listener(dt));
    }

    rebuildBodyAsType(body: RAPIER.RigidBody, type: RAPIER.RigidBodyType, mass = 0) {
        body.setBodyType(type, true);
        body.setAdditionalMass(Math.max(0, mass), true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);

        const fixedRotation = fixedRotationState.get(body) || false;
        body.lockRotations(fixedRotation, true);
    }
}

export function bodyPosition(body: RAPIER.RigidBody) {
    return body.translation();
}

export function bodyRotation(body: RAPIER.RigidBody) {
    return body.rotation();
}
