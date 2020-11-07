const hud = document.createElement('aside');
const timer = document.createElement('span');
const defaultTimerContent = '00:00.000';

hud.classList.add('floatingElement');
hud.id = 'hud';

export class GameProgressManager {
    started = false;
    result = '';
    private stopped = false;
    private startTime = 0;
    private stopTime = 0;

    constructor() {
        timer.textContent = defaultTimerContent;
        hud.appendChild(timer);
        document.body.appendChild(hud);
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
        this.result = this.getElapsedTime();
    }

    resetTimer() {
        this.started = false;
        this.startTime = undefined;
        timer.textContent = defaultTimerContent;
    }
}

function appendLeadingZero(value: string) {
    if (value.length < 2) {
        value = `0${value}`;
    }

    return value;
}
