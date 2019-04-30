# Simple Performant Harmonic Oscillator (SPHO)
A highly optimized physics spring behavior calculator. This is inspired by [Wobble](https://github.com/skevy/wobble) for focusing on just one thing: simulating a damped harmonic oscillator - i.e. a spring. SPHO differs from Wobble in some very key ways though and focuses on performance at the expense of error checking and configurability. Also the API has been changed to be more intuitive (IMHO).


One spring demo - https://omar.dev/simple-performant-harmonic-oscillator/demos/basicSpring.html

Multiple springs demo - https://omar.dev/simple-performant-harmonic-oscillator/demos/multipleSprings.html

# API

#### `new Spring(config?: SpringConfig, initialPosition?: InitialPosition)`

Initialize a new spring with a given spring configuration. Whenever the from and to values are different the spring will be in motion. This means if the initial values are different the spring will be updating right away. And if there's an update "to" of a spring instance and there's a difference between the current
spring value and the new to value the spring will be active.

## SpringConfig

These configuration parameters differ from the usual "damping" "frictin" "stiffness" "mass" that you see in other spring libraries. The reason SPHO uses another type of configuration (`bounciness` and `speed`) is that I found these a lot more intuitive to understand and work with.

#### `bounciness: number`

Determines how "bouncy" the spring is. Where bouncy is how much the spring will overshoot as it tries to get to the target value. The higher the number the more oscillations the spring will experience before settling. The default is `1` which gives a good amount of bounce. A value of `0.75` will give almost no bounce (usually just 1 small one) and `0.5` will give no bounce at all. Real values Between `1` and `2` (i.e. `1.25`, `1.5`) give good bounciness that is still usable in a regular UI.

#### `speed: number`

Defines how "fast" the spring moves. Low values = low speed, and high values = high speed. The default is `1` which is a medium speed. `2` is considered fast and anything above that starts looking silly. For slower speeds `0.5` to `0.75` is a good range. Once you start going below `0.5` that's probably too slow to be useful in most cases.

## InitialPosition

#### `fromValue: number`

Starting value of the animation. Defaults to `0`.

#### `toValue: number`

Ending value of the animation. Defaults to `1`.


## Methods

#### `getCurrentValue(): number`

Gets the spring's current value.

#### `setCurrentValue(value: number): void`

Sets the spring's current value.

#### `getToValue(): number`

Gets the spring's to value that it's trying to reach (or has reached).

#### `setToValue(value: number): void`

Sets the spring's to value.

#### `getVelocity(): number`

Gets the spring's current velocity.

#### `setVelocity(value: number): void`

Sets the spring's velocity

#### `clone(): Spring`

Returns a new spring that has the same toValue, and starts the spring at the original spring's current value and velocity. No listeners are transferred over.

#### `setBounciness(bounciness: number): void`

Sets the spring's bounciness.

#### `setSpeed(speed: number): void`

Sets the spring's speed.

#### `setValueMapper(fn: (value: number) => number): void`

When set, makes it so that when onUpdate and onAtRest listeners are called the valueMapper will be called first, and the resulting value will get passed to the listener functions. This does not change the underlying toValue and currentValues at all. This is useful if you want to "normalize" different springs. For example if you have two springs, one will go from 0 to 100, and one will go from 0-255 if you want those springs to complete at the same time, then you can set the from and to value to 0 and 1, and then use the valueMapper to interpolate along those original ranges.

#### `unsetValueMapper(): void`

Remove the valueMapper so original behavior is restored.

#### `blockSpringFromResting(): () => void`

Block the spring from calling onRest callbacks. Returns a callback that allows onRest callbacks to be called, and if spring is at a rest state then will call those callbacks synchronously.

#### `end(): void`

Stops the spring and removes all listeners.

#### `onUpdate(callback: (springValue: number) => void): () => void`

Register a callback that will be called each time the spring value is updated. The callback will be called with the new value of the spring. Returns a method, that when invoked will unregister the callback.

#### `onAtRest(callback: (springValue: number) => void): () => void`

Register a callback that will be called each time the spring comes to a "resting" position after it has moved. The callback will be called with the toValue of the spring. Returns a method, that when invoked will unregister the callback.

#### `onEnd(callback: () => void): () => void`

Register a callback that will be called when the spring has been ended (i.e. .end() was called).  Returns a method, that when invoked will unregister the callback.

#### `getLinkedSpring(offset: number, springConfig: SpringConfig): Spring`

Returns a new "follow" spring that is "linked" to the spring you called the method on the "anchor" spring. What this means is that the starting point of the follow spring is set to the current value of the anchor spring. Whenever the current position of the anchor spring is updated that will set the toValue of the follow spring. This means that you can't manually set the toValue on the follow spring (the code makes sure this won't happen). 

You can have the follow spring come to a different resting state with the "offset". The toValue of the follow spring is anchor spring's current value + offset. By default offset is 0.

By default the follow spring's configuration (bounciness, speed) will match that of the anchor spring. But you can override this behavior by passing in a different SpringConfig.
