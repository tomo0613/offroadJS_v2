import { NOP } from '../utils';

interface MapFinishedContext {
    result: string;
    onNext: Function;
    onRetry: Function;
}

const mapFinished = (context: MapFinishedContext) => ({
    title: 'Finished!',
    textContent: `Your time: ${context.result}`,
    buttonBar: [
        { label: 'retry', onClick: context.onRetry },
        { label: 'next', onClick: context.onNext },
    ],
});

type LayoutRenderer = typeof mapFinished;
type Layout = ReturnType<LayoutRenderer>;

export const layoutRenderers = {
    mapFinished,
};

export class PopUpWindow {
    container = document.createElement('div');
    popUpWindow = document.createElement('div');
    popUpWindow_title = document.createElement('div');
    popUpWindow_textContent = document.createElement('span');
    popUpWindow_buttonBar = document.createElement('div');
    onClose = NOP;
    currentLayout: Layout;

    constructor() {
        this.popUpWindow.id = 'popUpWindow';
        this.container.id = 'popUpWindow_container';
        this.popUpWindow_title.id = 'popUpWindow_title';
        this.popUpWindow_textContent.id = 'popUpWindow_textContent';
        this.popUpWindow_buttonBar.id = 'popUpWindow_buttonBar';
        this.container.classList.add('hidden');

        this.popUpWindow.appendChild(this.popUpWindow_title);
        this.popUpWindow.appendChild(this.popUpWindow_textContent);
        this.popUpWindow.appendChild(this.popUpWindow_buttonBar);
        this.container.appendChild(this.popUpWindow);
        document.body.appendChild(this.container);
    }

    get hidden() {
        return this.container.classList.contains('hidden');
    }

    open(layoutRenderer: LayoutRenderer, context: MapFinishedContext) {
        this.container.classList.remove('hidden');

        const layout = layoutRenderer(context);

        if (this.currentLayout && JSON.stringify(this.currentLayout) === JSON.stringify(layout)) {
            return;
        }

        this.popUpWindow_title.textContent = layout.title;
        this.popUpWindow_textContent.textContent = layout.textContent;
        // remove all buttons
        while (this.popUpWindow_buttonBar.firstChild) {
            this.popUpWindow_buttonBar.removeChild(this.popUpWindow_buttonBar.lastChild);
        }
        // add buttons
        layout.buttonBar.forEach((buttonProps) => {
            const button = document.createElement('button');
            button.textContent = buttonProps.label;
            button.addEventListener('click', () => {
                buttonProps.onClick();
            });

            this.popUpWindow_buttonBar.appendChild(button);
        });
    }

    close() {
        this.container.classList.add('hidden');
    }
}
