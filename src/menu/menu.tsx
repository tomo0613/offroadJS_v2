import { createContext, useState, useEffect, useContext, lazy, Suspense, useCallback, useMemo } from 'react';
import { render } from 'react-dom';
import { WebGLRenderer } from 'three';

import { GameProgressEvent, GameProgressManager } from '../gameProgress/gameProgressManager';
import inputHandler from '../inputHandler';
import { Loading } from '../uiComponents/Loading';
import { noop } from '../utils';

const gModalControllerContainerElement = document.createElement('aside');
gModalControllerContainerElement.id = 'menuModalControllerRoot';
gModalControllerContainerElement.classList.add('hidden');
document.body.appendChild(gModalControllerContainerElement);

interface MenuModalContextProviderProps {
    gameProgressManager: GameProgressManager;
    renderer: WebGLRenderer;
}

const defaultContextValue = {
    gameProgressManager: undefined as GameProgressManager | undefined,
    renderer: undefined as WebGLRenderer | undefined,
    menuOpen: false,
    openMenu: noop,
    closeMenu: noop,
    selectedTabIndex: 0,
    setSelectedTabIndex: noop as (tabIndex: number) => void,
};

export const MenuContext = createContext(defaultContextValue);

export function mountMenuRoot(gameProgressManager: GameProgressManager, renderer: WebGLRenderer) {
    render(
        <MenuModalRoot gameProgressManager={gameProgressManager} renderer={renderer} />,
        gModalControllerContainerElement,
    );
}

function MenuModalRoot({ gameProgressManager, renderer }: MenuModalContextProviderProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);

    const openMenu = useCallback(() => {
        setMenuOpen(true);
    }, []);

    const closeMenu = useCallback(() => {
        setMenuOpen(false);
    }, []);

    const contextValue = {
        gameProgressManager,
        renderer,
        menuOpen,
        openMenu,
        closeMenu,
        selectedTabIndex,
        setSelectedTabIndex,
    };

    return (
        <MenuContext.Provider value={contextValue}>
            <MenuModalStateController/>
        </MenuContext.Provider>
    );
}

function MenuModalStateController() {
    const { menuOpen, openMenu, setSelectedTabIndex, gameProgressManager } = useContext(MenuContext);

    const openModalOnKeyPress = useCallback(() => {
        openMenu();
    }, []);

    const openMapSelectorPanel = useCallback(() => {
        setSelectedTabIndex(0);
        openMenu();
    }, []);

    useEffect(() => {
        inputHandler.addKeyPressListener('Tab', openModalOnKeyPress);
        gameProgressManager.listeners.add(GameProgressEvent.openMapSelectorPanel, openMapSelectorPanel);

        return () => {
            inputHandler.removeKeyPressListener('Tab', openModalOnKeyPress);
            gameProgressManager.listeners.remove(GameProgressEvent.openMapSelectorPanel, openMapSelectorPanel);
        };
    }, []);

    const MenuModal = lazy(() => import('./MenuModal'));

    return useMemo(() => (!menuOpen ? null : (
        <Suspense fallback={<Loading/>}>
            <MenuModal />
        </Suspense>
    )), [menuOpen]);
}
