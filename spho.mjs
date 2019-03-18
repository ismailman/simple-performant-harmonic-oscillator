let springsToUpdateInNextFrame = [];
let nextRAFCallId;

export default class Spring {
    constructor(config, startingPositions = { fromValue: 0, toValue: 0 }) {
        // config params
        this._damping = config.damping == null ? 10 : config.damping;
        this._mass = config.mass == null ? 1 : config.mass;
        this._stiffness = config.stiffness == null ? 100 : config.stiffness;
        this._allowOvershooting = config.allowOvershooting == null ? true : config.allowOvershooting;
        this._restVelocityThreshold = config.restVelocityThreshold || 0.001;
        this._restDisplacementThreshold = config.restDisplacementThreshold || 0.001;

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

        this._initialVelocity = 0;
        this._velocity = 0;

        this._updateListeners = [];
        this._atRestListeners = [];
        this._onEndListeners = [];

        //derived numbers that are used across simulation ticks
        this._zeta = Math.min(this._damping / (2 * Math.sqrt(this._stiffness * this._mass)), 1); // damping ratio (dimensionless)
        this._omega0 = Math.sqrt(this._stiffness / this._mass) / 1000; // undamped angular frequency of the oscillator (rad/ms)
        this._omega1 = this._omega0 * Math.sqrt(1.0 - this._zeta * this._zeta); // exponential decay

        addSpringToUpdate(this);
    }

    setFromValue(value) {
        const velocity = value - this._currentValue;
        this._currentValue = value;
        this._reset();
        this._initialVelocity = velocity;

        addSpringToUpdate(this);
    }

    setToValue(value) {
        const velocity = this._velocity;
        this._toValue = value;
        this._reset();
        this._initialVelocity = velocity;
        
        addSpringToUpdate(this);
    }

    end() {
        this._updateListeners.length = 0;
        this._atRestListeners.length = 0;

        const onEndListeners = [...this._onEndListeners];
        for(let ii=0; ii<onEndListeners.length; ii++){
            onEndListeners[ii]();
        }
        this._onEndListeners.length = 0;

        const index = springsToUpdateInNextFrame.indexOf(this);
        if (index > -1) springsToUpdateInNextFrame.splice(index, 1);
        if (springsToUpdateInNextFrame.length === 0) clearRequestAnimationFrame(nextRAFCallId);
    }

    getLinkedSpring(offset, springConfig) {
        const _offset = offset || 0;      
        const spring = new Spring(springConfig || {
            mass: this._mass,
            stiffness: this._stiffness,
            damping: this._damping,
            allowOvershootieng: this._allowOvershooting,
            restVelocityThreshold: this._restVelocityThreshold,
            restDisplacementThreshold: this._restDisplacementThreshold
        }, {
            fromValue: this._currentValue + _offset,
            toValue: this._currentValue + _offset
        });

        const oldSetTo = spring.setToValue.bind(spring);
        this.onUpdate(newValue => oldSetTo(newValue + _offset));
        this.onEnd(() => spring.end());

        spring.setToValue = () => {
            console.log('tried to set the toValue of a linked spring. Won\'t work')
        };

        return spring;
    }

    onUpdate(fn) {
        return addListener(this._updateListeners, fn);
    }

    onAtRest(fn) {
        return addListener(this._atRestListeners, fn);
    }

    onEnd(fn) {
        return addListener(this._onEndListeners, fn);
    }

    _advance(deltaTime) {
        if(deltaTime === 0) return false;

        const previousValue = this._currentValue;
        this._simulationTime += deltaTime;

        const negativeInitialVelocity = -this._initialVelocity;

        if (this._zeta < 1) {
            // Under damped, will overshoot
            this._currentValue =
                this._toValue -
                Math.exp(-this._zeta * this._omega0 * this._simulationTime) *
                ((negativeInitialVelocity + this._zeta * this._omega0 * this._initialDisplacement) / this._omega1 * Math.sin(this._omega1 * this._simulationTime) +
                    this._initialDisplacement * Math.cos(this._omega1 * this._simulationTime));
        }
        else if (this._zeta === 1) {
            // Critically damped, will asymptotically arrive at toValue
            this._currentValue = 
                this._toValue - 
                Math.exp(-this._omega0 * this._simulationTime) * 
                (this._initialDisplacement + (negativeInitialVelocity + this._omega0 * this._initialDisplacement) * this._simulationTime);
        }

        // if we don't allow overshooting then clamp to toValue
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

        this._velocity = (this._currentValue - previousValue)/deltaTime;

        const isAtRest = Math.abs(this._currentValue - this._toValue) <= this._restDisplacementThreshold &&
                            Math.abs(this._velocity) <= this._restVelocityThreshold;

        if(isAtRest){
            for(let ii=0; ii<this._atRestListeners.length; ii++){
                this._atRestListeners[ii](currentValue);
            }
            this._reset();
        }
        
        return isAtRest;
    }

    _reset() {
        this._simulationTime = 0;
        this._fromValue = this._currentValue;
        this._initialDisplacement = this._toValue - this._fromValue;
        this._velocity = 0;
        this._initialVelocity = 0;
    }
}

function addListener(listenerArray, fn){
    // we put the adding of the listener in a promise so that the addition
    // happens at the end of the event loop. This is to guard against the case where
    // an update or atRest listener get added as a result of another update or atRest listener
    // this makes sure the new listener won't get executed until the next animation cycle
    const promise = Promise.resolve();
    promise.then(() => {
        listenerArray.push(fn);
    });
    
    return function(){
        promise.then(() => {
            const index = listenerArray.indexOf(fn);
            if(index > -1) listenerArray.splice(index, 1);
        });
    };
}

let timeOfLastUpdate;
function addSpringToUpdate(_spring) {
    if (springsToUpdateInNextFrame.indexOf(_spring) === -1) {
        springsToUpdateInNextFrame.push(_spring);
        if (springsToUpdateInNextFrame.length === 1) {
            timeOfLastUpdate = Date.now();
            nextRAFCallId = requestAnimationFrame(updateSprings);
        }
    }
}

function updateSprings() {
    const deltaTime = Date.now() - timeOfLastUpdate;
    const springsToUpdate = springsToUpdateInNextFrame;
    springsToUpdateInNextFrame = [];
    for (let ii = 0; ii < springsToUpdate.length; ii++) {
        const isAtRest = springsToUpdate[ii]._advance(deltaTime)
        if (!isAtRest) addSpringToUpdate(springsToUpdate[ii]);
    }
}