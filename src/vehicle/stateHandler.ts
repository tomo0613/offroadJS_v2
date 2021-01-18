import cfg from '../config';
import { valueBetween } from '../utils';
import Vehicle from './Vehicle';

const stateValueLimits = {
    engineForceMin: -cfg.vehicle.maxEngineForce,
    engineForceMax: cfg.vehicle.maxEngineForce,
    brakeForceMin: 0,
    brakeForceMax: cfg.vehicle.maxBrakeForce,
    steeringAngleMin: -cfg.vehicle.maxSteeringAngle,
    steeringAngleMax: cfg.vehicle.maxSteeringAngle,
};

const defaultState = {
    engineForce: 0,
    brakeForce: 0,
    steeringAngle: 0,
};

export type VehicleState = typeof defaultState;

export function initStateHandler(vehicle: Vehicle) {
    return new Proxy(defaultState, {
        set(state, prop: keyof VehicleState, value: number) {
            const currentValue = state[prop];
            const nextValue = valueBetween(value, stateValueLimits[`${prop}Min`], stateValueLimits[`${prop}Max`]);

            if (currentValue !== nextValue) {
                state[prop] = nextValue;
            }

            return true;
        },
    });
}
