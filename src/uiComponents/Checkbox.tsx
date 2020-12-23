import React from 'react';

import { InputContainer } from './InputContainer';

interface Props {
    label?: string;
    id?: string;
    value?: string;
    defaultValue?: string;
    checked?: boolean;
    onChange?: (value: string, id?: string) => void;
}

export function Checkbox({ id, label, value = '', defaultValue = '', checked = false, onChange }: Props) {
    const valueHandlerProps = onChange ? {
        checked,
        onChange: onInputChange,
    } : {
        defaultChecked: checked,
    };

    return (
        <InputContainer label={label} id={id}>
            <input type="checkbox" id={id} name={id} value={value} {...valueHandlerProps} />
        </InputContainer>
    );

    function onInputChange({ currentTarget }: React.ChangeEvent<HTMLInputElement>) {
        onChange(currentTarget.checked ? value : defaultValue, id);
    }
}
