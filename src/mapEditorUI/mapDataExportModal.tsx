import React, { useContext } from 'react';

import { NOP } from '../utils';
import { MapBuilderContext } from './editor';

export function MapDataExportModal() {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <div className="modal__body">
            <textarea value={JSON.stringify(mapBuilder.exportMap(), null, 4)} onChange={NOP}/>
        </div>
    );
}
