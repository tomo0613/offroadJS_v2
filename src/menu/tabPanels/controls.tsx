import React, { useState } from 'react';

import { TabPanel } from '../../uiComponents/index';

interface ControlsTabPanelProps {
    tabLabel: string;
}

export default function ControlsTabPanel({ tabLabel }: ControlsTabPanelProps) {
    return (
        <TabPanel tabLabel={tabLabel}>
            <p>{'Accelerate: '}<span>{'W'}</span></p>
            <p>{'Reverse: '}<span>{'S'}</span></p>
            <p>{'Steer left: '}<span>{'A'}</span></p>
            <p>{'Steer right: '}<span>{'D'}</span></p>
            <p>{'Hand brake: '}<span>{'SpaceBar'}</span></p>
            <p>{'Switch camera: '}<span>{'C'}</span></p>
            <p>{'Reset vehicle: '}<span>{'R'}</span></p>
            <p>{'Pause: '}<span>{'P'}</span></p>
            <p>{'Open/close editor panel: '}<span>{'M'}</span></p>
            <p>{'Open/close menu: '}<span>{'Escape'}</span></p>
        </TabPanel>
    );
}
