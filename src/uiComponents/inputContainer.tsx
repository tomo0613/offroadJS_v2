import React from 'react';

interface InputContainerProps {
    label?: string;
}

export const InputContainer: React.FunctionComponent<InputContainerProps> = function ({ label, children }) {
    return label ? (
        <div className="inputContainer">
            <span>{label}</span>
            {children}
        </div>
    ) : (
        <>{children}</>
    );
};
