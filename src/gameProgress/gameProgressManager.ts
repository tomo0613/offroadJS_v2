import { Body } from 'cannon-es';
import { Scene } from 'three';

import EventListener from '../common/EventListener';
import Timer from '../common/Timer';
import { MapBuilder, MapData } from '../mapModules/mapBuilder';
import { mapCollection } from '../maps/mapCollection';
import { formatTime } from '../utils';
import Vehicle from '../vehicle/Vehicle';
import { CheckpointHandler, Icon3dList } from './checkpointHandler';
import { mountModalController } from './gameProgressModalController';

export enum GameProgressEvent {
    openModal = 'openModal',
    openMapSelectorPanel = 'openMapSelectorPanel',
}

interface Goals {
    time?: number;
    respawnCount?: number;
}

let lastCheckpointTriggerBody: Body;

const respawnTimePenalty = 5e3;
const hud = document.createElement('aside');
const timeDisplay = document.createElement('span');
const timeDisplayDefaultContent = '00:00.000';
hud.id = 'hud';

const [defaultMapId] = Object.entries(mapCollection)[0];

export class GameProgressManager {
    timer = new Timer();
    listeners = new EventListener<GameProgressEvent>();
    started = false;
    checkpointsReached = 0;
    respawnCount = 0;
    time: number;
    goals: Goals;
    private _mapBuilder: MapBuilder;
    checkpointHandler: CheckpointHandler;
    vehicle: Vehicle;
    currentMapId = defaultMapId;

    constructor(mapBuilder: MapBuilder, vehicle: Vehicle) {
        timeDisplay.textContent = timeDisplayDefaultContent;
        hud.appendChild(timeDisplay);
        document.getElementById('topLeftPanel').appendChild(hud);

        this._mapBuilder = mapBuilder;
        this.vehicle = vehicle;

        mountModalController(this);
    }

    initCheckpointHandler(scene: Scene, icon3dList: Icon3dList) {
        this.checkpointHandler = new CheckpointHandler(scene, icon3dList);
    }

    checkpointReached = (checkpointTriggerBody: Body) => {
        lastCheckpointTriggerBody = checkpointTriggerBody;
        this.checkpointsReached++;
    }

    respawnAtLastCheckpoint() {
        if (lastCheckpointTriggerBody) {
            this.vehicle.chassisBody.velocity.setZero();
            this.vehicle.chassisBody.angularVelocity.setZero();
            this.vehicle.chassisBody.position.copy(lastCheckpointTriggerBody.position);
            this.vehicle.chassisBody.quaternion.copy(lastCheckpointTriggerBody.quaternion);
            this.respawnCount++;
            this.timer.add(respawnTimePenalty);
        } else {
            this.reset();
        }
    }

    start() {
        this.started = true;
        this.timer.start();
    }

    stop() {
        this.timer.stop();
        this.time = this.timer.time;
        // ToDo local store time by map elements md5
    }

    reset() {
        this.started = false;
        this.checkpointsReached = 0;
        this.respawnCount = 0;
        this.time = undefined;
        timeDisplay.textContent = timeDisplayDefaultContent;
        this.timer.reset();

        this._mapBuilder.resetDynamicMapElements();
        this.checkpointHandler.init(this._mapBuilder, this);
        lastCheckpointTriggerBody = undefined;
    }

    loadMap(mapId = this.currentMapId) {
        if (!mapCollection.hasOwnProperty(mapId)) {
            // eslint-disable-next-line no-console
            console.warn(`invalid map name ${mapId}`);

            return;
        }
        const { meta, elements } = mapCollection[mapId] as MapData;
        const lastSelectedMapElementId = this._mapBuilder.selectedMapElementId;

        this.goals = meta.goals || {};
        this._mapBuilder.importMap(elements);
        // ToDo invalidate time on change ?

        if (mapId === this.currentMapId && this._mapBuilder.editMode && lastSelectedMapElementId) {
            this._mapBuilder.selectMapElement(lastSelectedMapElementId);
        }

        this.currentMapId = mapId;
        this.reset();
    }

    loadNextMap() {
        const { meta } = mapCollection[this.currentMapId] as MapData;

        if (meta.next) {
            this.loadMap(meta.next);
        } else {
            this.reset();
        }
    }

    updateHUD() {
        if (!this.timer.started || this.timer.stopped) {
            return;
        }

        timeDisplay.textContent = formatTime(this.timer.time);
    }

    openModal() {
        this.listeners.dispatch(GameProgressEvent.openModal);
    }
}
