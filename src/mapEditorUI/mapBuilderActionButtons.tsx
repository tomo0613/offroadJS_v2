import React, { useContext, useState } from 'react';

import { MapElementShape } from '../mapModules/mapBuilder';
import { SelectInput } from '../uiComponents/index';
import { MapBuilderContext } from './editor';
import uiTexts from './uiTexts';

const { createButtonLabel } = uiTexts;
const mapElementShapeSelectorOptionList = [
    'box', 'cylinder', 'ramp', 'sphere', 'triangularRamp', 'loop', 'slopeTransition',
] as MapElementShape[];

export function MapBuilderActionButtons() {
    const mapBuilder = useContext(MapBuilderContext);
    const [selectedMapElementShape, setSelectedMapElementShape] = useState<MapElementShape>(MapElementShape.box);

    return (
        <div>
            <button onClick={() => { mapBuilder.build({ shape: selectedMapElementShape }); }}>
                {createButtonLabel}
            </button>
            <SelectInput
                value={selectedMapElementShape}
                optionList={mapElementShapeSelectorOptionList}
                onChange={(value) => {
                    setSelectedMapElementShape(value as MapElementShape);
                }}
            />
        </div>
    );
}
