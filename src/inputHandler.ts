import { isMobileDevice } from './utils';

const keyPressListeners = new Set<Function>();
const navigationKeys = [
    ' ',
    'PageUp',
    'PageDown',
    'End',
    'Home',
    // 'ArrowLeft',
    'ArrowUp',
    // 'ArrowRight',
    'ArrowDown',
];

export default {
    addKeyPressListener,
    removeKeyPressListener,
    isKeyPressed,
};

const keysPressed = new Set<KeyboardEvent['key']>();

function addKeyPressListener(listener: Function) {
    keyPressListeners.add(listener);
}

function removeKeyPressListener(listener: Function) {
    keyPressListeners.delete(listener);
}

function isKeyPressed(key: KeyboardEvent['key'], secondaryKey?: KeyboardEvent['key']) {
    return keysPressed.has(key) || !!(secondaryKey && keysPressed.has(secondaryKey));
}

let pressedKey: KeyboardEvent['key'];

// eslint-disable-next-line no-multi-assign
onkeydown = onkeyup = (e) => {
    // prevent page scroll
    if (navigationKeys.includes(e.key)) {
        e.preventDefault();
    }

    pressedKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;

    if (e.type === 'keydown' && e.repeat) {
        return;
    }
    if (e.type === 'keyup') {
        keysPressed.delete(pressedKey);
    } else {
        keysPressed.add(pressedKey);
    }

    keyPressListeners.forEach(invokeCallback);
};

if (isMobileDevice()) {
    appendVirtualKey('bottomLeftPanel', 'ArrowUp', '▲');
    appendVirtualKey('bottomLeftPanel', 'ArrowDown', '▼');
    appendVirtualKey('bottomRightPanel', 'ArrowLeft', '◄');
    appendVirtualKey('bottomRightPanel', 'ArrowRight', '►');
    // keyReleased
    appendVirtualKey('topRightPanel', 'R', '⟲');
    appendVirtualKey('topRightPanel', 'C', 'c');
    appendVirtualKey('topRightPanel', 'P', 'p');
}

function appendVirtualKey(containerElementId: string, key: string, label: string) {
    const button = document.createElement('button');
    button.textContent = label;
    button.classList.add('virtualKey');
    button.id = key;

    const onEventStart = () => {
        keysPressed.add(key);
        keyPressListeners.forEach(invokeCallback);
    };
    button.addEventListener('mousedown', onEventStart);
    button.addEventListener('touchstart', onEventStart);

    const onEventEnd = () => {
        keysPressed.delete(key);
        keyPressListeners.forEach(invokeCallback);
    };
    button.addEventListener('mouseup', onEventEnd);
    button.addEventListener('mouseleave', onEventEnd);
    button.addEventListener('touchcancel', onEventEnd);
    button.addEventListener('touchend', onEventEnd);

    const containerElement = document.getElementById(containerElementId);
    containerElement.classList.remove('hidden');
    containerElement.appendChild(button);
}

function invokeCallback(callback: Function) {
    callback();
}
