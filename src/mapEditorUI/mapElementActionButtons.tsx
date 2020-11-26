import React, { useContext } from 'react';

import { MapBuilderContext } from './editor';

const cloneButtonText = 'clone';
const removeButtonText = 'remove';

export function MapElementActionButtons() {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <div>
            <button onClick={() => { mapBuilder.clone(mapBuilder.selectedMapElementId); }}>
                {cloneButtonText}
            </button>
            <button onClick={() => { mapBuilder.destroy(mapBuilder.selectedMapElementId); }}>
                {removeButtonText}
            </button>
        </div>
    );
}
