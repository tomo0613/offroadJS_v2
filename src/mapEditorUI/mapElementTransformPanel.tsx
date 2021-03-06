import React, { useContext } from 'react';

import {
    cantedCurveDefaultProps, loopDefaultProps, slopeTransitionDefaultProps,
} from '../mapModules/compoundMapElementComponents';
import { MapElementProps, MapElementShape } from '../mapModules/mapBuilder';
import { NumberInput } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { MapBuilderContext } from './editor';

interface MapElementTransformPanelProps {
    mapElementProps: MapElementProps;
}

const {
    transformPanelLabel,
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
    angleLabel,
} = uiTexts;

const editablePropertiesByShape: Record<MapElementShape, (keyof MapElementProps)[]> = {
    box: ['width', 'height', 'length'],
    cylinder: ['height', 'radiusTop', 'radiusBottom', 'sides'],
    sphere: ['radius'],
    tetrahedron: ['width', 'height', 'length'],
    triangularPrism: ['width', 'height', 'length', 'offset'],
    loop: ['segmentWidth', 'segmentHeight', 'segmentLength', 'segmentCount', 'segmentPositionOffset', 'radius'],
    slopeTransition: ['segmentWidth', 'segmentHeight', 'segmentLength', 'segmentCount', 'angle'],
    cantedCurve: ['segmentWidth', 'segmentHeight', 'segmentLength', 'segmentCount', 'radius', 'angle'],
};

export function MapElementTransformPanel({ mapElementProps }: MapElementTransformPanelProps) {
    const mapBuilder = useContext(MapBuilderContext);
    const defaultProps = getDefaultPropsByShape(mapElementProps.shape);
    const {
        shape,
        width = 2, height = 2, length = 2,
        // ToDo
        offset = 0,
        radius = defaultProps.radius || 1,
        radiusTop = 1, radiusBottom = 1, sides = 6,
        segmentCount = defaultProps.segmentCount,
        segmentWidth = defaultProps.segmentWidth,
        segmentHeight = defaultProps.segmentHeight,
        segmentLength = defaultProps.segmentLength,
        segmentPositionOffset = defaultProps.segmentPositionOffset,
        angle = defaultProps.angle,
    } = mapElementProps;

    return (
        <>
            <span className="label">{transformPanelLabel}</span>
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
            {isPropertyEditable('offset', shape) && (
                <NumberInput
                    label={offsetLabel} id="offset"
                    value={offset} onChange={onChange}
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
            {isPropertyEditable('segmentCount', shape) && (
                <NumberInput
                    label={segmentCountLabel} id="segmentCount"
                    value={segmentCount} onChange={onChange} min={1} step={1}
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
            {isPropertyEditable('angle', shape) && (
                <NumberInput
                    label={angleLabel} id="angle"
                    value={angle} onChange={onChange} min={0} max={180} step={1}
                />
            )}
        </>
    );

    function onChange(value: number, prop: string) {
        mapBuilder.transform(mapBuilder.selectedMapElementId, { [prop]: value });
    }
}

function isPropertyEditable(propertyName: keyof MapElementProps, mapElementShape?: MapElementShape) {
    return editablePropertiesByShape[mapElementShape]?.includes(propertyName);
}

function getDefaultPropsByShape(mapElementShape: MapElementShape): MapElementProps {
    switch (mapElementShape) {
        case MapElementShape.loop:
            return loopDefaultProps;
        case MapElementShape.slopeTransition:
            return slopeTransitionDefaultProps;
        case MapElementShape.cantedCurve:
            return cantedCurveDefaultProps;
        default:
            return {};
    }
}
