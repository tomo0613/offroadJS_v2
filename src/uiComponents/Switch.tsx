import React from 'react';

import { NOP } from '../utils';
import { InputContainer } from './InputContainer';

interface Porps {
    label?: string;
    id?: string;
    on?: boolean;
    onChange?: (on: boolean, id?: string) => void;
}

export function Switch({ id, label, on = false, onChange = NOP }: Porps) {
    return (
        <InputContainer label={label} id={id}>
            <input type="checkbox" className="switch__input" id={id} name={id} checked={on} onChange={onInputChange}/>
            <label htmlFor={id} className="switch__label"/>
        </InputContainer>
    );

    function onInputChange({ currentTarget }: React.ChangeEvent<HTMLInputElement>) {
        onChange(currentTarget.checked, id);
    }
}
