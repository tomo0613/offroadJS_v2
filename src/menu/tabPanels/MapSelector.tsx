import { useContext, useState } from 'react';

import { mapCollection } from '../../maps/mapCollection';
import { List, TabPanel } from '../../uiComponents/index';
import { MenuContext } from '../menu';

interface MapSelectorTabPanelProps {
    tabLabel: string;
}

const mapListLabel = 'mapList';
const loadMapButtonLabel = 'load';
const mapListItems = Object.keys(mapCollection);

export default function MapSelectorTabPanel({ tabLabel }: MapSelectorTabPanelProps) {
    const { gameProgressManager, closeMenu } = useContext(MenuContext);
    const [selectedMap, setSelectedMap] = useState<string>();
    // const [mapMeta, setMapMeta] = useState<{ name, create-date, author, rating... }>();

    return (
        <TabPanel tabLabel={tabLabel}>
            <List
                label={mapListLabel}
                contentList={mapListItems}
                selected={selectedMap}
                onClick={setSelectedMap}
                onDoubleClick={loadMap}
            />
            {/* mapMeta */}
            <button onClick={() => {
                loadMap();
            }}>
                {loadMapButtonLabel}
            </button>
        </TabPanel>
    );

    function loadMap(mapId = selectedMap) {
        if (mapId) {
            gameProgressManager.loadMap(mapId);
            closeMenu();
        }
    }
}
