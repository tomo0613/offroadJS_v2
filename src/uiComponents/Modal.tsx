import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import inputHandler from '../inputHandler';

interface ModalProps {
    onClose?: VoidFnc;
}

const keyboardFocusableElementSelector = `
    input:not([disabled]),
    textarea:not([disabled]),
    button:not([disabled]),
    select,
    [tabindex]
`;

const closeButtonText = '⨯';
const gModalRoot = document.createElement('aside');
gModalRoot.classList.add('hidden');
gModalRoot.id = 'modal__root';
gModalRoot.tabIndex = -1;
document.body.appendChild(gModalRoot);

const ModalContainer: React.FunctionComponent<ModalProps> = function ({ onClose, children }) {
    return (
        <div className="modal__container">
            {onClose && (
                <span className="modal__closeButton" onClick={onClose}>
                    {closeButtonText}
                </span>
            )}
            {children}
        </div>
    );
};

export const Modal: React.FunctionComponent<ModalProps> = function ({ onClose, children }) {
    const previousActiveElement = document.activeElement as HTMLElement;

    useEffect(() => {
        inputHandler.clearKeysDown();

        gModalRoot.classList.remove('hidden');
        gModalRoot.addEventListener('keydown', onKeyDown);
        gModalRoot.addEventListener('keyup', onKeyUp);
        gModalRoot.focus();

        return () => {
            gModalRoot.removeEventListener('keydown', onKeyDown);
            gModalRoot.removeEventListener('keyup', onKeyUp);
            gModalRoot.classList.add('hidden');
            previousActiveElement.focus();
        };
    }, []);

    return createPortal((
        <ModalContainer onClose={onClose}>
            {children}
        </ModalContainer>
    ), gModalRoot);

    function onKeyDown(e: globalThis.KeyboardEvent) {
        e.stopPropagation();

        if (e.key === 'Tab') {
            e.preventDefault();
        }
    }

    function onKeyUp(e: globalThis.KeyboardEvent) {
        e.stopPropagation();
        e.preventDefault();

        if (onClose && e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Tab') {
            focusNextFocusableChildElement(e.shiftKey ? -1 : 1);
        }
    }

    function focusNextFocusableChildElement(direction: -1|1) {
        const focusableChildElements = getFocusableChildElements(gModalRoot);

        if (!focusableChildElements.length) {
            return;
        }

        const focusedElement = document.activeElement as HTMLElement;
        const focusedChildElementIndex = focusableChildElements.indexOf(focusedElement);
        const lastFocusableChildElementIndex = focusableChildElements.length - 1;

        let nextFocusableChildElementIndex = focusedChildElementIndex + direction;
        if (nextFocusableChildElementIndex < 0) {
            nextFocusableChildElementIndex = lastFocusableChildElementIndex;
        } else if (nextFocusableChildElementIndex > lastFocusableChildElementIndex) {
            nextFocusableChildElementIndex = 0;
        }

        (focusableChildElements[nextFocusableChildElementIndex] as HTMLElement).focus();
    }
};

function getFocusableChildElements(element: HTMLElement) {
    return [...element.querySelectorAll(keyboardFocusableElementSelector)].filter(inaccessibleElementFilter);
}

function inaccessibleElementFilter(element: HTMLElement) {
    return element.tabIndex !== -1 && window.getComputedStyle(element).visibility !== 'hidden';
}
