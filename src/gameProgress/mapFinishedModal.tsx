import { useContext } from 'react';

import { Modal } from '../uiComponents';
import { GameProgressEvent } from './gameProgressManager';
import { GameProgressContext } from './gameProgressModalController';

const title = 'Finished!';
const textContent_getter = (time: string) => `Your time: ${time}`;
const retryButtonText = 'retry';
const nextButtonText = 'next';
const selectMapButtonText = 'select map';

export function MapFinishedModal({ closeModal }: { closeModal: VoidFnc }) {
    const gameProgress = useContext(GameProgressContext);

    return (
        <Modal>
            <span className="modal__header">{title}</span>
            <span className="modal__body">{textContent_getter(gameProgress.result)}</span>
            <div className="modal__footer">
                <button onClick={retry}>{retryButtonText}</button>
                <button onClick={openMapSelectorPanel}>{selectMapButtonText}</button>
                <button onClick={next}>{nextButtonText}</button>
            </div>
        </Modal>
    );

    function next() {
        closeModal();
        gameProgress.loadNextMap();
    }

    function retry() {
        closeModal();
        gameProgress.reset();
    }

    function openMapSelectorPanel() {
        closeModal();
        gameProgress.listeners.dispatch(GameProgressEvent.openMapSelectorPanel);
    }
}
