import React, { StrictMode, createContext, useState, useContext, useEffect } from 'react';
import { render } from 'react-dom';

import { Modal } from '../uiComponents/modal';
import { GameProgressEvent, GameProgressManager } from './gameProgressManager';
import { MapFinishedModal } from './mapFinishedModal';

export enum GameProgressModal {
    mapFinished = 'mapFinished',
    mapSelector = 'mapSelector',
}

const gModalControllerRootElement = document.createElement('aside');
gModalControllerRootElement.classList.add('hidden');
document.body.appendChild(gModalControllerRootElement);

export const GameProgressContext = createContext<GameProgressManager>(undefined);

export function mountModalController(context: GameProgressManager) {
    render(
        <ModalControllerRootComponent context={context}/>,
        gModalControllerRootElement,
    );
}

function ModalControllerRootComponent({ context }: { context: GameProgressManager }) {
    return (
        <StrictMode>
            <GameProgressContext.Provider value={context}>
                <ModalController/>
            </GameProgressContext.Provider>
        </StrictMode>
    );
}

function ModalController() {
    const gameProgress = useContext(GameProgressContext);
    const [activeModal, setActiveModal] = useState<GameProgressModal>();

    useEffect(() => {
        gameProgress.listeners.add(GameProgressEvent.openModal, setActiveModal);

        return () => {
            gameProgress.listeners.remove(GameProgressEvent.openModal, setActiveModal);
        };
    });

    return !activeModal ? null : (
        <Modal>
            <MapFinishedModal closeModal={closeModal}/>
        </Modal>
    );

    function closeModal() {
        setActiveModal(undefined);
    }
}

function MapSelectorModal() {
    return (
        <div></div>
    );
}
