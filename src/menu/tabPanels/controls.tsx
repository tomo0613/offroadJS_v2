import React from 'react';

import { TabPanel } from '../../uiComponents/index';

interface ControlsTabPanelProps {
    tabLabel: string;
}

export default function ControlsTabPanel({ tabLabel }: ControlsTabPanelProps) {
    return (
        <TabPanel tabLabel={tabLabel}>
            <p>{'Open menu: '}<span>{'Tab'}</span></p>
            <hr/>
            <p>{'Respawn at last checkpoint: '}<span>{'R'}</span></p>
            <p>{'Pause: '}<span>{'P'}</span></p>
            <p>{'Accelerate: '}<span>{'↑'}</span> / <span>{'W'}</span></p>
            <p>{'Reverse: '}<span>{'↓'}</span> / <span>{'S'}</span></p>
            <p>{'Steer left: '}<span>{'←'}</span> / <span>{'A'}</span></p>
            <p>{'Steer right: '}<span>{'→'}</span> / <span>{'D'}</span></p>
            <p>{'Hand brake: '}<span>{'SpaceBar'}</span></p>
            <p>{'Switch camera: '}<span>{'C'}</span></p>
            <hr/>
            <p>{'Open/close editor panel: '}<span>{'M'}</span></p>
            <p>{'Mouse select: '}<span>{'Alt + LMB'}</span></p>
            <p>{'Toggle mouse action move/rotate: '}<span>{'G'}</span></p>
        </TabPanel>
    );
}
