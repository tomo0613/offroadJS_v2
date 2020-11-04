import { Vec3 } from 'cannon-es';

import store, { EditorState } from './store';
import { List } from './uiComponents/list';
import { NumberInput } from './uiComponents/numberInput';
import { PlatformBuilder } from '../platformBuilder';
import { SelectInput } from './uiComponents/selectInput';

const tmp_vec3 = new Vec3();
const axisMap = [
    Vec3.UNIT_X,
    Vec3.UNIT_Y,
    Vec3.UNIT_Z,
];
const translatePanelLayout = {
    positionX: new NumberInput({ label: 'position.X:' }),
    positionY: new NumberInput({ label: 'position.Y:' }),
    positionZ: new NumberInput({ label: 'position.Z:' }),
    rotation: new NumberInput({ label: 'rotation:', min: 0, max: 360 }),
    rotationAxisIndex: new SelectInput({ label: 'rotation axis:', options: ['X', 'Y', 'Z'] }),
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
        const platformId = (currentTarget as HTMLElement).dataset.id.replace('platform_', '');
        const { width, height, length, radiusTop, radiusBottom, sides } = platformBuilder.getPropsFromStore(platformId);
        const platformBody = platformBuilder.getBodyFromStore(platformId);
        const { x: positionX, y: positionY, z: positionZ } = platformBody.position;
        const [rotationAxis, rotation] = platformBody.quaternion.toAxisAngle();
        const rotationAxisIndex = axisMap.findIndex((axis) => rotationAxis.almostEquals(axis));

        store.onChange = renderPropertyEditor;
        store.setState({
            platformId,
            width,
            height,
            length,
            radiusTop,
            radiusBottom,
            sides,
            positionX,
            positionY,
            positionZ,
            rotation: rotation * 180 / Math.PI,
            rotationAxisIndex: rotationAxisIndex === -1 ? 0 : rotationAxisIndex,
        });

        platformBuilder.selectPlatform(platformId);
    };

    const translatePropertyChangeHandlers = {
        positionX(positionX: number) {
            const { positionY, positionZ } = store.getState();
            const position = tmp_vec3.set(positionX, positionY, positionZ);
            platformBuilder.translate(platformBuilder.selectedPlatformId, { position });
            store.setState({ positionX });
        },
        positionY(positionY: number) {
            const { positionX, positionZ } = store.getState();
            const position = tmp_vec3.set(positionX, positionY, positionZ);
            platformBuilder.translate(platformBuilder.selectedPlatformId, { position });
            store.setState({ positionY });
        },
        positionZ(positionZ: number) {
            const { positionX, positionY } = store.getState();
            const position = tmp_vec3.set(positionX, positionY, positionZ);
            platformBuilder.translate(platformBuilder.selectedPlatformId, { position });
            store.setState({ positionZ });
        },
        rotation(rotation: number) {
            const { rotationAxisIndex } = store.getState();
            platformBuilder.translate(platformBuilder.selectedPlatformId, {
                rotation,
                rotationAxis: axisMap[rotationAxisIndex],
            });
            store.setState({ rotation });
        },
        rotationAxisIndex(rotationAxisIndex: number) {
            const { rotation } = store.getState();
            platformBuilder.translate(platformBuilder.selectedPlatformId, {
                rotation,
                rotationAxis: axisMap[rotationAxisIndex],
            });
            store.setState({ rotationAxisIndex });
        },
    };
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
    list.setItems(getPlatformIdList());
    list.appendTo(gEditorPanel);

    gEditorPanel.appendChild(createActionButtonBar({
        add() {},
        clone() {
            platformBuilder.clone(platformBuilder.selectedPlatformId);
            list.setItems(getPlatformIdList());
        },
        remove() {
            platformBuilder.destroy(platformBuilder.selectedPlatformId);
            list.setItems(getPlatformIdList());
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

    function getPlatformIdList() {
        return platformBuilder.platformIdList.map((id) => `platform_${id}`);
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
