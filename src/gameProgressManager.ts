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

        timer.textContent = this.getElapsedTime();
    }

    getElapsedTime() {
        const elapsedTime = performance.now() - this.startTime;
        const milSec = (elapsedTime % 1000).toFixed();
        const sec = appendLeadingZero((elapsedTime / 1000 % 60).toFixed());
        const min = appendLeadingZero((elapsedTime / 60000 % 60).toFixed());

        return `${min}:${sec}.${milSec}`;
    }

    stopTimer() {
        this.stopTime = performance.now();
        this.stopped = true;
        // store mapHash
        this.result = this.getElapsedTime();
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

function appendLeadingZero(value: string) {
    if (value.length < 2) {
        value = `0${value}`;
    }

    return value;
}
