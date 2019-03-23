declare module "simple-performant-harmonic-oscillator";

export interface SpringConfig {
    stiffness?: number;
    damping?: number;
    mass?: number;
    allowOvershooting?: boolean;
    restVelocityThreshold?: number;
    restDisplacementThreshold?: number;
}

export interface InitialPositionConfig {
    fromValue: number;
    toValue: number;
}

export type SpringValueListener = (springValue: number) => void;
export type UnsubscribeFunction = () => void;

export default class Spring {
    constructor(springConfig?: SpringConfig, initialPosition?: InitialPositionConfig);

    setFromValue(fromValue: number): void;
    setToValue(toValue: number): void;
    end(): void;

    onUpdate(callback: SpringValueListener): UnsubscribeFunction;
    onAtRest(callback: SpringValueListener): UnsubscribeFunction;
    onEnd(callback: () => void): UnsubscribeFunction;

    getLinkedSpring(offset?: number, springConfig?: SpringConfig): Spring;
}