import EventListener from './common/EventListener';
import { debounce, isMobileDevice, noop } from './utils';

const navigationKeys = new Set([
    'Space',
    'PageUp',
    'PageDown',
    'End',
    'Home',
    'ArrowLeft',
    'ArrowUp',
    'ArrowRight',
    'ArrowDown',
    'Escape',
    'Tab',
]);
const controlKeys = new Set([
    'KeyF', // Ctrl + F – search
    'KeyH', // Ctrl + H – open browsing history
    'KeyJ', // Ctrl + J – open download history
    'KeyO', // Ctrl + O – open a file from your computer
    'KeyP', // Ctrl + P – print
    'KeyS', // Ctrl + S – save the page to your computer
]);
const keysDown = new Set<KeyboardEvent['code']>();
let currentKey: KeyboardEvent['code'];

type KeysDownChangeListener = (_keysDown: typeof keysDown) => void;
type EventHandler = (event: KeyboardEvent | MouseEvent | TouchEvent) => void;

const keyDownListeners = new Set<KeysDownChangeListener>();
const keyPressListeners = new EventListener<KeyboardEvent['code'], EventHandler>();

export default {
    addKeyPressListener,
    removeKeyPressListener,
    addKeyDownChangeListener,
    removeKeyDownChangeListener,
    clearKeysDown,
};

function addKeyDownChangeListener(listener: KeysDownChangeListener) {
    keyDownListeners.add(listener);
}

function removeKeyDownChangeListener(listener: KeysDownChangeListener) {
    keyDownListeners.delete(listener);
}

function addKeyPressListener(key: KeyboardEvent['code'], handler: EventHandler) {
    keyPressListeners.add(key, handler);
}

function removeKeyPressListener(key: KeyboardEvent['code'], handler: EventHandler) {
    keyPressListeners.remove(key, handler);
}

function clearKeysDown() {
    keysDown.clear();
    keyDownListeners.forEach(invokeKeyDownHandler);
}

// eslint-disable-next-line no-multi-assign
window.onkeydown = window.onkeyup = (e: KeyboardEvent) => {
    // keep default keyboard navigation in input elements
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tabIndex > -1) {
        return;
    }
    // prevent page scroll
    if (navigationKeys.has(e.code) || (e.ctrlKey && controlKeys.has(e.code))) {
        e.preventDefault();
    }
    if (e.type === 'keydown' && e.repeat) {
        return;
    }
    currentKey = e.code;

    if (e.type === 'keyup') {
        keysDown.delete(currentKey);
        keyPressListeners.dispatch(currentKey, e);
    } else {
        keysDown.add(currentKey);
    }

    handleKeysDownChange();
};

window.onbeforeunload = (e: BeforeUnloadEvent) => {
    if (keysDown.has('ControlLeft')) {
        e.preventDefault();
        keysDown.clear();

        return '';
    }

    return undefined;
};

appendScreenButton('topLeftPanel', 'Tab', '⋮');

if (isMobileDevice()) {
    appendScreenKey('bottomLeftPanel', 'ArrowUp', '▲');
    appendScreenKey('bottomLeftPanel', 'ArrowDown', '▼');
    appendScreenKey('bottomRightPanel', 'ArrowLeft', '◄');
    appendScreenKey('bottomRightPanel', 'ArrowRight', '►');
    appendScreenButton('topRightPanel', 'KeyP', 'p');
    appendScreenButton('topRightPanel', 'KeyC', 'c');
    appendScreenButton('topRightPanel', 'KeyR', '⟲');
}

function appendScreenInput(containerElementId: string, onEventStart: VoidFnc, onEventEnd: VoidFnc) {
    const button = document.createElement('button');

    button.addEventListener('mousedown', onEventStart);
    button.addEventListener('touchstart', onEventStart);

    button.addEventListener('mouseup', onEventEnd);
    button.addEventListener('mouseleave', onEventEnd);
    button.addEventListener('touchcancel', onEventEnd);
    button.addEventListener('touchend', onEventEnd);

    const containerElement = document.getElementById(containerElementId);
    containerElement.classList.remove('hidden');

    return containerElement.appendChild(button);
}

function appendScreenButton(containerElementId: string, key: string, label: string) {
    const onEvent = debounce((e: MouseEvent | TouchEvent) => {
        currentKey = key;
        keyPressListeners.dispatch(currentKey, e);
    }, 200, true);
    const button = appendScreenInput(containerElementId, onEvent, noop);
    button.textContent = label;
    button.id = key;
    button.classList.add('screenButton');
}

function appendScreenKey(containerElementId: string, key: string, label: string) {
    const onEventStart = () => {
        keysDown.add(key);
        handleKeysDownChange();
    };
    const onEventEnd = () => {
        keysDown.delete(key);
        handleKeysDownChange();
    };
    const button = appendScreenInput(containerElementId, onEventStart, onEventEnd);
    button.textContent = label;
    button.id = key;
    button.classList.add('screenKey');
}

function handleKeysDownChange() {
    keyDownListeners.forEach(invokeKeyDownHandler);
}

function invokeKeyDownHandler(keyDownHandler: KeysDownChangeListener) {
    keyDownHandler(keysDown);
}
