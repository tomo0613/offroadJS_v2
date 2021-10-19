import { useContext } from 'react';

import uiTexts from '../uiTexts';
import { MapBuilderContext } from './editor';

const { cloneButtonLabel, removeButtonLabel } = uiTexts;

export function MapElementActionButtons() {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <div>
            <button onClick={cloneMapElementAction}>
                {cloneButtonLabel}
            </button>
            <button onClick={destroyMapElementAction}>
                {removeButtonLabel}
            </button>
        </div>
    );

    function cloneMapElementAction() {
        mapBuilder.clone(mapBuilder.selectedMapElementId);
    }

    function destroyMapElementAction() {
        mapBuilder.destroy(mapBuilder.selectedMapElementId);
    }
}
