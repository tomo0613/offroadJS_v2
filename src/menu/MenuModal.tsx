import { useContext } from 'react';

import { Modal, TabbedBox } from '../uiComponents/index';
import { MenuContext } from './menu';
import ControlsTabPanel from './tabPanels/Controls';
import MapSelectorTabPanel from './tabPanels/MapSelector';
import SettingsTabPanel from './tabPanels/Settings';

export default function MenuModal() {
    const { closeMenu, selectedTabIndex, setSelectedTabIndex } = useContext(MenuContext);

    return (
        <Modal onClose={closeMenu}>
            <TabbedBox id="menu" defaultTabIndex={selectedTabIndex} onSelect={setSelectedTabIndex}>
                <MapSelectorTabPanel tabLabel="mapSelector"/>
                <ControlsTabPanel tabLabel="controls"/>
                <SettingsTabPanel tabLabel="settings"/>
            </TabbedBox>
        </Modal>
    );
}
