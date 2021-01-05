import React, { useState } from 'react';

import { Modal } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { MapDataExportModal } from './mapDataExportModal';
import { MapDataImportModal } from './mapDataImportModal';

const { importButtonLabel, exportButtonLabel } = uiTexts;

export function MapDataActionButtons() {
    const [activeModal, setActiveModal] = useState<'import'|'export'>();

    return (
        <div>
            <button onClick={() => { setActiveModal('import'); }}>
                {importButtonLabel}
            </button>
            <button onClick={() => { setActiveModal('export'); }}>
                {exportButtonLabel}
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
