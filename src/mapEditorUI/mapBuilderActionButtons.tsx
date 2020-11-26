import React, { useContext, useState } from 'react';

import { MapElementType } from '../mapModules/mapBuilder';
import { SelectInput } from '../uiComponents/selectInput';
import { MapBuilderContext } from './editor';

const createButtonText = 'create';
const mapElementTypeSelectorOptionList = [
    'box', 'cylinder', 'ramp', 'sphere', 'triangularRamp', 'trigger',
] as MapElementType[];

export function MapBuilderActionButtons() {
    const mapBuilder = useContext(MapBuilderContext);
    const [selectedMapElementType, setSelectedMapElementType] = useState<MapElementType>(MapElementType.box);

    return (
        <div>
            <button onClick={() => { mapBuilder.build(selectedMapElementType); }}>
                {createButtonText}
            </button>
            <SelectInput
                value={selectedMapElementType}
                optionList={mapElementTypeSelectorOptionList}
                onChange={(value) => {
                    setSelectedMapElementType(value as MapElementType);
                }}
            />
        </div>
    );
}
