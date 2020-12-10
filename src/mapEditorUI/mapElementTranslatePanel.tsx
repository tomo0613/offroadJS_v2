import React, { useContext } from 'react';

import { MapElementProps } from '../mapModules/mapBuilder';
import { NumberInput } from '../uiComponents/numberInput';
import { MapBuilderContext } from './editor';

interface MapElementTranslatePanelProps {
    mapElementProps: MapElementProps;
}

const translatePanelLabel = 'Translate';

export function MapElementTranslatePanel({ mapElementProps }: MapElementTranslatePanelProps) {
    const mapBuilder = useContext(MapBuilderContext);
    const {
        position_x = 0, position_y = 0, position_z = 0,
        rotation_x = 0, rotation_y = 0, rotation_z = 0,
    } = mapElementProps;

    return (
        <>
            <span className="label">{translatePanelLabel}</span>
            <NumberInput
                label="position.X:" name="position_x" value={position_x} sensitivity={10}
                onChange={onInputChange}
            />
            <NumberInput
                label="position.Y:" name="position_y" value={position_y} sensitivity={10}
                onChange={onInputChange}
            />
            <NumberInput
                label="position.Z:" name="position_z" value={position_z} sensitivity={10}
                onChange={onInputChange}
            />
            <NumberInput
                label="rotation.X:" name="rotation_x" value={rotation_x} sensitivity={10}
                onChange={onInputChange} min={-360} max={360}
            />
            <NumberInput
                label="rotation.Y:" name="rotation_y" value={rotation_y} sensitivity={10}
                onChange={onInputChange} min={-360} max={360}
            />
            <NumberInput
                label="rotation.Z:" name="rotation_z" value={rotation_z} sensitivity={10}
                onChange={onInputChange} min={-360} max={360}
            />
        </>
    );

    function onInputChange(value: number, name: string) {
        mapBuilder.translate(mapBuilder.selectedMapElementId, { [name]: value });
    }
}
