import { isMobileDevice } from './utils';

const keyPressListeners = new Set<Function>();
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
    appendVirtualKey('ArrowUp', '↑');
    appendVirtualKey('ArrowDown', '↓');
    appendVirtualKey('ArrowLeft', '←');
    appendVirtualKey('ArrowRight', '→');
    appendVirtualKey('R', '↺');
}

function appendVirtualKey(key: string, label: string) {
    const button = document.createElement('button');
    button.textContent = label;
    button.classList.add('floatingElement', 'virtualKey');
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

    document.body.appendChild(button);
}

function invokeCallback(callback: Function) {
    callback();
}
