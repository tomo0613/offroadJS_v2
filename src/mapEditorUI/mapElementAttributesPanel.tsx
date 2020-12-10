import React, { useContext } from 'react';

import { MapElementProps, MapElementType, MapTriggerElementEvent } from '../mapModules/mapBuilder';
import { NumberInput } from '../uiComponents/numberInput';
import { SelectInput } from '../uiComponents/selectInput';
import { TextInput } from '../uiComponents/textInput';
import { MapBuilderContext } from './editor';

interface MapElementAttributesPanelProps {
    mapElementProps: MapElementProps;
}

const attributesPanelLabel = 'Attributes';
const editableAttributesByType: Record<MapElementType, string[]> = {
    default: [],
    compound: [],
    trigger: ['event', 'dataSet'],
    vehicle: [],
};
const triggerEventOptionList = ['setCameraPosition', 'checkpoint', 'finish'] as MapTriggerElementEvent[];

export function MapElementAttributesPanel({ mapElementProps }: MapElementAttributesPanelProps) {
    const mapBuilder = useContext(MapBuilderContext);
    const {
        type = MapElementType.default, mass = 0, event = MapTriggerElementEvent.setCameraPosition, dataSet = '',
    } = mapElementProps;

    return (
        <>
            <span className="label">{attributesPanelLabel}</span>
            {isAttributeEditable(type, 'mass') && (
                <NumberInput label="mass:" name="mass" value={mass} onChange={onChange} min={0}/>
            )}
            {isAttributeEditable(type, 'event') && (
                <SelectInput
                    label="event:" name="event" value={event} onChange={onChange} optionList={triggerEventOptionList}
                />
            )}
            {isAttributeEditable(type, 'dataSet') && (
                <TextInput label="dataSet:" name="dataSet" value={dataSet} onChange={onChange}/>
            )}
        </>
    );

    function onChange(value: number|string, name: string) {
        console.log('set attr', { [name]: value });
        // mapBuilder.attributes(mapBuilder.selectedMapElementId, { [name]: value });
    }
}

function isAttributeEditable(mapElementType: MapElementType, propertyName) {
    return editableAttributesByType[mapElementType].includes(propertyName);
}
