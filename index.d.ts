declare module "simple-performant-harmonic-oscillator";

export interface SpringConfig {
    bounciness?: number;
    speed?: number;
}

export interface InitialPositionConfig {
    fromValue: number;
    toValue: number;
}

export type SpringValueListener = (springValue: number) => void;
export type UnsubscribeFunction = () => void;

export default class Spring {
    constructor(springConfig?: SpringConfig, initialPosition?: InitialPositionConfig);

    setCurrentValue(value: number): void;
    setToValue(toValue: number): void;
    setBounciness(bounciness: number): void;
    setSpeed(speed: number): void;
    end(): void;

    onUpdate(callback: SpringValueListener): UnsubscribeFunction;
    onAtRest(callback: SpringValueListener): UnsubscribeFunction;
    onEnd(callback: () => void): UnsubscribeFunction;

    getLinkedSpring(offset?: number, springConfig?: SpringConfig): Spring;
}