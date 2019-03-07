# Simple Performant Harmonic Oscillator
A highly optimized physics spring behavior calculator. This code is largely based off of Wobble [https://github.com/skevy/wobble]. There's a few key differences between the code in this repo and the code in Wobble:

1. fewer options. Overdamping is not supported in this library, just critical damping and underdamping.
2. little to no error checking. The main config properties of mass/stiffness/damping are checked to make sure they're above 0 but that's it.
3. derived numbers (zeta, omega, etc) are calculated once during construction, not every tick like in Wobble
4. after a spring is instantiated only the from and to values can be updated
5. all springs are updated in the same RAF callback instead of each spring scheduling its own
6. different API.

