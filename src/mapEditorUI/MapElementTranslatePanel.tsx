import { useContext } from 'react';

import { MapElementProps } from '../mapModules/mapBuilder';
import { NumberInput } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { EditorPanelContext } from './editor';

interface MapElementTranslatePanelProps {
    mapElementProps: MapElementProps;
}

export function MapElementTranslatePanel({ mapElementProps }: MapElementTranslatePanelProps) {
    const { mapBuilder } = useContext(EditorPanelContext);
    const {
        position_x = 0, position_y = 0, position_z = 0,
        rotation_x = 0, rotation_y = 0, rotation_z = 0,
    } = mapElementProps;

    return (
        <>
            <span className="label">{uiTexts.translatePanelLabel}</span>
            <NumberInput
                label={`${uiTexts.positionLabel}.X:`} id="position_x" value={position_x} sensitivity={10}
                onChange={onInputChange}
            />
            <NumberInput
                label={`${uiTexts.positionLabel}.Y:`} id="position_y" value={position_y} sensitivity={10}
                onChange={onInputChange}
            />
            <NumberInput
                label={`${uiTexts.positionLabel}.Z:`} id="position_z" value={position_z} sensitivity={10}
                onChange={onInputChange}
            />
            <NumberInput
                label={`${uiTexts.rotationLabel}.X:`} id="rotation_x" value={rotation_x} sensitivity={10}
                onChange={onInputChange} min={-360} max={360}
            />
            <NumberInput
                label={`${uiTexts.rotationLabel}.Y:`} id="rotation_y" value={rotation_y} sensitivity={10}
                onChange={onInputChange} min={-360} max={360}
            />
            <NumberInput
                label={`${uiTexts.rotationLabel}.Z:`} id="rotation_z" value={rotation_z} sensitivity={10}
                onChange={onInputChange} min={-360} max={360}
            />
        </>
    );

    function onInputChange(value: number, prop: string) {
        mapBuilder.translate(mapBuilder.selectedMapElementId, { [prop]: value });
    }
}
