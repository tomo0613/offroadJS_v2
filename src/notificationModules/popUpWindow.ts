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
    private container = document.createElement('div');
    private domElement = document.createElement('div');
    private domElement_title = document.createElement('div');
    private domElement_textContent = document.createElement('span');
    private domElement_buttonBar = document.createElement('div');
    private currentLayout: Layout;

    constructor() {
        this.container.id = 'popUpWindow_container';
        this.domElement.id = 'popUpWindow';
        this.domElement_title.id = 'popUpWindow_title';
        this.domElement_textContent.id = 'popUpWindow_textContent';
        this.domElement_buttonBar.id = 'popUpWindow_buttonBar';
        this.container.classList.add('hidden');

        this.domElement.appendChild(this.domElement_title);
        this.domElement.appendChild(this.domElement_textContent);
        this.domElement.appendChild(this.domElement_buttonBar);
        this.container.appendChild(this.domElement);
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

        this.domElement_title.textContent = layout.title;
        this.domElement_textContent.textContent = layout.textContent;
        // remove all buttons
        while (this.domElement_buttonBar.firstChild) {
            this.domElement_buttonBar.removeChild(this.domElement_buttonBar.lastChild);
        }
        // add buttons
        layout.buttonBar.forEach((buttonProps) => {
            const button = document.createElement('button');
            button.textContent = buttonProps.label;
            button.addEventListener('click', () => {
                buttonProps.onClick();
            });

            this.domElement_buttonBar.appendChild(button);
        });
    }

    close() {
        this.container.classList.add('hidden');
    }
}
