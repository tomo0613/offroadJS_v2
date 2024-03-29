import { noop } from '../utils';
import { InputContainer } from './InputContainer';

interface SelectProps {
    label?: string;
    id?: string;
    value?: string;
    optionList: string[];
    onChange?: (option: string, id?: string) => void;
}

export function SelectInput({ optionList, id, label, value = '', onChange = noop }: SelectProps) {
    return (
        <InputContainer label={label} id={id}>
            <select value={value} id={id} name={id} onChange={onSelect}>
                {optionList.map((option) => (
                    <option key={option}>{option}</option>
                ))}
            </select>
        </InputContainer>
    );

    function onSelect({ currentTarget }: React.ChangeEvent<HTMLSelectElement>) {
        onChange(currentTarget.value, id);
    }
}
