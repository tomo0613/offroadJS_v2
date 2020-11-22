import React from 'react';

export default function Root() {
    return (
        <React.StrictMode>
            <Editor />
        </React.StrictMode>
    );
}

function Editor() {
    return <h1>Hello World !</h1>;
}
