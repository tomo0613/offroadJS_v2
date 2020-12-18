import { Body } from 'cannon-es';
import { Mesh, Scene, Vector3 } from 'three';

import ObjectPool from '../common/ObjectPool';
import { GameProgressManager } from '../gameProgress/gameProgressManager';
import { MapBuilder, TriggerMapElementEvent, TriggeredEvent } from './mapBuilder';

interface Icon3dList {
    checkpoint: Mesh;
    finish: Mesh;
}

const PIx2 = Math.PI * 2;
let animationHeightOffset = 0;

export class CheckpointManager {
    activeCheckpoints = new Set<Body>();
    checkpointIconToElementLinks = new Map<Body, Mesh>();
    checkpointIcon3dPool: ObjectPool<Mesh>;
    finishIcon3d: Mesh;
    gameProgress: GameProgressManager;
    scene: Scene;

    constructor(scene: Scene, icon3dList: Icon3dList) {
        this.scene = scene;
        this.finishIcon3d = icon3dList.finish;
        this.checkpointIcon3dPool = new ObjectPool<Mesh>(1, {
            itemProvider() {
                return icon3dList.checkpoint.clone();
            },
            itemActiveCheck(icon3d) {
                return icon3d.visible;
            },
            itemActivator(icon3d) {
                icon3d.visible = true;
            },
            itemDeactivator(icon3d) {
                icon3d.visible = false;
            },
        });

        this.scene.add(this.finishIcon3d);
    }

    init(mapBuilder: MapBuilder, gameProgress: GameProgressManager) {
        this.gameProgress = gameProgress;

        mapBuilder.eventTriggerListeners.add(TriggerMapElementEvent.checkpoint, this.checkpointEventHandler);
        mapBuilder.eventTriggerListeners.add(TriggerMapElementEvent.finish, this.finishEventHandler);

        if (this.checkpointIcon3dPool.activeCount) {
            this.checkpointIcon3dPool.releaseAll();
        }

        if (this.activeCheckpoints.size) {
            this.activeCheckpoints.clear();
        }

        mapBuilder.mapElementIdList.forEach((mapElementId) => {
            if (mapElementId.startsWith('trigger')) {
                const { event } = mapBuilder.getPropsFromStore(mapElementId);

                if (event === 'checkpoint') {
                    this.setActiveCheckpoint(mapBuilder.getBodyFromStore(mapElementId));
                } else if (event === 'finish') {
                    this.setFinish(mapBuilder.getBodyFromStore(mapElementId));
                }
            }
        });
    }

    setActiveCheckpoint(triggerElementBody: Body) {
        const icon3d = this.checkpointIcon3dPool.obtain();
        icon3d.position.copy(triggerElementBody.position as unknown as Vector3);

        this.activeCheckpoints.add(triggerElementBody);
        this.checkpointIconToElementLinks.set(triggerElementBody, icon3d);

        this.scene.add(icon3d);
    }

    setFinish(triggerElementBody: Body) {
        this.finishIcon3d.position.copy(triggerElementBody.position as unknown as Vector3);
    }

    checkpointEventHandler = ({ target, relatedTarget }: TriggeredEvent) => {
        // if (relatedTarget === aVehicle.chassisBody) {
        if (this.activeCheckpoints.has(target)) {
            this.gameProgress.checkpointReached();

            const icon3d = this.checkpointIconToElementLinks.get(target);
            this.checkpointIcon3dPool.release(icon3d);
            this.activeCheckpoints.delete(target);
        }
    }

    finishEventHandler = ({ target, relatedTarget, dataSet }: TriggeredEvent) => {
        // if (relatedTarget === aVehicle.chassisBody) {
        if (parseCheckpointCount(dataSet) === this.gameProgress.checkpointsReached) {
            this.gameProgress.stop();
            this.gameProgress.openModal();
        }
    }

    updateVisuals(dt: number) {
        animationHeightOffset = Math.sin(dt / 1000) / 500;

        this.checkpointIcon3dPool.forActive(animateIcon3d);
        animateIcon3d(this.finishIcon3d);
    }
}

function animateIcon3d(icon3d: Mesh) {
    const r = icon3d.rotation.y + 0.02;
    icon3d.rotation.y = r >= PIx2 ? 0 : r;
    icon3d.position.y += animationHeightOffset;
}

function parseCheckpointCount(dataSet: string) {
    const [, checkpointCount] = dataSet.match(/checkpoints:(\d+)/) || [];

    return checkpointCount ? Number(checkpointCount) : 0;
}
