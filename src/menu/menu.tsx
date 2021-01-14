import React, { StrictMode, createContext, useState, useEffect, useContext } from 'react';
import { render } from 'react-dom';
import { WebGLRenderer } from 'three';

import { GameProgressEvent, GameProgressManager } from '../gameProgress/gameProgressManager';
import inputHandler from '../inputHandler';
import { Modal, TabbedBox } from '../uiComponents/index';
import ControlsTabPanel from './tabPanels/controls';
import MapSelectorTabPanel from './tabPanels/mapSelector';
import SettingsTabPanel from './tabPanels/settings';

const gModalControllerRootElement = document.createElement('aside');
gModalControllerRootElement.id = 'menuModalControllerRoot';
gModalControllerRootElement.classList.add('hidden');
document.body.appendChild(gModalControllerRootElement);

interface ContextValue {
    gameProgressManager: GameProgressManager;
    renderer: WebGLRenderer;
}

let selectedTabIndex = 0;

function setSelectedTabIndex(index: number) {
    selectedTabIndex = index;
}

export const MenuContext = createContext<ContextValue>(undefined);

export function mountMenuRoot(gameProgressManager: GameProgressManager, renderer: WebGLRenderer) {
    render(
        (
            <StrictMode>
                <MenuContext.Provider value={{ gameProgressManager, renderer }}>
                    <ModalStateController/>
                </MenuContext.Provider>
            </StrictMode>
        ),
        gModalControllerRootElement,
    );
}

function ModalStateController() {
    const { gameProgressManager } = useContext(MenuContext);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        inputHandler.addKeyPressListener(openModalOnKeyPress);
        gameProgressManager.listeners.add(GameProgressEvent.openMapSelectorPanel, openMapSelectorPanel);

        return () => {
            inputHandler.removeKeyPressListener(openModalOnKeyPress);
            gameProgressManager.listeners.remove(GameProgressEvent.openMapSelectorPanel, openMapSelectorPanel);
        };
    }, []);

    return hidden ? null : (
        <MenuModal closeModal={closeModal}/>
    );

    function closeModal() {
        setHidden(true);
    }

    function openModalOnKeyPress(keyPressed: KeyboardEvent['key']) {
        if (keyPressed === 'Tab') {
            if (hidden) {
                setHidden(false);
            }
        }
    }

    function openMapSelectorPanel() {
        selectedTabIndex = 0;
        setHidden(false);
    }
}

function MenuModal({ closeModal }: { closeModal: VoidFnc }) {
    return (
        <Modal onClose={closeModal}>
            <TabbedBox id="menu" defaultTabIndex={selectedTabIndex} onSelect={setSelectedTabIndex}>
                <MapSelectorTabPanel tabLabel="mapSelector" closeMenu={closeModal}/>
                <ControlsTabPanel tabLabel="controls"/>
                <SettingsTabPanel tabLabel="settings"/>
            </TabbedBox>
        </Modal>
    );
}
