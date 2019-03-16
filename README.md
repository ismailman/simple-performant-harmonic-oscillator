# Simple Performant Harmonic Oscillator
A highly optimized physics spring behavior calculator. This code is largely based off of [Wobble](https://github.com/skevy/wobble). There's some key differences between the code in this repo and the code in Wobble:

1. fewer options. Overdamping is not supported in this library, just underdamping (spring will overshoot), and critical damping (spring won't overshoot or undershoot, it'll asymptotically reach the toValue).
2. little to no error checking. The main config properties of mass/stiffness/damping are checked to make sure they're above 0 but that's it.
3. derived numbers (zeta, omega, etc) are calculated once during construction, not every tick like in Wobble
4. after a spring is instantiated only the from and to values can be updated
5. all springs are updated in the same requestAnimationFrame callback instead of each spring scheduling its own
6. different API for registering event listeners

One spring demo - https://omar.dev/simple-performant-harmonic-oscillator/demos/basicSpring.html

Multiple springs demo - https://omar.dev/simple-performant-harmonic-oscillator/demos/multipleSprings.html

# API

#### `new Spring(config: SpringConfig, initialPosition: InitialPosition)`

Initialize a new spring with a given spring configuration. Whenever the from and to values are different the spring will be in motion. This means if the initial values
are different the spring will be updating right away. And if there's an update
to the "from" or "to" of a spring instance and there's a difference between the two values then the spring will be active.

## SpringConfig

#### `stiffness: number`

The spring stiffness coefficient. Defaults to `100`.

#### `damping: number`

Defines how the spring’s motion should be damped due to the forces of friction. Defaults to `10`.

#### `mass: number`

The mass of the object attached to the end of the spring. Defaults to `1`.

#### `allowOvershooting: boolean`

True when overshooting is allowed, false when it is not. Defaults to `false`.

## InitialPosition

#### `fromValue: number`

Starting value of the animation. Defaults to `0`.

#### `toValue: number`

Ending value of the animation. Defaults to `1`.


## Methods

#### `setFromValue(fromValue: number): void`

Sets the spring's from value.

#### `setToValue(toValue: number): void`

Sets the spring's to value.

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

By default the follow spring's configuration (mass, stiffness and dampness) will match that of the anchor spring. But you can override this behavior by passing in a different SpringConfig.
