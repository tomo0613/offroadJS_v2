import { Body } from 'cannon-es';
import { BoxBufferGeometry, Mesh, MeshPhongMaterial, Scene, Vector3 } from 'three';

import ObjectPool from '../common/ObjectPool';
import { MapBuilder, TriggerMapElementEvent, TriggeredEvent } from '../mapModules/mapBuilder';
import { GameProgressManager } from './gameProgressManager';

export interface Icon3dList {
    checkpoint: Mesh;
    finish: Mesh;
}

const checkpointCountRegExp = /checkpointCount:\w*(\d+)/i;

const PIx2 = Math.PI * 2;
const iconRotationSpeed = 0.02;
let animationHeightOffset = 0;
let animationLightnessOffset = 0;

export class CheckpointHandler {
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
                return icon3dList.checkpoint.clone() as Mesh;
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
        if (relatedTarget === this.gameProgress.vehicle.chassisBody) {
            if (this.activeCheckpoints.has(target)) {
                this.gameProgress.checkpointReached(target);

                const icon3d = this.checkpointIconToElementLinks.get(target);
                this.checkpointIcon3dPool.release(icon3d);
                this.activeCheckpoints.delete(target);
            }
        }
    }

    finishEventHandler = ({ target, relatedTarget, dataSet }: TriggeredEvent) => {
        if (relatedTarget === this.gameProgress.vehicle.chassisBody) {
            if (parseCheckpointCount(dataSet) === this.gameProgress.checkpointsReached) {
                this.gameProgress.stop();
                this.gameProgress.openModal();
            }
        }
    }

    updateVisuals(dt: number) {
        animationHeightOffset = Math.sin(dt / 1000) / 500;
        animationLightnessOffset = 0.5 * Math.sin(dt / 500) * 0.005;

        this.checkpointIcon3dPool.forActive(animateIcon3d);
        animateIcon3d(this.finishIcon3d);
    }
}

export function getCheckpointIcon3d() {
    const checkpointIcon3d = new Mesh(
        new BoxBufferGeometry(0.8, 0.8, 0.8),
        new MeshPhongMaterial({
            color: 0x000000,
            specular: 0x666666,
            emissive: 0x00AA00,
            shininess: 10,
            transparent: true,
            opacity: 0.6,
        }),
    );
    checkpointIcon3d.rotation.set(Math.PI / 4, 0, Math.PI / 4);

    return checkpointIcon3d;
}

function animateIcon3d(icon3d: Mesh) {
    const r = icon3d.rotation.y + iconRotationSpeed;
    icon3d.rotation.y = r >= PIx2 ? 0 : r;
    icon3d.position.y += animationHeightOffset;

    if (icon3d.material) {
        (icon3d.material as MeshPhongMaterial).emissive.offsetHSL(0, 0, animationLightnessOffset);
    }
}

function parseCheckpointCount(dataSet: string) {
    const [, checkpointCount] = dataSet.match(checkpointCountRegExp) || [];

    return checkpointCount ? Number(checkpointCount) : 0;
}
