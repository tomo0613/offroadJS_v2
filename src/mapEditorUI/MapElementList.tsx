import { useContext } from 'react';

import { List } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { EditorPanelContext } from './editor';

export function MapElementList() {
    const { mapBuilder } = useContext(EditorPanelContext);

    return (
        <List
            label={uiTexts.mapElementListLabel}
            contentList={mapBuilder.mapElementIdList}
            selected={mapBuilder.selectedMapElementId}
            onClick={(mapElementId) => {
                mapBuilder.selectMapElement(mapElementId);
            }}
        />
    );
}
