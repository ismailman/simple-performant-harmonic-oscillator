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

    getCurrentValue(): number;
    setCurrentValue(value: number): void;
    setToValue(toValue: number): void;
    getToValue(): number;
    getVelocity(): number;
    setVelocity(value: number): void;
    clone(): Spring;
    setBounciness(bounciness: number): void;
    setSpeed(speed: number): void;
    setValueMapper(fn: (value: number_) => number): void;
    unsetValueMapper(): void;
    blockSpringFromResting(): UnsubscribeFunction;
    end(): void;

    onUpdate(callback: SpringValueListener): UnsubscribeFunction;
    onAtRest(callback: SpringValueListener): UnsubscribeFunction;
    onEnd(callback: () => void): UnsubscribeFunction;

    getLinkedSpring(offset?: number, springConfig?: SpringConfig): Spring;
}