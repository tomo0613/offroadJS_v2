import React, { useContext, useRef } from 'react';

import { MapElementProps } from '../mapModules/mapBuilder';
import { MapBuilderContext } from './editor';

const importButtonText = 'import';
const importTextAreaPlaceholder = `{
    "box_0": {
        "width": 15,
        "height": 0.1,
        "length": 15
    },
    "ramp_1": {
        "width": 2,
        "length": 2,
        "position_x": -5,
        "position_y": 0.1,
        "position_z": -5,
        "rotation_y": 90
    }
}`;

export function MapDataImportModal({ closeModal }: { closeModal: VoidFnc }) {
    const mapBuilder = useContext(MapBuilderContext);
    const inputRef = useRef<HTMLTextAreaElement>();

    return (
        <>
            <div className="modal__body">
                <textarea ref={inputRef} placeholder={importTextAreaPlaceholder}/>
            </div>
            <button onClick={executeImport}>
                {importButtonText}
            </button>
        </>
    );

    function executeImport() {
        const mapDataString = inputRef.current.value;
        let mapData: Record<string, MapElementProps>;

        try {
            mapData = JSON.parse(mapDataString);
        } catch (error) {
            console.warn(error);
            return;
        }

        mapBuilder.importMap(mapData);
        closeModal();
    }
}
