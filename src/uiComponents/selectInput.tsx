import React from 'react';

import { NOP } from '../utils';
import { InputContainer } from './inputContainer';

interface SelectPorps {
    label?: string;
    name?: string;
    value?: string;
    optionList: string[];
    onChange?: (option: string, name?: string) => void;
}

export function SelectInput({ optionList, name, label, value = '', onChange = NOP }: SelectPorps) {
    return (
        <InputContainer label={label}>
            <select value={value} onChange={onSelect}>
                {optionList.map((option) => (
                    <option key={option}>{option}</option>
                ))}
            </select>
        </InputContainer>
    );

    function onSelect({ currentTarget }: React.ChangeEvent<HTMLSelectElement>) {
        onChange(currentTarget.value, name);
    }
}
