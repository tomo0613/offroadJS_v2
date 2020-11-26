import React, { useContext } from 'react';

import { GameProgressContext } from './gameProgressModalController';

const title = 'Finished!';
const textContent_getter = (time: string) => `Your time: ${time}`;
const retryButtonText = 'retry';
const nextButtonText = 'next';

export function MapFinishedModal({ closeModal }: { closeModal: VoidFnc }) {
    const gameProgress = useContext(GameProgressContext);

    return (
        <>
            <span className="modal__header">{title}</span>
            <span className="modal__body">{textContent_getter(gameProgress.result)}</span>
            <div className="modal__footer">
                <button onClick={retry}>{retryButtonText}</button>
                <button>{'select map'}</button>
                <button onClick={next}>{nextButtonText}</button>
            </div>
        </>
    );

    function next() {
        gameProgress.loadNextMap();
        closeModal();
    }

    function retry() {
        gameProgress.reset();
        closeModal();
    }
}
