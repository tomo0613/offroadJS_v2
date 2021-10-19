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
            <p>{'Accelerate: '}<span>{'↑'}</span> / <span>{'W'}</span></p>
            <p>{'Reverse: '}<span>{'↓'}</span> / <span>{'S'}</span></p>
            <p>{'Steer left: '}<span>{'←'}</span> / <span>{'A'}</span></p>
            <p>{'Steer right: '}<span>{'→'}</span> / <span>{'D'}</span></p>
            <p>{'Hand brake: '}<span>{'Space'}</span></p>
            <p>{'Switch camera: '}<span>{'C'}</span></p>
            <p>{'Pause: '}<span>{'P'}</span></p>
            <hr/>
            <p>{'Open/close editor panel: '}<span>{'M'}</span></p>
            <p>{'(editor) Mouse select: '}<span>{'Alt + click'}</span> / <span>{'double click'}</span></p>
            <p>{'(editor) Toggle mouse action move/rotate: '}<span>{'G'}</span></p>
            <p>{'(editor) Snap on mouse move: '}<span>{'Shift'}</span></p>
            <p>{'(editor) Remove selected object: '}<span>{'Delete'}</span></p>
        </TabPanel>
    );
}
