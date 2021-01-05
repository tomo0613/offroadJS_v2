import React, { useContext } from 'react';

import uiTexts from '../uiTexts';
import { MapBuilderContext } from './editor';

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
