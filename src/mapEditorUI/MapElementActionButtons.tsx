import { useContext } from 'react';

import uiTexts from '../uiTexts';
import { EditorPanelContext } from './editor';

export function MapElementActionButtons() {
    const { mapBuilder } = useContext(EditorPanelContext);

    return (
        <div>
            <button onClick={cloneMapElementAction}>
                {uiTexts.cloneButtonLabel}
            </button>
            <button onClick={destroyMapElementAction}>
                {uiTexts.removeButtonLabel}
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
