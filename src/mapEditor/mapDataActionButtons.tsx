import React, { useContext, useRef, useState } from 'react';

import { MapElementProps } from '../mapModules/mapBuilder';
import { Modal } from '../uiComponents/modal';
import { NOP } from '../utils';
import { MapBuilderContext } from './editor';

const importButtonText = 'import';
const exportButtonText = 'export';
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

export function MapDataActionButtons() {
    const [activeModal, setActiveModal] = useState<'import'|'export'>();

    return (
        <div>
            <button onClick={() => { setActiveModal('import'); }}>
                {importButtonText}
            </button>
            <button onClick={() => { setActiveModal('export'); }}>
                {exportButtonText}
            </button>
            {activeModal && (
                <Modal onClose={closeModal}>
                    {activeModal === 'import' && (
                        <MapDataImportModal closeModal={closeModal}/>
                    )}
                    {activeModal === 'export' && (
                        <MapDataExportModal/>
                    )}
                </Modal>
            )}
        </div>
    );

    function closeModal() {
        setActiveModal(undefined);
    }
}

function MapDataImportModal({ closeModal }: { closeModal: VoidFnc }) {
    const mapBuilder = useContext(MapBuilderContext);
    const inputRef = useRef<HTMLTextAreaElement>();

    return (
        <>
            <textarea ref={inputRef} placeholder={importTextAreaPlaceholder}/>
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

function MapDataExportModal() {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <textarea value={JSON.stringify(mapBuilder.exportMap(), null, 4)} onChange={NOP}/>
    );
}
