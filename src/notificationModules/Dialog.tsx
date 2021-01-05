import React, { StrictMode, useEffect, useRef, useState } from 'react';
import { render } from 'react-dom';

import EventListener from '../common/EventListener';
import { Modal } from '../uiComponents';
import uiTexts from '../uiTexts';

export enum DialogEvent {
    open = 'open',
    confirm = 'confirm',
    didMount = 'didMount',
    willUnmount = 'willUnmount',
}

export const dialogListener = new EventListener();

const { okButtonLabel, cancelButtonLabel } = uiTexts;
const gModalControllerRootElement = document.createElement('aside');
gModalControllerRootElement.id = 'menuModalControllerRoot';
gModalControllerRootElement.classList.add('hidden');
document.body.appendChild(gModalControllerRootElement);

export function mountDialogRoot() {
    render(
        (
            <StrictMode>
                <ModalStateController/>
            </StrictMode>
        ),
        gModalControllerRootElement,
    );
}

function ModalStateController() {
    const [hidden, setHidden] = useState(true);
    const messageRef = useRef('');

    useEffect(() => {
        dialogListener.add(DialogEvent.open, openDialog);
        dialogListener.dispatch(DialogEvent.didMount);

        return () => {
            dialogListener.dispatch(DialogEvent.willUnmount);
            dialogListener.remove(DialogEvent.open, openDialog);
        };
    }, []);

    return hidden ? null : (
        <DialogModal message={messageRef.current} closeModal={closeDialog}/>
    );

    function closeDialog() {
        setHidden(true);
    }

    function openDialog(message = '') {
        messageRef.current = message;
        setHidden(false);
    }
}

function DialogModal({ message, closeModal }: { message: string; closeModal: VoidFnc }) {
    const confirmButtonRef = useRef<HTMLButtonElement>();

    useEffect(() => {
        confirmButtonRef.current.focus();
    }, []);

    return (
        <Modal>
            <span className="modal__body dialog__message">{message}</span>
            <div className="modal__footer dialog__buttonBar">
                <button className="dialog__button" onClick={onConfirm} data-confirm="false">
                    {cancelButtonLabel}
                </button>
                <button className="dialog__button" onClick={onConfirm} data-confirm="true" ref={confirmButtonRef}>
                    {okButtonLabel}
                </button>
            </div>
        </Modal>
    );

    function onConfirm(e: React.MouseEvent<HTMLButtonElement>) {
        const confirmed: boolean = JSON.parse(e.currentTarget.dataset.confirm);

        dialogListener.dispatch(DialogEvent.confirm, confirmed);
        closeModal();
    }
}
