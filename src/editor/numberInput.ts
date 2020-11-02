import { Input } from './input';

interface Props {
    label: string;
    defaultValue?: number;
    min?: number;
    max?: number;
}

export class NumberInput extends Input {
    constructor({ label, defaultValue = 0, min, max }: Props) {
        super(label);

        const inputElement = this.inputElement as HTMLInputElement;
        inputElement.type = 'number';
        inputElement.min = min && String(min);
        inputElement.max = max && String(max);
        inputElement.value = String(defaultValue);
    }

    setValue(value: number) {
        this.inputElement.value = String(value);
    }
}
