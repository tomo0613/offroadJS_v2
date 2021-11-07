export default class Timer {
    started = false;
    stopped = false;
    private startTime = 0;
    private stopTime = 0;
    private relativeStopTime = 0;

    get time() {
        return this.stopped ? this.relativeStopTime : performance.now() - this.startTime;
    }

    start() {
        this.started = true;
        if (!this.stopped) {
            this.startTime = performance.now();
        } else {
            this.startTime += performance.now() - this.stopTime;
        }
        this.stopped = false;
    }

    stop() {
        this.relativeStopTime = this.time;
        this.stopTime = performance.now();
        this.stopped = true;
    }

    reset() {
        this.started = false;
        this.stopped = false;
        this.startTime = 0;
    }

    add(time: number) {
        this.startTime -= time;
    }
}
