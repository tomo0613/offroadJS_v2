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

    if (!goals.time) {
        return null;
    }

    return (
        <>
            <h4>
                Goals
            </h4>
            {Boolean(goals.time) && (
                <p>
                    {'Finis under: '}
                    <span className="textHighlight_2">{formatTime(goals.time)}</span>
                    <span className="end_adornment">
                        {time <= goals.time ? '✅' : '🟧'}
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
                    {'Your time: '}
                    <span className="textHighlight_1">{formatTime(gameProgress.time)}</span>
                    <span className="end_adornment">⏱</span>
                </p>
                {Boolean(gameProgress.respawnCount) && (
                    <p>
                        {'Respawn count: '}
                        <span className="textHighlight_1">{gameProgress.respawnCount}</span>
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
