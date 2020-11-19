import { round, throttle, valueBetween } from '../../utils';
import { Input } from './input';

interface Props {
    label: string;
    defaultValue?: number;
    step?: number;
    min?: number;
    max?: number;
}

const numericValuePattern = '^-?((?!00)\\d+)(\\.\\d+)?$';
const stepStartDelay = 200;
const stepRate = 100;
const mouseMoveValueMultiplier = 0.1;

export class NumberInput extends Input {
    step: number;
    min: number;
    max: number;
    numberInputControlGroup = document.createElement('div');
    private stepDirection: -1|1;
    private stepIntervalId = 0;
    private stepStartTimeoutId = 0;
    private valueIncrementBuffer = 0;

    constructor({ label, defaultValue = 0, step = 0.01, min = -Infinity, max = Infinity }: Props) {
        super(label);

        this.step = step;
        this.min = min;
        this.max = max;

        const inputElement = this.inputElement as HTMLInputElement;
        inputElement.pattern = numericValuePattern;
        inputElement.value = String(defaultValue);

        inputElement.addEventListener('mousedown', this.onInputFieldMouseDown);

        this.numberInputControlGroup.classList.add('numberInputControlGroup');
        this.containerElement.appendChild(this.numberInputControlGroup);

        this.numberInputControlGroup.appendChild(this.createStepButton('left', '◄'));
        this.numberInputControlGroup.appendChild(inputElement);
        this.numberInputControlGroup.appendChild(this.createStepButton('right', '►'));
    }

    get value() {
        return Number(this.inputElement.value);
    }

    set value(value: number) {
        this.inputElement.value = String(valueBetween(value, this.min, this.max));
    }

    setValue(value: number|string) {
        this.inputElement.value = String(valueBetween(Number(value), this.min, this.max));
    }

    private stepValue = () => {
        this.value = round(this.value + this.step * this.stepDirection);
        this.valueChangeListener(this.inputElement.value);
    }

    private stepValueOnMouseMove = throttle(() => {
        this.value = round(this.value + this.valueIncrementBuffer * mouseMoveValueMultiplier);
        this.valueChangeListener(this.inputElement.value);

        this.valueIncrementBuffer = 0;
    }, stepRate)

    private stepValueContinuously = () => {
        this.stepIntervalId = window.setInterval(this.stepValue, stepRate);
    }

    private createStepButton(direction: 'left'|'right', label: string) {
        const stepButton = document.createElement('span');
        stepButton.innerText = label;
        stepButton.classList.add('stepButton', `stepButton-${direction}`);
        stepButton.dataset.direction = direction === 'left' ? '-1' : '1';

        stepButton.addEventListener('mousedown', this.onStepButtonDown);

        return stepButton;
    }

    private onStepButtonDown = ({ currentTarget }: MouseEvent) => {
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

    private onInputFieldMouseDown = (e: MouseEvent) => {
        if (this.inputElement === document.activeElement) {
            return;
        }
        e.preventDefault();

        this.inputElement.addEventListener('mouseup', this.onInputFieldFocus);
        this.inputElement.addEventListener('mousemove', this.onInputFieldMouseMove);
        this.inputElement.addEventListener('mousemove', this.stepValueOnMouseMove);
    }

    private onInputFieldFocus = () => {
        this.inputElement.removeEventListener('mouseup', this.onInputFieldFocus);
        this.inputElement.removeEventListener('mousemove', this.onInputFieldMouseMove);
        this.inputElement.removeEventListener('mousemove', this.stepValueOnMouseMove);

        this.inputElement.focus();
    }

    private onInputFieldMouseMoveFinish = () => {
        this.inputElement.removeEventListener('mousemove', this.onInputFieldMouseMove);
        this.inputElement.removeEventListener('mousemove', this.stepValueOnMouseMove);
        this.inputElement.removeEventListener('mouseup', this.onInputFieldMouseMoveFinish);
        this.inputElement.removeEventListener('mouseleave', this.onInputFieldMouseMoveFinish);
    }

    private onInputFieldMouseMove = ({ movementX }: MouseEvent) => {
        this.inputElement.removeEventListener('mouseup', this.onInputFieldFocus);

        this.inputElement.addEventListener('mouseup', this.onInputFieldMouseMoveFinish);
        this.inputElement.addEventListener('mouseleave', this.onInputFieldMouseMoveFinish);

        this.valueIncrementBuffer += movementX;
    }
}
