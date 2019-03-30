let springsToUpdateInNextFrame = [];
let nextRAFCallId;

const REST_THRESHOLD = 0.01;

export default class Spring {
    constructor(config, startingPositions = { fromValue: 0, toValue: 0 }) {
        this._tightness = 1/(config.bounciness || 1);
        this._slowness = 100/(config.speed || 1);
        
        this._springEquation 
            = getSpringEquation (
                this._tightness,
                this._slowness
            );
        
        // state info
        this._currentValue = startingPositions.fromValue == null ?  0 : startingPositions.fromValue;
        this._toValue = startingPositions.toValue == null ? 1 : startingPositions.toValue;
        this._velocity = 0;

        this._updateListeners = [];
        this._atRestListeners = [];
        this._onEndListeners = [];

        addSpringToUpdate(this);
    }

    setCurrentValue(value) {
        this._currentValue = value;
        addSpringToUpdate(this);
    }

    setToValue(value) {
        this._toValue = value;
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
        if (springsToUpdateInNextFrame.length === 0) cancelAnimationFrame(nextRAFCallId);
    }

    getLinkedSpring(offset, springConfig) {
        const _offset = offset || 0;      
        const spring = new Spring(springConfig || {
            bounciness: 1/this._tightness,
            speed: 100/this._slowness
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

    // use RK4 (https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods#The_Runge%E2%80%93Kutta_method)
    // with code ported from http://doswa.com/2009/01/02/fourth-order-runge-kutta-numerical-integration.html
    _advance(deltaTime) {
        const [displacement, velocity] = 
                rk4 (
                    deltaTime,
                    [
                        this._toValue - this._currentValue,
                        this._velocity
                    ],
                    this._springEquation
                );
        this._currentValue = this._toValue - displacement;
        this._velocity = velocity;

        const isAtRest = Math.abs(this._currentValue - this._toValue) <= REST_THRESHOLD &&
                            Math.abs(this._velocity) <= REST_THRESHOLD;

        if(isAtRest){
            this._currentValue = this._toValue; //just round to the toValue
        }

        for(let ii=0; ii<this._updateListeners.length; ii++){
            this._updateListeners[ii](this._currentValue);
        }

        if(isAtRest){
            for(let ii=0; ii<this._atRestListeners.length; ii++){
                this._atRestListeners[ii](this._currentValue);
            }
        }
        
        return isAtRest;
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
    const deltaTime = Math.min((Date.now() - timeOfLastUpdate), 33) // cap delta time to equivalent of 30 fps;
    if(deltaTime === 0) {
        nextRAFCallId = requestAnimationFrame(updateSprings);
        return;
    };
    const springsToUpdate = springsToUpdateInNextFrame;
    springsToUpdateInNextFrame = [];
    for (let ii = 0; ii < springsToUpdate.length; ii++) {
        const isAtRest = springsToUpdate[ii]._advance(deltaTime)
        if (!isAtRest) addSpringToUpdate(springsToUpdate[ii]);
    }
}

function rk4(deltaTime, [displacement, vel], func) {
    const result_1 = func(deltaTime, [displacement, vel]);
    const [vel_1, accel_1] = [result_1[0], result_1[1]] ;

    const result_2 = func(deltaTime, [displacement + 0.5*vel_1, vel + 0.5*accel_1]);
    const [vel_2, accel_2] = [result_2[0], result_2[1]];

    const result_3 = func(deltaTime, [displacement + 0.5*vel_2, vel + 0.5*accel_2]);
    const [vel_3, accel_3] = [result_3[0], result_3[1]];

    const result_4 = func(deltaTime, [displacement+vel_3, vel + accel_3]);
    const [vel_4, accel_4] = [result_4[0], result_4[1]];

    return [
        displacement + (vel_1 + 2*(vel_2 + vel_3) + vel_4)/6,
        vel + (accel_1 + 2*(accel_2 + accel_3) + accel_4)/6
    ];
}

function getSpringEquation(tightness, slowness){    
    return function(deltaTime, [displacement, vel]) {
        const trueDelta = deltaTime/slowness;
        return [trueDelta*vel, trueDelta*(-displacement - tightness*vel)];
    };
}