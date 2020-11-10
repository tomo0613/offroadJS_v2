import { Vec3 } from 'cannon-es';

import store, { EditorState } from './store';
import { Label } from './uiComponents/label';
import { List } from './uiComponents/list';
import { MapBuilder } from '../mapBuilder';
import { NumberInput } from './uiComponents/numberInput';
import { radToDeg } from '../utils';

const transformableProperties = {
    box: ['width', 'height', 'length'],
    cylinder: ['height', 'radiusTop', 'radiusBottom', 'sides'],
    ramp: ['width', 'height', 'length'],
    triangularRamp: ['width', 'height', 'length'],
    trigger: ['size'],
};

const tmp_vec3 = new Vec3();
const translatePanelLabel = new Label('Translate');
const translatePanelLayout = {
    position_x: new NumberInput({ label: 'position.X:' }),
    position_y: new NumberInput({ label: 'position.Y:' }),
    position_z: new NumberInput({ label: 'position.Z:' }),
    rotation_x: new NumberInput({ label: 'rotation.X:', min: -360, max: 360 }),
    rotation_y: new NumberInput({ label: 'rotation.Y:', min: -360, max: 360 }),
    rotation_z: new NumberInput({ label: 'rotation.Z:', min: -360, max: 360 }),
};
const transformPanelLabel = new Label('Transform');
const transformPanelLayout = {
    size: new NumberInput({ label: 'size:', defaultValue: 1, min: 0 }),
    width: new NumberInput({ label: 'width:', defaultValue: 1, min: 0 }),
    height: new NumberInput({ label: 'height:', defaultValue: 1, min: 0 }),
    length: new NumberInput({ label: 'length:', defaultValue: 1, min: 0 }),
    radiusTop: new NumberInput({ label: 'radius top:', defaultValue: 1, min: 0 }),
    radiusBottom: new NumberInput({ label: 'radius bottom:', defaultValue: 1, min: 0 }),
    sides: new NumberInput({ label: 'sides:', defaultValue: 6, min: 3 }),
};

let gEditorPanel: HTMLElement;
let gPropertyEditorContainer: HTMLElement;

function createEditorPanel() {
    gEditorPanel = document.createElement('aside');
    gEditorPanel.classList.add('floatingElement');
    gEditorPanel.id = 'editorPanel';

    document.body.appendChild(gEditorPanel);

    gPropertyEditorContainer = document.createElement('section');
}

export function renderEditor(mapBuilder: MapBuilder) {
    // createEditorPanelIfNotExists
    if (!gEditorPanel) {
        createEditorPanel();
    } else {
        return;
    }

    store.onChange = renderPropertyEditor;

    const onListSelection = ({ currentTarget }: MouseEvent) => {
        const mapElementId = (currentTarget as HTMLElement).dataset.id;
        const mapElementBody = mapBuilder.getBodyFromStore(mapElementId);
        const {
            size, width, height, length, radiusTop, radiusBottom, sides,
        } = mapBuilder.getPropsFromStore(mapElementId);
        const { x: position_x, y: position_y, z: position_z } = mapElementBody.position;
        mapElementBody.quaternion.toEuler(tmp_vec3);
        const { x: rotation_x, y: rotation_y, z: rotation_z } = tmp_vec3;

        store.setState({
            mapElementId,
            size,
            width,
            height,
            length,
            radiusTop,
            radiusBottom,
            sides,
            position_x,
            position_y,
            position_z,
            rotation_x: radToDeg(rotation_x),
            rotation_y: radToDeg(rotation_y),
            rotation_z: radToDeg(rotation_z),
        });

        mapBuilder.selectPlatform(mapElementId);
    };

    const translateProperties = [
        'position_x', 'position_y', 'position_z', 'rotation_x', 'rotation_y', 'rotation_z',
    ] as const;
    const translatePropertyChangeHandlers = translateProperties.reduce((changeHandlers, property) => {
        changeHandlers[property] = (value: number) => {
            mapBuilder.translate(mapBuilder.selectedMapElementId, { [property]: value });
            store.setState({ [property]: value });
        };

        return changeHandlers;
    }, {} as Record<typeof translateProperties[number], (value: number) => void>);

    const transformProperties = ['size', 'width', 'height', 'length', 'radiusTop', 'radiusBottom', 'sides'] as const;
    const transformPropertyChangeHandlers = transformProperties.reduce((changeHandlers, property) => {
        changeHandlers[property] = (value: number) => {
            const props = store.getState();
            mapBuilder.transform(mapBuilder.selectedMapElementId, { ...props, [property]: value });
            store.setState({ [property]: value });
        };

        return changeHandlers;
    }, {} as Record<typeof transformProperties[number], (value: number) => void>);

    const list = new List('Map elements: ', onListSelection);
    list.setItems(mapBuilder.mapElementIdList);
    list.appendTo(gEditorPanel);

    gEditorPanel.appendChild(createActionButtonBar({
        add() {
            console.log('ToDo add new');
        },
        clone() {
            mapBuilder.clone(mapBuilder.selectedMapElementId);
            list.setItems(mapBuilder.mapElementIdList);
        },
        remove() {
            mapBuilder.destroy(mapBuilder.selectedMapElementId);
            list.setItems(mapBuilder.mapElementIdList);
        },
    }));
    gEditorPanel.appendChild(gPropertyEditorContainer);

    function renderPropertyEditor(state: EditorState) {
        renderTranslatePanel(state);
        renderTransformPanel(state);
    }

    function renderTranslatePanel(state: EditorState) {
        translatePanelLabel.appendTo(gPropertyEditorContainer);

        Object.entries(translatePanelLayout).forEach(([property, inputElement]) => {
            inputElement.appendTo(gPropertyEditorContainer);
            inputElement.setValue(state[property]);
            inputElement.setOnChange(translatePropertyChangeHandlers[property]);
        });
    }

    function renderTransformPanel(state: EditorState) {
        transformPanelLabel.appendTo(gPropertyEditorContainer);

        Object.entries(transformPanelLayout).forEach(([property, inputElement]) => {
            const [mapElementType] = state.mapElementId.split('_');
            if (transformableProperties[mapElementType].includes(property)) {
                inputElement.appendTo(gPropertyEditorContainer);
                inputElement.setValue(state[property]);
                inputElement.setOnChange(transformPropertyChangeHandlers[property]);
            } else {
                inputElement.remove();
            }
        });
    }
}

function createActionButtonBar(actions: Record<string, () => void>) {
    const buttonBar = document.createElement('nav');

    Object.entries(actions).forEach(([key, action]) => {
        const button = document.createElement('button');
        button.textContent = key;
        button.addEventListener('click', action);

        buttonBar.appendChild(button);
    });

    return buttonBar;
}
