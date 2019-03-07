(function () {

    const REST_VELOCITY_THRESHOLD = 0.001;
    const REST_DISPLACEMENT_THRESHOLD = 0.001;

    let springsToUpdateInNextFrame = [];
    let nextRAFCallId;

    class Spring {
        constructor(config, startingPositions = { fromValue: 0, toValue: 1 }) {
            // config params
            this._damping = config.damping == null ? 10 : config.damping;
            this._mass = config.mass == null ? 1 : config.mass;
            this._stiffness = config.stiffness == null ? 100 : config.stiffness;
            this._allowOvershooting = config.allowOvershooting == null ? false : config.allowOvershooting;

            if (this._damping < 0) throw new Error('Damping value must be greater than 0');
            if (this._mass < 0) throw new Error('Mass must be greater than 0');
            if (this._stiffness < 0) throw new Error('Stiffness must be greater than 0');
            
            //starting positions
            this._fromValue = startingPositions.fromValue == null ?  0 : startingPositions.fromValue;
            this._toValue = startingPositions.toValue == null ? 1 : startingPositions.toValue;
            this._initialDisplacement = this._toValue - this._fromValue; // initial displacement of the spring at t = 0
            this._currentValue = this._fromValue;

            //timing info
            this._simulationTime = 0;
            this._lastUpdateTime = Date.now();

            this._initialVelocity = 0;
            this._velocity = 0;

            this._hasMoved = false;

            this._updateListeners = [];
            this._atRestListeners = [];

            //derived numbers that are used across simulation ticks
            this._zeta = Math.min(this._damping / (2 * Math.sqrt(this._stiffness * this._mass)), 1); // damping ratio (dimensionless)
            this._omega0 = Math.sqrt(this._stiffness / this._mass) / 1000; // undamped angular frequency of the oscillator (rad/ms)
            this._omega1 = this._omega0 * Math.sqrt(1.0 - this._zeta * this._zeta); // exponential decay
            this._omega2 = this._omega0 * Math.sqrt(this._zeta * this._zeta - 1.0); // frequency of damped oscillation

            addSpringToUpdate(this);
        }

        advance(deltaTime, absoluteTime) {
            if(deltaTime === 0) return false;
            const previousValue = this._currentValue;
            this._simulationTime += deltaTime;
            this._lastUpdateTime = absoluteTime;

            const negativeInitialVelocity = -this._initialVelocity;

            if (this._zeta < 1) {
                // Under damped
                this._currentValue =
                    this._toValue -
                    Math.exp(-this._zeta * this._omega0 * this._simulationTime) *
                    ((negativeInitialVelocity + this._zeta * this._omega0 * this._initialDisplacement) / this._omega1 * Math.sin(this._omega1 * this._simulationTime) +
                        this._initialDisplacement * Math.cos(this._omega1 * this._simulationTime));
            }
            else if (this._zeta === 1) {
                // Critically damped
                this._currentValue = 
                    this._toValue - 
                    Math.exp(-this._omega0 * this._simulationTime) * 
                    (this._initialDisplacement + (negativeInitialVelocity + this._omega0 * this._initialDisplacement) * this._simulationTime);
            }

            if(
                !this._allowOvershooting && (
                    (this._fromValue > this._toValue && this._currentValue < this._toValue) ||
                    (this._fromValue < this._toValue && this._currentValue > this._toValue)
                )
             ) {
                this._currentValue = this._toValue;
            }

            for(let ii=0; ii<this._updateListeners.length; ii++){
                this._updateListeners[ii](this._currentValue);
            }

            this._velocity = this._currentValue - previousValue;

            const isAtRest = Math.abs(this._currentValue - this._toValue) <= REST_DISPLACEMENT_THRESHOLD ||
                                Math.abs(this._velocity) <= REST_VELOCITY_THRESHOLD;

            if(isAtRest){
                if(this._hasMoved){
                    for(let ii=0; ii<this._atRestListeners.length; ii++){
                        this._atRestListeners[ii](currentValue);
                    }
                    this._reset();
                }
            }
            else{
                this._hasMoved = true;
            }
            
            return isAtRest;
        }

        forceAdvance() {
            const now = Date.now();
            this.advance(now - this._lastUpdateTime, now);
        }

        end() {
            this._updateListeners.length = 0;
            this._atRestListeners.length = 0;

            const index = springsToUpdateInNextFrame.indexOf(this);
            if (index > -1) springsToUpdateInNextFrame.splice(index, 1);
            if (springsToUpdateInNextFrame.length === 0) clearRequestAnimationFrame(nextRAFCallId);
        }

        setFromValue(value) {
            this.forceAdvance();            

            this._currentValue = value;
            this._reset();

            addSpringToUpdate(this);
        }

        setToValue(value) {
            this.forceAdvance();

            this._toValue = value;
            this._reset();
            
            addSpringToUpdate(this);
        }

        onUpdate(fn) {
            this._updateListeners.push(fn);

            return function () {
                const index = this._updateListeners.indexOf(fn);
                if (index > -1) this._updateListeners.splice(index, 1);
            }
        }

        onAtRest(fn) {
            this._atRestListeners.push(fn);

            return function () {
                const index = this._atRestListeners.indexOf(fn);
                if (index > -1) this._atRestListeners.splice(index, 1);
            }
        }

        _reset() {
            this._simulationTime = 0;
            this._fromValue = this._currentValue;
            this._initialDisplacement = this._toValue - this._fromValue;
            this._velocity = 0;
            this._initialVelocity = 0;
            this._hasMoved = false;
        }
    }

    function addSpringToUpdate(_spring) {
        if (springsToUpdateInNextFrame.indexOf(_spring) === -1) {
            springsToUpdateInNextFrame.push(_spring);
            if (springsToUpdateInNextFrame.length === 1) {
                const timeOfLastUpdate = Date.now();
                nextRAFCallId = requestAnimationFrame(() => updateSprings(Date.now() - timeOfLastUpdate, timeOfLastUpdate));
            }
        }
    }

    function updateSprings(deltaTime, now) {
        const springsToUpdate = springsToUpdateInNextFrame;
        springsToUpdateInNextFrame = [];
        for (let ii = 0; ii < springsToUpdate.length; ii++) {
            const isAtRest = springsToUpdate[ii].advance(deltaTime, now)
            if (!isAtRest) addSpringToUpdate(springsToUpdate[ii]);
        }
    }

    // if we're in a build context then export, otherwise expose spring function globally
    if(typeof module !== 'undefined' && module.exports) module.exports = spring;
    else (window || global).Spring = Spring;

})();