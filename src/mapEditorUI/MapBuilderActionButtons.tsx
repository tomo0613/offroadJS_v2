import { useContext, useState } from 'react';

import { MapElementShape } from '../mapModules/mapBuilder';
import { SelectInput } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { EditorPanelContext } from './editor';

const mapElementShapeSelectorOptionList = Object.values(MapElementShape);

export function MapBuilderActionButtons() {
    const { mapBuilder } = useContext(EditorPanelContext);
    const [selectedMapElementShape, setSelectedMapElementShape] = useState<MapElementShape>(MapElementShape.box);

    return (
        <div>
            <button onClick={createNewMapElementAction}>
                {uiTexts.createButtonLabel}
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

    function createNewMapElementAction() {
        mapBuilder.build({ shape: selectedMapElementShape });
    }
}
