import React, { useContext } from 'react';

import { MapElementProps, MapElementType } from '../mapModules/mapBuilder';
import { NumberInput } from '../uiComponents/numberInput';
import { MapBuilderContext } from './editor';

interface MapElementTransformPanelProps {
    mapElementProps: MapElementProps;
}

const transformPanelLabel = 'Transform';
const editablePropertiesByType: Record<MapElementType, string[]> = {
    box: ['width', 'height', 'length'],
    cylinder: ['height', 'radiusTop', 'radiusBottom', 'sides'],
    ramp: ['width', 'height', 'length'],
    sphere: ['size'],
    triangularRamp: ['width', 'height', 'length'],
    trigger: ['size'],
    vehicle: [],
};

export function MapElementTransformPanel({ mapElementProps }: MapElementTransformPanelProps) {
    const mapBuilder = useContext(MapBuilderContext);
    const {
        type,
        size = 1, width = 1, height = 1, length = 1,
        radiusTop: rTop = 1, radiusBottom: rBottom = 1, sides = 6,
    } = mapElementProps;

    return (
        <>
            <span className="label">{transformPanelLabel}</span>
            {isPropertyEditable(type, 'size') && (
                <NumberInput label="size:" name="size" value={size} onChange={onChange} min={0}/>
            )}
            {isPropertyEditable(type, 'width') && (
                <NumberInput label="width:" name="width" value={width} onChange={onChange} min={0}/>
            )}
            {isPropertyEditable(type, 'height') && (
                <NumberInput label="height:" name="height" value={height} onChange={onChange} min={0}/>
            )}
            {isPropertyEditable(type, 'length') && (
                <NumberInput label="length:" name="length" value={length} onChange={onChange} min={0}/>
            )}
            {isPropertyEditable(type, 'radiusTop') && (
                <NumberInput label="radius top:" name="radiusTop" value={rTop} onChange={onChange} min={0}/>
            )}
            {isPropertyEditable(type, 'radiusBottom') && (
                <NumberInput label="radius bottom:" name="radiusBottom" value={rBottom} onChange={onChange} min={0}/>
            )}
            {isPropertyEditable(type, 'sides') && (
                <NumberInput label="sides:" name="sides" value={sides} onChange={onChange} min={3} step={1}/>
            )}
        </>
    );

    function onChange(value: number, name: string) {
        mapBuilder.transform(mapBuilder.selectedMapElementId, { [name]: value });
    }
}

function isPropertyEditable(mapElementType: MapElementType, propertyName: string) {
    return editablePropertiesByType[mapElementType].includes(propertyName);
}
