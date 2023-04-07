import { useContext } from 'react';

import {
    getColorValueByProps, MapElementProps, MapElementType, setMeshColor, TriggerMapElementEvent,
} from '../mapModules/mapBuilder';
import { ColorPicker, NumberInput, SelectInput, Switch, TextInput } from '../uiComponents/index';
import { hexStringToNumber, numberToHexString } from '../utils';
import { EditorPanelContext } from './editor';

interface MapElementAttributesPanelProps {
    mapElementProps: MapElementProps;
}

const attributesPanelLabel = 'Attributes';
const editableAttributesByType: Record<MapElementType, string[]> = {
    default: ['type', 'mass', 'color'],
    compound: ['color'],
    animated: ['dataSet'],
    trigger: ['type', 'event', 'dataSet'],
    vehicle: [],
};
const triggerEventOptionList: TriggerMapElementEvent[] = [
    'checkpoint' as TriggerMapElementEvent.checkpoint,
    'finish' as TriggerMapElementEvent.finish,
    'reset' as TriggerMapElementEvent.reset,
    'setCameraMode' as TriggerMapElementEvent.setCameraMode,
    'setCameraPosition' as TriggerMapElementEvent.setCameraPosition,
    'startAnimation' as TriggerMapElementEvent.startAnimation,
];

export function MapElementAttributesPanel({ mapElementProps }: MapElementAttributesPanelProps) {
    const { mapBuilder } = useContext(EditorPanelContext);
    const {
        type = MapElementType.default, mass = 0, event = TriggerMapElementEvent.setCameraPosition, dataSet = '',
    } = mapElementProps;
    const colorValue = getColorValueByProps(mapElementProps);
    const hexColorValue = typeof colorValue === 'number' ? numberToHexString(colorValue) : String(colorValue);

    return (
        <>
            <span className="label">{attributesPanelLabel}</span>
            {isAttributeEditable(type, 'type') && (
                <Switch label="isTrigger:" id="type" on={type === MapElementType.trigger} onChange={onTriggerSwitch}/>
            )}
            {isAttributeEditable(type, 'mass') && (
                <NumberInput label="mass:" id="mass" value={mass} onChange={onChange} min={0} step={1}/>
            )}
            {isAttributeEditable(type, 'event') && (
                <SelectInput
                    label="event:" id="event" value={event} onChange={onChange} optionList={triggerEventOptionList}
                />
            )}
            {isAttributeEditable(type, 'dataSet') && (
                <TextInput label="dataSet:" id="dataSet" value={dataSet} onChange={onChange}/>
            )}
            {isAttributeEditable(type, 'color') && (
                <ColorPicker label="color:" id="color" value={hexColorValue} onChange={onChange} onInput={onColor}/>
            )}
        </>
    );

    function onChange(value: number|string, attr: string) {
        mapBuilder.setAttribute(mapBuilder.selectedMapElementId, { [attr]: value });
    }

    function onTriggerSwitch(isTrigger: boolean, attr: string) {
        mapBuilder.setAttribute(mapBuilder.selectedMapElementId, {
            [attr]: isTrigger ? MapElementType.trigger : MapElementType.default,
        });
    }

    function onColor(value: string) {
        setMeshColor(mapBuilder.getMeshFromStore(mapBuilder.selectedMapElementId), hexStringToNumber(value));
    }
}

function isAttributeEditable(mapElementType: MapElementType, propertyName: string) {
    return editableAttributesByType[mapElementType].includes(propertyName);
}
