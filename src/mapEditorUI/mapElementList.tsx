import { useContext } from 'react';

import { List } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { EditorPanelContext } from './editor';

const { mapElementListLabel } = uiTexts;

export function MapElementList() {
    const { mapBuilder } = useContext(EditorPanelContext);

    return (
        <List
            label={mapElementListLabel}
            contentList={mapBuilder.mapElementIdList}
            selected={mapBuilder.selectedMapElementId}
            onClick={(mapElementId) => {
                mapBuilder.selectMapElement(mapElementId);
            }}
        />
    );
}
