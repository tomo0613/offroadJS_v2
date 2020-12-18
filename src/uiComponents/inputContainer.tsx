import React from 'react';

interface InputContainerProps {
    label?: string;
    id?: string;
}

export const InputContainer: React.FunctionComponent<InputContainerProps> = function ({ label, id, children }) {
    return label ? (
        <div className="inputContainer">
            <label htmlFor={id}>{label}</label>
            {children}
        </div>
    ) : (
        <>{children}</>
    );
};
