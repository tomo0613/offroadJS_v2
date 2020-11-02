export class Input {
    type: 'input'|'select'
    containerElement = document.createElement('div');
    labelElement = document.createElement('span');
    inputElement: HTMLInputElement|HTMLSelectElement;
    private valueChangeListener: (value: number) => void;

    constructor(label: string, type = 'input' as 'input'|'select') {
        this.type = type;
        this.inputElement = document.createElement(type);
        this.inputElement.addEventListener('change', this.onChange);
        this.labelElement.innerText = label;
        this.containerElement.appendChild(this.labelElement);
        this.containerElement.appendChild(this.inputElement);
    }

    private onChange = ({ currentTarget }: InputEvent) => {
        let value: string|number;

        if (this.type === 'select') {
            value = (currentTarget as HTMLSelectElement).selectedIndex;
        } else {
            value = (currentTarget as HTMLInputElement).value;
        }

        this.valueChangeListener(Number(value));
    }

    appendTo(element: HTMLElement) {
        element.appendChild(this.containerElement);

        return this;
    }

    remove() {
        this.inputElement.removeEventListener('change', this.onChange);
        this.containerElement.remove();
    }

    setOnChange(onChange: (value: number) => void) {
        this.valueChangeListener = onChange;
    }
}
