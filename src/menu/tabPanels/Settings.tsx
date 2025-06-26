import { useContext, useEffect, useRef, useState } from 'react';

import config from '../../config';
import { Checkbox, RangeInput, TabPanel, Switch } from '../../uiComponents/index';
import uiTexts from '../../uiTexts';
import { MenuContext } from '../menu';

interface SettingsTabPanelProps {
    tabLabel: string;
}

export default function SettingsTabPanel({ tabLabel }: SettingsTabPanelProps) {
    const { renderer } = useContext(MenuContext);
    const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
    const [renderWireFrame, setRenderWireFrame] = useState(config.renderWireFrame);
    const [showTelemetry, setShowTelemetry] = useState(config.showTelemetry);

    useEffect(() => {
        if (document.fullscreenElement && !fullscreen) {
            document.exitFullscreen();
        } else if (fullscreen) {
            document.documentElement.requestFullscreen();
        }
    }, [fullscreen]);

    function toggleFullscreen() {
        setFullscreen(!fullscreen);

        config.fullscreen = !fullscreen;
    }

    function toggleRenderWireFrame(on: boolean) {
        setRenderWireFrame(on);

        config.renderWireFrame = on;
    }

    function setResolutionScale(value: number) {
        renderer.setPixelRatio(value);

        config.resolutionScale = value;
    }

    function setAudioVolume(value: number) {
        config.audioVolume = value;
    }

    function toggleShowTelemetry(on: boolean) {
        setShowTelemetry(on);

        config.showTelemetry = on;
    }

    function setAutoResetDelay(value: number) {
        config.autoResetDelay = value;
    }

    return (
        <TabPanel tabLabel={tabLabel}>
            <Switch
                id="fullscreen"
                label={uiTexts.fullscreenSwitchLabel}
                on={fullscreen}
                onChange={toggleFullscreen}
            />
            <Switch
                id="renderWireFrame"
                label={uiTexts.renderWireFrameSwitchLabel}
                on={renderWireFrame}
                onChange={toggleRenderWireFrame}
            />
            <RangeInput
                id="resolutionScale"
                label={uiTexts.resolutionScaleSliderLabel}
                min={0.1}
                max={1}
                step={0.1}
                defaultValue={config.resolutionScale}
                onChange={setResolutionScale}
            />
            <RangeInput
                id="audioVolume"
                label={uiTexts.audioVolume}
                min={0}
                max={1}
                step={0.1}
                defaultValue={config.audioVolume}
                onChange={setAudioVolume}
            />
            <Switch
                id="showTelemetry"
                label={uiTexts.showTelemetry}
                on={showTelemetry}
                onChange={toggleShowTelemetry}
            />
            <hr/>
            <RangeInput
                id="autoResetDelay"
                label={uiTexts.autoResetDelay}
                min={100}
                max={5_000}
                step={100}
                defaultValue={config.autoResetDelay}
                onChange={setAutoResetDelay}
            />
            <hr/>
            <SettingsForm/>
        </TabPanel>
    );
}

function SettingsForm() {
    const defaultFormValues = {
        antialias: config.antialias,
        renderShadows: config.renderShadows,
        disableAudio: config.disableAudio,
    };
    const changedFormValueListRef = useRef(new Set<string>());
    const [formChanged, setFormChanged] = useState(false);

    return (
        <form id="settingsForm" onChange={onFormChange}>
            <Checkbox
                id="antialias"
                label={uiTexts.antialiasCheckboxLabel}
                value="antialias"
                checked={defaultFormValues.antialias}
            />
            <Checkbox
                id="renderShadows"
                label={uiTexts.renderShadowsCheckboxLabel}
                value="renderShadows"
                checked={defaultFormValues.renderShadows}
            />
            <Checkbox
                id="disableAudio"
                label={uiTexts.disableAudio}
                value="disableAudio"
                checked={defaultFormValues.disableAudio}
            />
            <button type="button" disabled={!formChanged} onClick={applySettings}>
                {uiTexts.applySettingsButtonLabel}
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
