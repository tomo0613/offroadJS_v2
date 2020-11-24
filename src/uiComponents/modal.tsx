import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { NOP } from '../utils';

interface ModalProps {
    onClose: VoidFnc;
}

const closeButtonText = '⨯';
const gModalRoot = document.createElement('aside');
gModalRoot.classList.add('hidden');
gModalRoot.id = 'modal-root';
gModalRoot.tabIndex = -1;
document.body.appendChild(gModalRoot);

const ModalContainer: React.FunctionComponent<ModalProps> = function ({ onClose = NOP, children }) {
    return (
        <div className="modalContainer">
            <span className="modalCloseButton" onClick={onClose}>
                {closeButtonText}
            </span>
            {children}
        </div>
    );
};

export const Modal: React.FunctionComponent<ModalProps> = function ({ onClose, children }) {
    const previousActiveElement = document.activeElement as HTMLElement;
    // const focusableChildElements = [...gModalRoot.querySelectorAll('input, textarea, select, button')];

    useEffect(() => {
        gModalRoot.classList.remove('hidden');
        gModalRoot.addEventListener('keydown', onKeyDown);
        gModalRoot.focus();

        return () => {
            gModalRoot.removeEventListener('keydown', onKeyDown);
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

        if (e.key === 'Escape') {
            onClose();
        }
    }
};
