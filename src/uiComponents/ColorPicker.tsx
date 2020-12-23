import React, { Component, createRef } from 'react';

import { NOP, numberToHexString } from '../utils';
import { InputContainer } from './InputContainer';

interface ColorPickerProps {
    label?: string;
    id?: string;
    value?: string;
    onChange?: (value: string, id?: string) => void;
    onInput?: (value: string, id?: string) => void;
}

interface ColorPickerState {
    value: string;
}

const colorValueDataList = document.createElement('datalist');
colorValueDataList.id = 'colorValueList';
document.documentElement.appendChild(colorValueDataList);

function addColorValueToList(colorValue: number) {
    const option = document.createElement('option');
    option.textContent = numberToHexString(colorValue);

    colorValueDataList.appendChild(option);
}

export class ColorPicker extends Component<ColorPickerProps, ColorPickerState> {
    private inputRef = createRef<HTMLInputElement>();

    static defaultProps = {
        id: '',
        label: '',
        value: '',
        onChange: NOP,
    };

    static addColorValues = (...colorValues: number[]) => {
        colorValues.forEach(addColorValueToList);
    };

    constructor(props: ColorPickerProps) {
        super(props);

        this.state = { value: props.value.toLowerCase() };
    }

    render() {
        const { id, label } = this.props;
        const { value } = this.state;

        return (
            <InputContainer label={label} id={id}>
                <input
                    type="color"
                    list={colorValueDataList.id}
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

    componentDidUpdate(prevProps: ColorPickerProps) {
        if (this.props.value !== prevProps.value) {
            this.setState({ value: this.props.value });
        }
    }

    get inputElement() {
        return this.inputRef.current;
    }

    private onInputFieldChange = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>) => {
        if (this.props.onInput) {
            this.props.onInput(currentTarget.value);
        }
        this.setState({ value: currentTarget.value });
    }

    private onInputFieldKeyUp = ({ key }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter' || key === 'Escape') {
            this.inputElement.blur();
        }
    }

    private onInputFieldBlur = () => {
        if (this.state.value !== this.props.value.toLowerCase()) {
            this.props.onChange(this.state.value, this.props.id);
        }
    }
}
