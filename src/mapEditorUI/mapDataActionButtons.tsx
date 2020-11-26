import React, { useState } from 'react';

import { Modal } from '../uiComponents/modal';
import { MapDataExportModal } from './mapDataExportModal';
import { MapDataImportModal } from './mapDataImportModal';

const importButtonText = 'import';
const exportButtonText = 'export';

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
