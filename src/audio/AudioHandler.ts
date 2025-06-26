import { Audio, AudioListener, AudioLoader } from 'three';

import cfg, { configListener } from '../config';

const filePath = 'music/A Himitsu - Cease.ogg';

export class AudioHandler {
    audioListener = new AudioListener();
    audioSource = new Audio(this.audioListener);

    constructor() {
        if (cfg.disableAudio) {
            return;
        }

        const audioLoader = new AudioLoader();

        audioLoader.load(filePath, (buffer) => {
            this.audioSource.setBuffer(buffer);
            this.audioSource.setLoop(true);
        });

        configListener.add('audioVolume', (value) => {
            this.audioSource.setVolume(value);
        });
    }

    play(delay?: number) {
        if (cfg.disableAudio) {
            return;
        }

        if (!this.audioSource.isPlaying) {
            this.audioSource.play(delay);
        }
    }
}
