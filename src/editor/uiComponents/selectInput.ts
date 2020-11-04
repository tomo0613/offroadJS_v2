import { Input } from './input';

interface Props {
    label: string;
    options: string[];
}

export class SelectInput extends Input {
    selectedIndex: number;

    constructor({ label, options }: Props) {
        super(label, 'select');

        options.forEach(this.createOption);
    }

    private createOption = (label: string) => {
        const option = document.createElement('option');
        option.innerText = label;

        this.inputElement.appendChild(option);
    }

    setValue(selectedIndex: number) {
        (this.inputElement as HTMLSelectElement).selectedIndex = selectedIndex;
    }
}
