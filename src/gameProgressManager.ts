const hud = document.createElement('aside');
const timer = document.createElement('span');
const defaultTimerContent = '00:00.000';

hud.id = 'hud';

export class GameProgressManager {
    started = false;
    result = '';
    checkpointsReached = 0;
    private stopped = false;
    private startTime = 0;
    private stopTime = 0;

    constructor() {
        timer.textContent = defaultTimerContent;
        hud.appendChild(timer);
        document.getElementById('topLeftPanel').appendChild(hud);
    }

    checkpointReached = () => {
        this.checkpointsReached++;
    }

    startTimer() {
        this.started = true;
        if (!this.stopped) {
            this.startTime = performance.now();
        } else {
            this.startTime += performance.now() - this.stopTime;
        }
        this.stopped = false;
    }

    updateHUD() {
        if (!this.startTime || this.stopped) {
            return;
        }

        timer.textContent = this.getElapsedTimeFormatted();
    }

    getElapsedTimeFormatted() {
        const dt = performance.now() - this.startTime;
        const milSec = Math.floor(dt % 1000);
        const sec = Math.floor(dt / 1000 % 60);
        const min = Math.floor(dt / 60000 % 60);

        return `${appendLeadingZero(min)}:${appendLeadingZero(sec)}.${milSec}`;
    }

    stopTimer() {
        this.stopTime = performance.now();
        this.stopped = true;
        // store mapHash
        this.result = this.getElapsedTimeFormatted();
    }

    resetTimer() {
        this.started = false;
        this.stopped = false;
        this.startTime = 0;
        timer.textContent = defaultTimerContent;
    }

    reset() {
        this.resetTimer();
        this.checkpointsReached = 0;
        this.result = '';
    }
}

function appendLeadingZero(value: number) {
    const str = value.toString();

    return str.length < 2 ? `0${value}` : str;
}
