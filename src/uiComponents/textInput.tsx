import React from 'react';

import { NOP } from '../utils';
import { InputContainer } from './inputContainer';

interface TextInputPorps {
    label?: string;
    name?: string;
    value?: string;
    onChange?: (option: string, name?: string) => void;
}

export function TextInput({ name, value = '', label = '', onChange = NOP }: TextInputPorps) {
    return (
        <InputContainer label={label}>
            <input value={value} onChange={onInputFieldChange}/>
        </InputContainer>
    );

    function onInputFieldChange({ currentTarget }: React.ChangeEvent<HTMLInputElement>) {
        onChange(currentTarget.value, name);
    }
}
