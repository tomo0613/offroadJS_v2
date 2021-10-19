import { Component, createRef } from 'react';

import { noop } from '../utils';
import { InputContainer } from './InputContainer';

interface TextInputProps {
    label?: string;
    id?: string;
    value?: string;
    onChange?: (value: string, id?: string) => void;
}

interface TextInputState {
    value: string;
}

export class TextInput extends Component<TextInputProps, TextInputState> {
    private inputRef = createRef<HTMLInputElement>();

    static defaultProps = {
        id: '',
        label: '',
        value: '',
        onChange: noop,
    };

    constructor(props: TextInputProps) {
        super(props);

        this.state = { value: props.value };
    }

    render() {
        const { id, label } = this.props;
        const { value } = this.state;

        return (
            <InputContainer label={label} id={id}>
                <input
                    value={value}
                    id={id}
                    name={id}
                    onChange={this.onInputFieldChange}
                    onBlur={this.onInputFieldBlur}
                    onKeyUp={this.onInputFieldKeyUp}
                    ref={this.inputRef}
                />
            </InputContainer>
        );
    }

    componentDidUpdate(prevProps: TextInputProps) {
        if (this.props.value !== prevProps.value) {
            this.setState({ value: this.props.value });
        }
    }

    get inputElement() {
        return this.inputRef.current;
    }

    private onInputFieldChange = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ value: currentTarget.value });
    }

    private onInputFieldKeyUp = ({ key }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter' || key === 'Escape') {
            this.inputElement.blur();
        }
    }

    private onInputFieldBlur = () => {
        if (this.state.value !== this.props.value) {
            this.props.onChange(this.state.value, this.props.id);
        }
    }
}
