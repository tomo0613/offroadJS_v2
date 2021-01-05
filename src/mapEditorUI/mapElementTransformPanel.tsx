import React, { useContext } from 'react';

import { loopDefaultProps, slopeTransitionDefaultProps } from '../mapModules/compoundMapElementComponents';
import { MapElementProps, MapElementShape } from '../mapModules/mapBuilder';
import { NumberInput } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { MapBuilderContext } from './editor';

interface MapElementTransformPanelProps {
    mapElementProps: MapElementProps;
}

const {
    transformPanelLabel,
    sizeLabel,
    widthLabel,
    heightLabel,
    lengthLabel,
    radiusTopLabel,
    radiusBottomLabel,
    sidesLabel,
    segmentWidthLabel,
    segmentHeightLabel,
    segmentLengthLabel,
    segmentCountLabel,
    offsetLabel,
    radiusLabel,
} = uiTexts;

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
                    label={sizeLabel} id="size"
                    value={size} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('width', shape) && (
                <NumberInput
                    label={widthLabel} id="width"
                    value={width} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('height', shape) && (
                <NumberInput
                    label={heightLabel} id="height"
                    value={height} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('length', shape) && (
                <NumberInput
                    label={lengthLabel} id="length"
                    value={length} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('radiusTop', shape) && (
                <NumberInput
                    label={radiusTopLabel} id="radiusTop"
                    value={radiusTop} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('radiusBottom', shape) && (
                <NumberInput
                    label={radiusBottomLabel} id="radiusBottom"
                    value={radiusBottom} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('sides', shape) && (
                <NumberInput
                    label={sidesLabel} id="sides"
                    value={sides} onChange={onChange} min={3} step={1}
                />
            )}
            {isPropertyEditable('segmentWidth', shape) && (
                <NumberInput
                    label={segmentWidthLabel} id="segmentWidth"
                    value={segmentWidth} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('segmentHeight', shape) && (
                <NumberInput
                    label={segmentHeightLabel} id="segmentHeight"
                    value={segmentHeight} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('segmentLength', shape) && (
                <NumberInput
                    label={segmentLengthLabel} id="segmentLength"
                    value={segmentLength} onChange={onChange} min={0}
                />
            )}
            {isPropertyEditable('segmentCount', shape) && (
                <NumberInput
                    label={segmentCountLabel} id="segmentCount"
                    value={segmentCount} onChange={onChange} min={1} step={1}
                />
            )}
            {isPropertyEditable('segmentPositionOffset', shape) && (
                <NumberInput
                    label={offsetLabel} id="segmentPositionOffset"
                    value={segmentPositionOffset} onChange={onChange}
                />
            )}
            {isPropertyEditable('radius', shape) && (
                <NumberInput
                    label={radiusLabel} id="radius"
                    value={radius} onChange={onChange} min={0}
                />
            )}
        </>
    );

    function onChange(value: number, prop: string) {
        mapBuilder.transform(mapBuilder.selectedMapElementId, { [prop]: value });
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
