import { useContext, useEffect, useRef, useState } from 'react';

import config from '../../config';
import { Checkbox, RangeInput, TabPanel, Switch } from '../../uiComponents/index';
import { MenuContext } from '../menu';

interface SettingsTabPanelProps {
    tabLabel: string;
}

const fullscreenSwitchLabel = 'Fullscreen:';
const resolutionScaleSliderLabel = 'Resolution scale:';
const antialiasCheckboxLabel = 'Antialias:';
const renderWireFrameCheckboxLabel = 'Render wireFrame:';
const applySettingsButtonLabel = 'Apply settings';

export default function SettingsTabPanel({ tabLabel }: SettingsTabPanelProps) {
    const { renderer } = useContext(MenuContext);
    const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));

    useEffect(() => {
        if (document.fullscreenElement && !fullscreen) {
            document.exitFullscreen();
        } else if (fullscreen) {
            document.documentElement.requestFullscreen();
        }
    }, [fullscreen]);

    return (
        <TabPanel tabLabel={tabLabel}>
            <Switch
                id="fullscreen" label={fullscreenSwitchLabel}
                on={fullscreen} onChange={toggleFullscreen}
            />
            <RangeInput
                id="resolutionScale" label={resolutionScaleSliderLabel}
                min={0.1} max={1} step={0.1} defaultValue={config.resolutionScale} onChange={setResolutionScale}
            />
            <hr/>
            <SettingsForm/>
        </TabPanel>
    );

    function toggleFullscreen() {
        setFullscreen(!fullscreen);

        config.fullscreen = !fullscreen;
    }

    function setResolutionScale(value: number) {
        renderer.setPixelRatio(value);

        config.resolutionScale = value;
    }
}

function SettingsForm() {
    const defaultFormValues = {
        antialias: config.antialias,
        renderWireFrame: config.renderWireFrame,
    };
    const changedFormValueListRef = useRef(new Set<string>());
    const [formChanged, setFormChanged] = useState(false);

    return (
        <form id="settingsForm" onChange={onFormChange}>
            <Checkbox
                id="antialias" label={antialiasCheckboxLabel}
                value="antialias"checked={defaultFormValues.antialias}
            />
            <Checkbox
                id="renderWireFrame" label={renderWireFrameCheckboxLabel}
                value="renderWireFrame" checked={defaultFormValues.renderWireFrame}
            />
            <button type="button" disabled={!formChanged} onClick={applySettings}>
                {applySettingsButtonLabel}
            </button>
        </form>
    );

    function onFormChange() {
        const form = document.forms.namedItem('settingsForm');
        const formElementCount = form.elements.length;
        const list = changedFormValueListRef.current;

        for (let i = 0; i < formElementCount; i++) {
            const { id, checked } = form.elements[i] as HTMLInputElement;
            if (defaultFormValues[id] !== checked) {
                list.add(id);
            } else if (list.has(id)) {
                list.delete(id);
            }
        }

        setFormChanged(Boolean(list.size));
    }

    function applySettings() {
        const form = document.forms.namedItem('settingsForm');

        changedFormValueListRef.current.forEach((id) => {
            const { checked } = form.elements.namedItem(id) as HTMLInputElement;

            config[id] = checked;
        });

        window.location.reload();
    }
}
