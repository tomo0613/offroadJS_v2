import Vehicle from './vehicle';
import cfg from '../config';

const stateValueLimits = {
    engineForceMin: -0.8, // reverse
    engineForceMax: 1,
    brakeForceMin: 0,
    brakeForceMax: 1,
    steeringValueMin: -cfg.vehicle.maxSteeringValue,
    steeringValueMax: cfg.vehicle.maxSteeringValue,
};

const defaultState = {
    engineForce: 0,
    brakeForce: 0,
    steeringValue: 0,
};

export type VehicleState = typeof defaultState;

export function initStateHandler(vehicle: Vehicle) {
    return new Proxy(defaultState, {
        set(state, prop: keyof VehicleState, value: number) {
            const currentValue = state[prop];
            const nextValue = valueBetween(value, stateValueLimits[`${prop}Min`], stateValueLimits[`${prop}Max`]);

            if (currentValue !== nextValue) {
                state[prop] = nextValue;
                vehicle.shouldUpdate = true;
            }

            return true;
        },
    });
}

function valueBetween(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}
