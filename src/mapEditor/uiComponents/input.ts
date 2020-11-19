import { NOP } from '../../utils';

type InputElement = HTMLInputElement|HTMLSelectElement;

export class Input {
    type: 'input'|'select'
    containerElement = document.createElement('div');
    labelElement = document.createElement('span');
    inputElement: InputElement;
    protected valueChangeListener = NOP as (value: number|string) => void;

    constructor(label: string, type = 'input' as 'input'|'select') {
        this.type = type;
        this.inputElement = document.createElement(type);
        this.labelElement.innerText = label;
        this.containerElement.classList.add('inputContainer');
        this.containerElement.appendChild(this.labelElement);
        this.containerElement.appendChild(this.inputElement);
    }

    protected onChange = ({ currentTarget }: InputEvent) => {
        if (!(currentTarget as InputElement).validity.patternMismatch) {
            this.valueChangeListener((currentTarget as InputElement).value);
        }
    }

    appendTo(element: HTMLElement) {
        element.appendChild(this.containerElement);
        this.inputElement.addEventListener('change', this.onChange);

        return this;
    }

    remove() {
        this.inputElement.removeEventListener('change', this.onChange);
        this.containerElement.remove();
    }

    setOnChange(onChange: (value: number|string) => void) {
        this.valueChangeListener = onChange;
    }
}
