import { isMobileDevice, NOP } from './utils';

const navigationKeys = [
    ' ',
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
];
const keysDown = new Set<KeyboardEvent['key']>();

type KeyDownListener = (_keysDown: typeof keysDown) => void;
type KeyPressListener = (keyPressed: KeyboardEvent['key']) => void;

const keyDownListeners = new Set<KeyDownListener>();
const keyPressListeners = new Set<KeyPressListener>();

export default {
    addKeyDownListener,
    removeKeyDownListener,
    addKeyPressListener,
    removeKeyPressListener,
    clearKeysDown,
};

function addKeyDownListener(listener: KeyDownListener) {
    keyDownListeners.add(listener);
}

function removeKeyDownListener(listener: KeyDownListener) {
    keyDownListeners.delete(listener);
}

function addKeyPressListener(listener: KeyPressListener) {
    keyPressListeners.add(listener);
}

function removeKeyPressListener(listener: KeyPressListener) {
    keyPressListeners.delete(listener);
}

function clearKeysDown() {
    keysDown.clear();
    keyDownListeners.forEach(invokeKeyDownHandler);
}

let currentKey: KeyboardEvent['key'];

// eslint-disable-next-line no-multi-assign
onkeydown = onkeyup = (e) => {
    // keep default keyboard navigation in input elements
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tabIndex > -1) {
        return;
    }
    // prevent page scroll
    if (navigationKeys.includes(e.key)) {
        e.preventDefault();
    }
    if (e.type === 'keydown' && e.repeat) {
        return;
    }
    currentKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;

    if (e.type === 'keyup') {
        keysDown.delete(currentKey);
        keyPressListeners.forEach(invokeKeyPressHandler);
    } else {
        keysDown.add(currentKey);
    }

    keyDownListeners.forEach(invokeKeyDownHandler);
};

appendScreenButton('topLeftPanel', 'Tab', '⋮');

if (isMobileDevice()) {
    appendScreenKey('bottomLeftPanel', 'ArrowUp', '▲');
    appendScreenKey('bottomLeftPanel', 'ArrowDown', '▼');
    appendScreenKey('bottomRightPanel', 'ArrowLeft', '◄');
    appendScreenKey('bottomRightPanel', 'ArrowRight', '►');
    appendScreenButton('topRightPanel', 'P', 'p');
    appendScreenButton('topRightPanel', 'C', 'c');
    appendScreenButton('topRightPanel', 'R', '⟲');
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
    const onEvent = () => {
        currentKey = key;
        keyPressListeners.forEach(invokeKeyPressHandler);
    };
    const button = appendScreenInput(containerElementId, onEvent, NOP);
    button.textContent = label;
    button.id = key;
    button.classList.add('screenButton');
}

function appendScreenKey(containerElementId: string, key: string, label: string) {
    const onEventStart = () => {
        keysDown.add(key);
        keyDownListeners.forEach(invokeKeyDownHandler);
    };
    const onEventEnd = () => {
        keysDown.delete(key);
        keyDownListeners.forEach(invokeKeyDownHandler);
    };
    const button = appendScreenInput(containerElementId, onEventStart, onEventEnd);
    button.textContent = label;
    button.id = key;
    button.classList.add('screenKey');
}

function invokeKeyDownHandler(keyDownHandler: KeyDownListener) {
    keyDownHandler(keysDown);
}

function invokeKeyPressHandler(keyPressHandler: KeyPressListener) {
    keyPressHandler(currentKey);
}
