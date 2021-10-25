import { useState } from 'react';

import { Modal } from '../uiComponents/index';
import uiTexts from '../uiTexts';
import { MapDataExportModal } from './MapDataExportModal';
import { MapDataImportModal } from './MapDataImportModal';

const { importButtonLabel, exportButtonLabel } = uiTexts;

export function MapDataActionButtons() {
    const [activeModal, setActiveModal] = useState<'import'|'export'>();

    return (
        <div>
            <button onClick={openImportModalAction}>
                {importButtonLabel}
            </button>
            <button onClick={openExportModalAction}>
                {exportButtonLabel}
            </button>
            {activeModal && (
                <Modal onClose={closeModalAction}>
                    {activeModal === 'import' && (
                        <MapDataImportModal closeModal={closeModalAction}/>
                    )}
                    {activeModal === 'export' && (
                        <MapDataExportModal/>
                    )}
                </Modal>
            )}
        </div>
    );

    function openImportModalAction() {
        setActiveModal('import');
    }

    function openExportModalAction() {
        setActiveModal('export');
    }

    function closeModalAction() {
        setActiveModal(undefined);
    }
}
