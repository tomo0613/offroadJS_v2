import Timer from './common/Timer';

const hud = document.createElement('aside');
const timeDisplay = document.createElement('span');
const timeDisplayDefaultContent = '00:00.000';
hud.id = 'hud';

export class GameProgressManager {
    timer = new Timer();
    started = false;
    result = '';
    checkpointsReached = 0;

    constructor() {
        timeDisplay.textContent = timeDisplayDefaultContent;
        hud.appendChild(timeDisplay);
        document.getElementById('topLeftPanel').appendChild(hud);
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
}

function appendLeadingZero(value: number) {
    const str = value.toString();

    return str.length < 2 ? `0${value}` : str;
}
