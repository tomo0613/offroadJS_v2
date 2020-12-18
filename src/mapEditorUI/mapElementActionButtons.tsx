import React, { useContext } from 'react';

import { MapBuilderContext } from './editor';
import uiTexts from './uiTexts';

const { cloneButtonLabel, removeButtonLabel } = uiTexts;

export function MapElementActionButtons() {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <div>
            <button onClick={() => { mapBuilder.clone(mapBuilder.selectedMapElementId); }}>
                {cloneButtonLabel}
            </button>
            <button onClick={() => { mapBuilder.destroy(mapBuilder.selectedMapElementId); }}>
                {removeButtonLabel}
            </button>
        </div>
    );
}
