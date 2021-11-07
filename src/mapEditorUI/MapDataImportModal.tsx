import { useContext, useRef } from 'react';

import { MapData } from '../mapModules/mapBuilder';
import { EditorPanelContext } from './editor';

const importButtonText = 'import';
const importTextAreaPlaceholder = `{
    meta: {},
    elements: [
        {
            "type": "vehicle",
            "position_y": 2,
            "position_z": 10
        },
        {
            "shape": "box",
            "width": 20,
            "height": 0.1,
            "length": 20
        },
        {
            "shape": "triangularPrism",
            "width": 3,
            "height": 1,
            "length": 3,
            "position_x": -3,
            "position_y": 0.1
        }
    ]
}`;

export function MapDataImportModal({ closeModal }: { closeModal: VoidFnc }) {
    const { mapBuilder } = useContext(EditorPanelContext);
    const inputRef = useRef<HTMLTextAreaElement>();

    return (
        <>
            <div className="modal__body">
                <textarea ref={inputRef} placeholder={importTextAreaPlaceholder}/>
            </div>
            <button onClick={executeImportAction}>
                {importButtonText}
            </button>
        </>
    );

    function executeImportAction() {
        const mapDataString = inputRef.current.value;
        let mapData: MapData;

        try {
            mapData = JSON.parse(mapDataString);
        } catch (error) {
            console.warn(error);
            return;
        }

        mapBuilder.importMap(mapData.elements);
        closeModal();
    }
}
