import EventListener from '../common/EventListener';
import Timer from '../common/Timer';
import { CheckpointManager } from '../mapModules/checkpointManager';
import { MapBuilder } from '../mapModules/mapBuilder';
import { mapCollection } from '../maps/mapCollection';
import { GameProgressModal, mountModalController } from './gameProgressModalController';

export enum GameProgressEvent {
    openModal = 'openModal',
}

const hud = document.createElement('aside');
const timeDisplay = document.createElement('span');
const timeDisplayDefaultContent = '00:00.000';
hud.id = 'hud';

const mapOrder = ['map01', 'map02', 'map03'];

export class GameProgressManager {
    timer = new Timer();
    listeners = new EventListener<GameProgressEvent>();
    started = false;
    result = '';
    checkpointsReached = 0;
    _mapBuilder: MapBuilder;
    _checkpointManager: CheckpointManager;
    currentMap = '';

    constructor(mapBuilder: MapBuilder, checkpointManager: CheckpointManager) {
        timeDisplay.textContent = timeDisplayDefaultContent;
        hud.appendChild(timeDisplay);
        document.getElementById('topLeftPanel').appendChild(hud);

        this._mapBuilder = mapBuilder;
        this._checkpointManager = checkpointManager;

        mountModalController(this);
    }

    start() {
        this.started = true;
        this.timer.start();
    }

    stop() {
        this.timer.stop();
        this.result = this.getElapsedTimeFormatted();
    }

    reset() {
        this.started = false;
        this.checkpointsReached = 0;
        this.result = '';
        timeDisplay.textContent = timeDisplayDefaultContent;
        this.timer.reset();

        this._mapBuilder.resetDynamicMapElements();
        this._checkpointManager.init(this._mapBuilder, this);
    }

    loadMap(mapName = 'map01') {
        if (!mapCollection.hasOwnProperty(mapName)) {
            console.warn(`invalid map name ${mapName}`);
            return;
        }
        this._mapBuilder.importMap(mapCollection[mapName]);
        this.currentMap = mapName;
        this.reset();
    }

    loadNextMap() {
        const currentMapIndex = mapOrder.indexOf(this.currentMap);

        if (currentMapIndex < mapOrder.length - 1) {
            const mapName = mapOrder[currentMapIndex + 1];
            this.loadMap(mapName);
        } else {
            this.reset();
        }
    }

    checkpointReached = () => {
        this.checkpointsReached++;
    }

    updateHUD() {
        if (!this.timer.started || this.timer.stopped) {
            return;
        }

        timeDisplay.textContent = this.getElapsedTimeFormatted();
    }

    getElapsedTimeFormatted() {
        const dt = this.timer.time;
        const milSec = Math.floor(dt % 1000);
        const sec = Math.floor(dt / 1000 % 60);
        const min = Math.floor(dt / 60000 % 60);

        return `${appendLeadingZero(min)}:${appendLeadingZero(sec)}.${milSec}`;
    }

    openModal(modalId: GameProgressModal) {
        this.listeners.dispatch(GameProgressEvent.openModal, modalId);
    }
}

function appendLeadingZero(value: number) {
    const str = value.toString();

    return str.length < 2 ? `0${value}` : str;
}
