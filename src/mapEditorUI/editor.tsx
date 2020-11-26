import React, { StrictMode, createContext, useState, useContext, useEffect } from 'react';
import { render } from 'react-dom';

import { MapBuilder, MapBuilderEvent, MapElementProps } from '../mapModules/mapBuilder';
import { MapBuilderActionButtons } from './mapBuilderActionButtons';
import { MapDataActionButtons } from './mapDataActionButtons';
import { MapElementActionButtons } from './mapElementActionButtons';
import { MapElementAttributesPanel } from './mapElementAttributesPanel';
import { MapElementList } from './mapElementList';
import { MapElementTransformPanel } from './mapElementTransformPanel';
import { MapElementTranslatePanel } from './mapElementTranslatePanel';

const gEditorPanel = document.createElement('aside');
gEditorPanel.classList.add('floatingPanel', 'hidden');
gEditorPanel.id = 'editorPanel';
document.body.appendChild(gEditorPanel);

export const MapBuilderContext = createContext<MapBuilder>(undefined);

export function renderEditor(mapBuilder: MapBuilder) {
    render(
        <EditorRoot context={mapBuilder} />,
        gEditorPanel,
    );
}

function EditorRoot({ context }: { context: MapBuilder }) {
    return (
        <StrictMode>
            <MapBuilderContext.Provider value={context}>
                <Editor/>
            </MapBuilderContext.Provider>
        </StrictMode>
    );
}

function Editor() {
    const mapBuilder = useContext(MapBuilderContext);
    const [mapElementId, setMapElementId] = useState(mapBuilder.selectedMapElementId);
    const [mapElementProps, setMapElementProps] = useState<MapElementProps>();

    useEffect(() => {
        mapBuilder.listeners.add(MapBuilderEvent.select, setMapElementId);

        return () => {
            mapBuilder.listeners.remove(MapBuilderEvent.select, setMapElementId);
        };
    }, []);
    useEffect(() => {
        setMapElementProps(mapBuilder.getPropsFromStore(mapElementId));
    }, [mapElementId]);

    return (
        <>
            <MapDataActionButtons/>
            <MapElementList selectedMapElementId={mapElementId}/>
            {mapElementId && mapElementProps && <>
                <MapElementTranslatePanel mapElementProps={mapElementProps}/>
                {mapElementId !== 'vehicle_0' && <>
                    <MapElementTransformPanel mapElementProps={mapElementProps}/>
                    <MapElementAttributesPanel mapElementProps={mapElementProps}/>
                    <MapElementActionButtons/>
                </>}
            </>}
            <MapBuilderActionButtons/>
        </>
    );
}
