import { createContext, useState, useContext, useEffect, lazy, Suspense, useMemo } from 'react';
import { render } from 'react-dom';

import { MapBuilder, MapBuilderEvent, MapElementProps } from '../mapModules/mapBuilder';
import { Loading } from '../uiComponents/Loading';

const gEditorPanel = document.createElement('aside');
gEditorPanel.id = 'editorPanel';
gEditorPanel.classList.add('floatingPanel', 'hidden');
document.body.appendChild(gEditorPanel);

interface EditorPanelContextProviderProps {
    mapBuilder: MapBuilder;
}

const defaultContextValue = {
    mapBuilder: undefined as MapBuilder | undefined,
    mapElementProps: undefined as MapElementProps | undefined,
    editorPanelVisible: false,
};

export const EditorPanelContext = createContext(defaultContextValue);

export function mountEditorPanel(mapBuilder: MapBuilder) {
    render(
        <EditorPanelContextProvider mapBuilder={mapBuilder} />,
        gEditorPanel,
    );
}

function EditorPanelContextProvider({ mapBuilder }: EditorPanelContextProviderProps) {
    const [editorPanelVisible, setEditorPanelVisible] = useState(mapBuilder.editMode);
    const [mapElementId, setMapElementId] = useState(mapBuilder.selectedMapElementId);
    const [mapElementProps, setMapElementProps] = useState<MapElementProps>();

    useEffect(() => {
        mapBuilder.listeners.add(MapBuilderEvent.mapElementSelect, setMapElementId);
        mapBuilder.listeners.add(MapBuilderEvent.mapElementChange, setMapElementProps);
        mapBuilder.listeners.add(MapBuilderEvent.editModeChange, setEditorPanelVisible);

        return () => {
            mapBuilder.listeners.remove(MapBuilderEvent.mapElementSelect, setMapElementId);
            mapBuilder.listeners.remove(MapBuilderEvent.mapElementChange, setMapElementProps);
            mapBuilder.listeners.remove(MapBuilderEvent.editModeChange, setEditorPanelVisible);
        };
    }, []);

    useEffect(() => {
        // ToDo ? maybe prevent 2nd render ?
        setMapElementProps({ ...mapBuilder.getPropsFromStore(mapElementId) });
    }, [mapElementId]);

    useEffect(() => {
        if (editorPanelVisible) {
            gEditorPanel.classList.remove('hidden');
        } else {
            gEditorPanel.classList.add('hidden');
        }
    }, [editorPanelVisible]);

    const contextValue = {
        mapBuilder,
        mapElementProps,
        editorPanelVisible,
    };

    return (
        <EditorPanelContext.Provider value={contextValue}>
            <EditorPanelStateController/>
        </EditorPanelContext.Provider>
    );
}

function EditorPanelStateController() {
    const { editorPanelVisible } = useContext(EditorPanelContext);

    const EditorPanel = lazy(() => import('./EditorPanel'));

    return useMemo(() => (!editorPanelVisible ? null : (
        <Suspense fallback={<Loading/>}>
            <EditorPanel />
        </Suspense>
    )), [editorPanelVisible]);
}
