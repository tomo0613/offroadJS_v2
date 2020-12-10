import React, { useContext } from 'react';

import { List } from '../uiComponents/list';
import { MapBuilderContext } from './editor';

export function MapElementList({ selectedMapElementId }: { selectedMapElementId: string }) {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <List
            label="Map elements: "
            contentList={mapBuilder.mapElementIdList}
            selected={selectedMapElementId}
            onSelect={(mapElementId) => {
                mapBuilder.selectMapElement(mapElementId);
            }}
        />
    );
}
