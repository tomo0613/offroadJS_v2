import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import inputHandler from '../inputHandler';

interface ModalProps {
    onClose?: VoidFnc;
}

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
    // const focusableChildElements = [...gModalRoot.querySelectorAll('input, textarea, select, button')];

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
    });

    return createPortal((
        <ModalContainer onClose={onClose}>
            {children}
        </ModalContainer>
    ), gModalRoot);

    function onKeyDown(e: globalThis.KeyboardEvent) {
        e.stopPropagation();
    }

    function onKeyUp(e: globalThis.KeyboardEvent) {
        e.stopPropagation();

        if (onClose && e.key === 'Escape') {
            onClose();
        }
    }
};
