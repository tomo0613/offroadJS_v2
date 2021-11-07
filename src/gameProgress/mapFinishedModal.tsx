import { useContext, useEffect, useRef } from 'react';

import { Modal } from '../uiComponents';
import { formatTime } from '../utils';
import { GameProgressEvent } from './gameProgressManager';
import { GameProgressContext } from './gameProgressModalController';

const title = 'Finished!';
const retryButtonText = 'Retry';
const nextButtonText = 'Next';
const selectMapButtonText = 'Select map';

function GoalsSection() {
    const { goals, time } = useContext(GameProgressContext);

    if (!goals) {
        return null;
    }

    return (
        <>
            <h4>
                Goals
            </h4>
            {Boolean(goals.time) && (
                <p>
                    {`Finis under: ${formatTime(goals.time)}`}
                    <span className="end_adornment">
                        {time <= goals.time ? '✅' : '🟥'}
                    </span>
                </p>
            )}
        </>
    );
}

export function MapFinishedModal({ closeModal }: { closeModal: VoidFnc }) {
    const gameProgress = useContext(GameProgressContext);
    const nextButtonRef = useRef<HTMLButtonElement>();

    useEffect(() => {
        if (nextButtonRef.current) {
            nextButtonRef.current.focus();
        }
    }, [nextButtonRef.current]);

    return (
        <Modal>
            <span className="modal__header">
                {title}
            </span>
            <span className="modal__body">
                <p>
                    {`Your time: ${formatTime(gameProgress.time)}`}
                    <span className="end_adornment">🕑</span>
                </p>
                {Boolean(gameProgress.respawnCount) && (
                    <p>
                        {`Respawn count: ${gameProgress.respawnCount}`}
                    </p>
                )}
                <GoalsSection/>
            </span>
            <div className="modal__footer">
                <button onClick={retry}>
                    {retryButtonText}
                </button>
                <button onClick={openMapSelectorPanel}>
                    {selectMapButtonText}
                </button>
                <button onClick={next} ref={nextButtonRef}>
                    {nextButtonText}
                </button>
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
