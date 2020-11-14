import { Input } from './input';

interface Props {
    label: string;
    defaultValue?: string;
}

export class TextInput extends Input {
    constructor({ label, defaultValue = '' }: Props) {
        super(label);

        const inputElement = this.inputElement as HTMLInputElement;
        inputElement.value = defaultValue;
    }

    setValue(value: string|number) {
        this.inputElement.value = String(value);
    }
}
