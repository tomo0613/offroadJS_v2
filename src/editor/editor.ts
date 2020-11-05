import { Vec3 } from 'cannon-es';

import store, { EditorState } from './store';
import { List } from './uiComponents/list';
import { NumberInput } from './uiComponents/numberInput';
import { PlatformBuilder } from '../platformBuilder';

const tmp_vec3 = new Vec3();
const translatePanelLayout = {
    position_x: new NumberInput({ label: 'position.X:' }),
    position_y: new NumberInput({ label: 'position.Y:' }),
    position_z: new NumberInput({ label: 'position.Z:' }),
    rotation_x: new NumberInput({ label: 'rotation.X:', min: -360, max: 360 }),
    rotation_y: new NumberInput({ label: 'rotation.Y:', min: -360, max: 360 }),
    rotation_z: new NumberInput({ label: 'rotation.Z:', min: -360, max: 360 }),
};
const transformPanelLayout = {
    width: new NumberInput({ label: 'width', defaultValue: 1, min: 0 }),
    height: new NumberInput({ label: 'height', defaultValue: 1, min: 0 }),
    length: new NumberInput({ label: 'length', defaultValue: 1, min: 0 }),
    radiusTop: new NumberInput({ label: 'radiusTop', defaultValue: 1, min: 0 }),
    radiusBottom: new NumberInput({ label: 'radiusBottom', defaultValue: 1, min: 0 }),
    sides: new NumberInput({ label: 'sides', defaultValue: 6, min: 4 }),
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

export function setUpEditor(platformBuilder: PlatformBuilder) {
    // createEditorPanelIfNotExists
    if (!gEditorPanel) {
        createEditorPanel();
    } else {
        return;
    }

    const onListSelection = ({ currentTarget }: MouseEvent) => {
        const platformId = (currentTarget as HTMLElement).dataset.id;
        const { width, height, length, radiusTop, radiusBottom, sides } = platformBuilder.getPropsFromStore(platformId);
        const platformBody = platformBuilder.getBodyFromStore(platformId);
        const { x: position_x, y: position_y, z: position_z } = platformBody.position;
        platformBody.quaternion.toEuler(tmp_vec3);
        const { x: rotation_x, y: rotation_y, z: rotation_z } = tmp_vec3;

        store.onChange = renderPropertyEditor;
        store.setState({
            platformId,
            width,
            height,
            length,
            radiusTop,
            radiusBottom,
            sides,
            position_x,
            position_y,
            position_z,
            rotation_x: rotation_x * 180 / Math.PI,
            rotation_y: rotation_y * 180 / Math.PI,
            rotation_z: rotation_z * 180 / Math.PI,
        });

        platformBuilder.selectPlatform(platformId);
    };

    const translateProperties = [
        'position_x', 'position_y', 'position_z', 'rotation_x', 'rotation_y', 'rotation_z',
    ] as const;
    const translatePropertyChangeHandlers = translateProperties.reduce((changeHandlers, property) => {
        changeHandlers[property] = (value: number) => {
            platformBuilder.translate(platformBuilder.selectedPlatformId, { [property]: value });
            store.setState({ [property]: value });
        };

        return changeHandlers;
    }, {} as Record<typeof translateProperties[number], (value: number) => void>);

    const transformProperties = ['width', 'height', 'length', 'radiusTop', 'radiusBottom', 'sides'] as const;
    const transformPropertyChangeHandlers = transformProperties.reduce((changeHandlers, property) => {
        changeHandlers[property] = (value: number) => {
            const props = store.getState();
            platformBuilder.transform(platformBuilder.selectedPlatformId, { ...props, [property]: value });
            store.setState({ [property]: value });
        };

        return changeHandlers;
    }, {} as Record<typeof transformProperties[number], (value: number) => void>);

    const list = new List('platforms: ', onListSelection);
    list.setItems(platformBuilder.platformIdList);
    list.appendTo(gEditorPanel);

    gEditorPanel.appendChild(createActionButtonBar({
        add() {},
        clone() {
            platformBuilder.clone(platformBuilder.selectedPlatformId);
            list.setItems(platformBuilder.platformIdList);
        },
        remove() {
            platformBuilder.destroy(platformBuilder.selectedPlatformId);
            list.setItems(platformBuilder.platformIdList);
        },
    }));
    gEditorPanel.appendChild(gPropertyEditorContainer);

    function renderPropertyEditor(state: EditorState) {
        // label
        renderTranslatePanel(state);
        // label
        renderTransformPanel(state);
    }

    function renderTranslatePanel(state: EditorState) {
        Object.entries(translatePanelLayout).forEach(([property, inputElement]) => {
            inputElement.appendTo(gPropertyEditorContainer);
            inputElement.setValue(state[property]);
            inputElement.setOnChange(translatePropertyChangeHandlers[property]);
        });
    }

    function renderTransformPanel(state: EditorState) {
        Object.entries(transformPanelLayout).forEach(([property, inputElement]) => {
            inputElement.appendTo(gPropertyEditorContainer);
            inputElement.setValue(state[property]);
            inputElement.setOnChange(transformPropertyChangeHandlers[property]);
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
