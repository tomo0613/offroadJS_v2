import { useContext } from 'react';

import uiTexts from '../uiTexts';
import { EditorPanelContext } from './editor';

const { cloneButtonLabel, removeButtonLabel } = uiTexts;

export function MapElementActionButtons() {
    const { mapBuilder } = useContext(EditorPanelContext);

    return (
        <div>
            <button onClick={cloneMapElementAction}>
                {cloneButtonLabel}
            </button>
            <button onClick={destroyMapElementAction}>
                {removeButtonLabel}
            </button>
        </div>
    );

    function cloneMapElementAction() {
        mapBuilder.clone(mapBuilder.selectedMapElementId);
    }

    function destroyMapElementAction() {
        mapBuilder.destroy(mapBuilder.selectedMapElementId);
    }
}
