import React, { useContext } from 'react';

import { List } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { MapBuilderContext } from './editor';

const { mapElementListLabel } = uiTexts;

export function MapElementList({ selectedMapElementId }: { selectedMapElementId: string }) {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <List
            label={mapElementListLabel}
            contentList={mapBuilder.mapElementIdList}
            selected={selectedMapElementId}
            onSelect={(mapElementId) => {
                mapBuilder.selectMapElement(mapElementId);
            }}
        />
    );
}
