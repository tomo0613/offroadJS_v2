import React, { StrictMode, createContext, useState, useContext, useEffect } from 'react';
import { render } from 'react-dom';

import { GameProgressEvent, GameProgressManager } from './gameProgressManager';
import { MapFinishedModal } from './mapFinishedModal';

const gModalControllerRootElement = document.createElement('aside');
gModalControllerRootElement.id = 'gameProgressModalControllerRoot';
gModalControllerRootElement.classList.add('hidden');
document.body.appendChild(gModalControllerRootElement);

export const GameProgressContext = createContext<GameProgressManager>(undefined);

export function mountModalController(context: GameProgressManager) {
    render(
        (
            <StrictMode>
                <GameProgressContext.Provider value={context}>
                    <ModalStateController/>
                </GameProgressContext.Provider>
            </StrictMode>
        ),
        gModalControllerRootElement,
    );
}

function ModalStateController() {
    const gameProgress = useContext(GameProgressContext);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        gameProgress.listeners.add(GameProgressEvent.openModal, openModal);

        return () => {
            gameProgress.listeners.remove(GameProgressEvent.openModal, openModal);
        };
    });

    return hidden ? null : (
        <MapFinishedModal closeModal={closeModal}/>
    );

    function openModal() {
        setHidden(false);
    }

    function closeModal() {
        setHidden(true);
    }
}
