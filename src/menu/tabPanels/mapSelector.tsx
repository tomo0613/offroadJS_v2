import React, { useContext, useState } from 'react';

import { mapCollection } from '../../maps/mapCollection';
import { List, TabPanel } from '../../uiComponents/index';
import { MenuContext } from '../menu';

interface MapSelectorTabPanelProps {
    tabLabel: string;
    closeMenu: VoidFnc;
}

const mapListLabel = 'mapList';
const loadMapButtonLabel = 'load';
const mapListItems = Object.keys(mapCollection);

export default function MapSelectorTabPanel({ tabLabel, closeMenu }: MapSelectorTabPanelProps) {
    const { gameProgressManager } = useContext(MenuContext);
    const [selectedMap, setSelectedMap] = useState<string>();
    // const [mapMeta, setMapMeat] = useState<{ name, create-date, author, rating... }>();

    return (
        <TabPanel tabLabel={tabLabel}>
            <List
                label={mapListLabel}
                contentList={mapListItems}
                selected={selectedMap}
                onSelect={setSelectedMap}
            />
            {/* mapMeta */}
            <button onClick={loadMap}>
                {loadMapButtonLabel}
            </button>
        </TabPanel>
    );

    function loadMap() {
        if (selectedMap) {
            gameProgressManager.loadMap(selectedMap);
            closeMenu();
        }
    }
}
