import { useState } from 'react';

import { noop } from '../utils';
import { InputContainer } from './InputContainer';

interface Props {
    label?: string;
    id?: string;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: number, id?: string) => void;
}

export function RangeInput({ id, label, defaultValue, onChange = noop, ...props }: Props) {
    const [displayValue, setDisplayValue] = useState(defaultValue);

    return (
        <InputContainer label={label} id={id}>
            <input
                type="range" id={id} name={id}
                defaultValue={defaultValue} onChange={onInputChange} {...props}
            />
            <input value={displayValue} onChange={noop} tabIndex={-1}/>
        </InputContainer>
    );

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = Number(e.currentTarget.value);

        setDisplayValue(value);
        onChange(value, id);
    }
}
