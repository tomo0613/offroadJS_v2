import { Component, createRef } from 'react';

import { noop, round, throttle, valueBetween } from '../utils';
import { InputContainer } from './InputContainer';

interface NumberInputProps {
    label: string;
    id: string;
    value?: number;
    onChange?: (value: number, id: string) => void;
    step?: number;
    sensitivity?: number;
    min?: number;
    max?: number;
}

interface NumberInputState {
    value: number|string;
}

const numericValuePattern = '^-?((?!0\\d)\\d+)(\\.\\d+)?$';
const stepStartDelay = 200;
const stepRate = 100;

const stepButtonLeftText = '◄';
const stepButtonRightText = '►';

export class NumberInput extends Component<NumberInputProps, NumberInputState> {
    private inputRef = createRef<HTMLInputElement>();
    private stepIntervalId = 0;
    private stepStartTimeoutId = 0;
    private valueIncrementBuffer = 0;
    private stepDirection: -1|1;

    static defaultProps = {
        id: '',
        label: '',
        value: 0,
        onChange: noop,
        step: 0.01,
        sensitivity: 1,
        min: -Infinity,
        max: Infinity,
    };

    constructor(props: NumberInputProps) {
        super(props);

        this.state = { value: props.value };
    }

    render() {
        const { label, id } = this.props;
        const { value } = this.state;

        return (
            <InputContainer label={label} id={id}>
                <div className="numberInputControlGroup">
                    <span
                        className="stepButton stepButton-left"
                        data-direction="-1"
                        onMouseDown={this.onStepButtonDown}
                    >
                        {stepButtonLeftText}
                    </span>
                    <input
                        id={id}
                        name={id}
                        value={value}
                        pattern={numericValuePattern}
                        onChange={this.onInputFieldChange}
                        onBlur={this.onInputFieldBlur}
                        onKeyUp={this.onInputFieldKeyUp}
                        onMouseDown={this.onInputFieldMouseDown}
                        onWheel={this.onInputFieldScroll}
                        ref={this.inputRef}
                    />
                    <span
                        className="stepButton stepButton-right"
                        data-direction="1"
                        onMouseDown={this.onStepButtonDown}
                    >
                        {stepButtonRightText}
                    </span>
                </div>
            </InputContainer>
        );
    }

    componentDidUpdate(prevProps: NumberInputProps) {
        if (this.props.value !== prevProps.value) {
            this.setState({ value: this.props.value });
        }
    }

    get inputElement() {
        return this.inputRef.current;
    }

    get validNumericValue() {
        return this.inputElement.value && !this.inputElement.validity.patternMismatch;
    }

    get numericValue() {
        if (this.validNumericValue) {
            return Number(this.state.value);
        }
        const value = parseInt((this.state.value as string), 10);

        return Number.isNaN(value) ? 0 : value;
    }

    setValue(value: number|string, allowString = false) {
        if (this.validNumericValue && !allowString) {
            value = valueBetween((value as number), this.props.min, this.props.max);
        }
        if (this.state.value === value) {
            return;
        }
        const onSetState = allowString ? noop : this.onSetValue;

        this.setState({ value }, onSetState);
    }

    private onSetValue = () => {
        this.props.onChange(this.numericValue, this.props.id);
    }

    private stepValue = () => {
        this.setValue(round(this.numericValue + this.props.step * this.stepDirection));
    }

    private stepValueByBuffer = throttle(() => {
        this.setValue(round(this.numericValue + this.valueIncrementBuffer * this.props.step * this.props.sensitivity));

        this.valueIncrementBuffer = 0;
    }, stepRate)

    private stepValueContinuously = () => {
        this.stepIntervalId = window.setInterval(this.stepValue, stepRate);
    }

    private onStepButtonDown = ({ currentTarget }: React.MouseEvent<HTMLSpanElement>) => {
        const targetElement = currentTarget as HTMLSpanElement;
        targetElement.addEventListener('mouseup', this.onStepButtonRelease);
        targetElement.addEventListener('mouseleave', this.onStepButtonRelease);

        this.stepDirection = Number(targetElement.dataset.direction) as -1|1;
        this.stepStartTimeoutId = window.setTimeout(this.stepValueContinuously, stepStartDelay);

        this.stepValue();
    }

    private onStepButtonRelease = ({ currentTarget }: MouseEvent) => {
        currentTarget.removeEventListener('mouseup', this.onStepButtonRelease);
        currentTarget.removeEventListener('mouseleave', this.onStepButtonRelease);

        window.clearTimeout(this.stepStartTimeoutId);
        window.clearInterval(this.stepIntervalId);
    }

    private onInputFieldChange = ({ currentTarget }: React.ChangeEvent<HTMLInputElement>) => {
        this.setValue(currentTarget.value, true);
    }

    private onInputFieldKeyUp = ({ key }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter' || key === 'Escape') {
            this.inputElement.blur();
        }
    }

    private onInputFieldBlur = (/* React.FocusEvent<HTMLInputElement> */) => {
        if (this.state.value === this.props.value || this.state.value === this.props.value.toString()) {
            return;
        }
        if (this.validNumericValue && this.numericValue >= this.props.min && this.numericValue <= this.props.max) {
            this.onSetValue();
        } else {
            this.setValue(this.numericValue);
        }
    }

    private onInputFieldMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
        if (this.inputElement === document.activeElement) {
            return;
        }
        e.preventDefault();

        this.inputElement.addEventListener('mouseup', this.onInputFieldFocus);
        this.inputElement.addEventListener('mousemove', this.onInputFieldInitialMouseMove);
    }

    private onInputFieldFocus = () => {
        this.inputElement.removeEventListener('mouseup', this.onInputFieldFocus);
        this.inputElement.removeEventListener('mousemove', this.onInputFieldInitialMouseMove);

        this.inputElement.focus();
    }

    private onInputFieldInitialMouseMove = (e: MouseEvent) => {
        this.inputElement.removeEventListener('mousemove', this.onInputFieldInitialMouseMove);
        this.inputElement.removeEventListener('mouseup', this.onInputFieldFocus);

        this.inputElement.parentElement.addEventListener('mouseup', this.onInputFieldMouseMoveFinish);
        this.inputElement.parentElement.addEventListener('mouseleave', this.onInputFieldMouseMoveFinish);
        this.inputElement.parentElement.addEventListener('mousemove', this.onInputFieldMouseMove);
        this.inputElement.parentElement.addEventListener('mousemove', this.stepValueByBuffer);

        this.onInputFieldMouseMove(e);
        this.stepValueByBuffer();
    }

    private onInputFieldMouseMoveFinish = () => {
        this.inputElement.parentElement.removeEventListener('mousemove', this.onInputFieldMouseMove);
        this.inputElement.parentElement.removeEventListener('mousemove', this.stepValueByBuffer);
        this.inputElement.parentElement.removeEventListener('mouseup', this.onInputFieldMouseMoveFinish);
        this.inputElement.parentElement.removeEventListener('mouseleave', this.onInputFieldMouseMoveFinish);
    }

    private onInputFieldMouseMove = ({ movementX }: MouseEvent) => {
        this.valueIncrementBuffer += movementX;
    }

    private onInputFieldScroll = (e: React.WheelEvent<HTMLInputElement>) => {
        // e.preventDefault();
        this.valueIncrementBuffer -= e.deltaY;
        this.stepValueByBuffer();
    }
}
