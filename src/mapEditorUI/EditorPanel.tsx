import { useContext } from 'react';

import { vehicleMapElementId } from '../mapModules/mapBuilder';
import { EditorPanelContext } from './editor';
import { MapBuilderActionButtons } from './MapBuilderActionButtons';
import { MapDataActionButtons } from './MapDataActionButtons';
import { MapElementActionButtons } from './MapElementActionButtons';
import { MapElementAttributesPanel } from './MapElementAttributesPanel';
import { MapElementList } from './MapElementList';
import { MapElementTransformPanel } from './MapElementTransformPanel';
import { MapElementTranslatePanel } from './MapElementTranslatePanel';

export default function EditorPanel() {
    const { mapBuilder, mapElementProps } = useContext(EditorPanelContext);

    return (
        <>
            <MapDataActionButtons/>
            <MapElementList/>
            {mapBuilder.selectedMapElementId && mapElementProps && <>
                <MapElementTranslatePanel mapElementProps={mapElementProps}/>
                {mapBuilder.selectedMapElementId !== vehicleMapElementId && <>
                    <MapElementTransformPanel mapElementProps={mapElementProps}/>
                    <MapElementAttributesPanel mapElementProps={mapElementProps}/>
                    <MapElementActionButtons/>
                </>}
            </>}
            <MapBuilderActionButtons/>
        </>
    );
}
