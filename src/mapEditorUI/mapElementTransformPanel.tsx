import React, { useContext } from 'react';

import { loopDefaultProps, slopeTransitionDefaultProps } from '../mapModules/compoundMapElementComponents';
import { MapElementProps, MapElementShape } from '../mapModules/mapBuilder';
import { NumberInput } from '../uiComponents/numberInput';
import { MapBuilderContext } from './editor';

interface MapElementTransformPanelProps {
    mapElementProps: MapElementProps;
}

const transformPanelLabel = 'Transform';
const editablePropertiesByShape: Record<MapElementShape, MapElementProps[]> = {
    box: ['width', 'height', 'length'],
    cylinder: ['height', 'radiusTop', 'radiusBottom', 'sides'],
    ramp: ['width', 'height', 'length'],
    sphere: ['size'],
    triangularRamp: ['width', 'height', 'length'],
    loop: ['segmentWidth', 'segmentHeight', 'segmentLength', 'segmentCount', 'segmentPositionOffset', 'radius'],
    slopeTransition: ['segmentWidth', 'segmentHeight', 'segmentLength', 'segmentCount'],
};

export function MapElementTransformPanel({ mapElementProps }: MapElementTransformPanelProps) {
    const mapBuilder = useContext(MapBuilderContext);
    const defaultProps = getDefaultPropsByShape(mapElementProps.shape);
    const {
        shape,
        size = 1, width = 1, height = 1, length = 1,
        // ToDo
        radiusTop = 1, radiusBottom = 1, sides = 6,
        segmentCount = defaultProps.segmentCount,
        segmentWidth = defaultProps.segmentWidth,
        segmentHeight = defaultProps.segmentHeight,
        segmentLength = defaultProps.segmentLength,
        segmentPositionOffset = defaultProps.segmentPositionOffset,
        radius = defaultProps.radius,
    } = mapElementProps;

    return (
        <>
            <span className="label">{transformPanelLabel}</span>
            {isPropertyEditable('size', shape) && (
                <NumberInput
                    label="size:" name="size"
                    value={size} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('width', shape) && (
                <NumberInput
                    label="width:" name="width"
                    value={width} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('height', shape) && (
                <NumberInput
                    label="height:" name="height"
                    value={height} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('length', shape) && (
                <NumberInput
                    label="length:" name="length"
                    value={length} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('radiusTop', shape) && (
                <NumberInput
                    label="radius top:" name="radiusTop"
                    value={radiusTop} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('radiusBottom', shape) && (
                <NumberInput
                    label="radius bottom:" name="radiusBottom"
                    value={radiusBottom} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('sides', shape) && (
                <NumberInput
                    label="sides:" name="sides"
                    value={sides} onChange={onChange} min={3} step={1}
                />
            )}
            {isPropertyEditable('segmentWidth', shape) && (
                <NumberInput
                    label="segmentWidth:" name="segmentWidth"
                    value={segmentWidth} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('segmentHeight', shape) && (
                <NumberInput
                    label="segmentHeight:" name="segmentHeight"
                    value={segmentHeight} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('segmentLength', shape) && (
                <NumberInput
                    label="segmentLength:" name="segmentLength"
                    value={segmentLength} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('segmentCount', shape) && (
                <NumberInput
                    label="segmentCount:" name="segmentCount"
                    value={segmentCount} onChange={onChange} min={1} step={1}
                />
            )}
            {isPropertyEditable('segmentPositionOffset', shape) && (
                <NumberInput
                    label="offset:" name="segmentPositionOffset"
                    value={segmentPositionOffset} onChange={onChange}
                />
            )}
            {isPropertyEditable('radius', shape) && (
                <NumberInput
                    label="radius:" name="radius"
                    value={radius} onChange={onChange} min={0}
                />
            )}
        </>
    );

    function onChange(value: number, name: string) {
        mapBuilder.transform(mapBuilder.selectedMapElementId, { [name]: value });
    }
}

function isPropertyEditable(propertyName: string, mapElementShape?: MapElementShape) {
    return editablePropertiesByShape[mapElementShape]?.includes(propertyName);
}

function getDefaultPropsByShape(mapElementShape: MapElementShape): MapElementProps {
    switch (mapElementShape) {
        case MapElementShape.loop:
            return loopDefaultProps;
        case MapElementShape.slopeTransition:
            return slopeTransitionDefaultProps;
        default:
            return {};
    }
}
