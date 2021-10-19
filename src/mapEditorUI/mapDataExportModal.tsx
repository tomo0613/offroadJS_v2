import { useContext } from 'react';

import { noop } from '../utils';
import { MapBuilderContext } from './editor';

export function MapDataExportModal() {
    const mapBuilder = useContext(MapBuilderContext);

    return (
        <div className="modal__body">
            <textarea value={JSON.stringify(mapBuilder.exportMap(), null, 4)} onChange={noop}/>
        </div>
    );
}
