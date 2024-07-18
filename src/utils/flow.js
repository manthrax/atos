import*as THREE from "three"
let {Vector3} = THREE;

export function Easing() {}
let {min, max, abs, sin, cos, PI} = Math;
let x = Math.pow
  , C = Math.sqrt
  , T = Math.sin
  , q = Math.cos
  , B = Math.PI
  , F = 1.70158
  , M = 1.525 * F
  , Q = 2 * B / 3
  , j = 2 * B / 4.5;
function N(t) {
    let e = 7.5625
      , n = 2.75;
    return t < 1 / n ? e * t * t : t < 2 / n ? e * (t -= 1.5 / n) * t + .75 : t < 2.5 / n ? e * (t -= 2.25 / n) * t + .9375 : e * (t -= 2.625 / n) * t + .984375
}
Object.assign(Easing, {
    InQuad: t=>t * t,
    OutQuad: t=>1 - (1 - t) * (1 - t),
    InOutQuad: t=>t < .5 ? 2 * t * t : 1 - x(-2 * t + 2, 2) / 2,
    InCubic: t=>t * t * t,
    OutCubic: t=>1 - x(1 - t, 3),
    InOutCubic: t=>t < .5 ? 4 * t * t * t : 1 - x(-2 * t + 2, 3) / 2,
    InQuart: t=>t * t * t * t,
    OutQuart: t=>1 - x(1 - t, 4),
    InOutQuart: t=>t < .5 ? 8 * t * t * t * t : 1 - x(-2 * t + 2, 4) / 2,
    InQuint: t=>t * t * t * t * t,
    OutQuint: t=>1 - x(1 - t, 5),
    InOutQuint: t=>t < .5 ? 16 * t * t * t * t * t : 1 - x(-2 * t + 2, 5) / 2,
    InSine: t=>1 - q(t * B / 2),
    OutSine: t=>T(t * B / 2),
    InOutSine: t=>-(q(B * t) - 1) / 2,
    InExpo: t=>0 === t ? 0 : x(2, 10 * t - 10),
    OutExpo: t=>1 === t ? 1 : 1 - x(2, -10 * t),
    InOutExpo: t=>0 === t ? 0 : 1 === t ? 1 : t < .5 ? x(2, 20 * t - 10) / 2 : (2 - x(2, -20 * t + 10)) / 2,
    InCirc: t=>1 - C(1 - x(t, 2)),
    OutCirc: t=>C(1 - x(t - 1, 2)),
    InOutCirc: t=>t < .5 ? (1 - C(1 - x(2 * t, 2))) / 2 : (C(1 - x(-2 * t + 2, 2)) + 1) / 2,
    InBack: t=>2.70158 * t * t * t - F * t * t,
    OutBack: t=>1 + 2.70158 * x(t - 1, 3) + F * x(t - 1, 2),
    InOutBack: t=>t < .5 ? x(2 * t, 2) * (2 * (M + 1) * t - M) / 2 : (x(2 * t - 2, 2) * ((M + 1) * (2 * t - 2) + M) + 2) / 2,
    InElastic: t=>0 === t ? 0 : 1 === t ? 1 : -x(2, 10 * t - 10) * T((10 * t - 10.75) * Q),
    OutElastic: t=>0 === t ? 0 : 1 === t ? 1 : x(2, -10 * t) * T((10 * t - .75) * Q) + 1,
    InOutElastic: t=>0 === t ? 0 : 1 === t ? 1 : t < .5 ? -x(2, 20 * t - 10) * T((20 * t - 11.125) * j) / 2 : x(2, -20 * t + 10) * T((20 * t - 11.125) * j) / 2 + 1,
    InBounce: t=>1 - N(1 - t),
    OutBounce: N,
    InOutBounce: t=>t < .5 ? (1 - N(1 - 2 * t)) / 2 : (1 + N(2 * t - 1)) / 2
})

class FlowInstance {

    constructor(fn) {
        this.fn = fn;
    }
    update(now=performance.now()) {
        //console.log('pnow', performance.now())
        if (typeof this.waitCondition == 'number') {
            if (now < this.waitCondition)
                return 0;
        } else if (typeof this.waitCondition == 'function')
            if (!this.waitCondition())
                return this.waitCondition;

        this.waitCondition = this.flow.next().value;
        if (typeof this.waitCondition == 'number')
            this.waitCondition += now;
        if (this.waitCondition === undefined)
            this.thenCb && this.thenCb()
        return this.waitCondition;
    }
    then(something) {
        this.thenCb = something;
    }
}
export class Flow {
    flows = [];
    waitCondition;
    constructor(fn) {
        this.fn = fn;
    }
    updateAll(now=performance.now()) {
        let fl = this.flows;
        let write = 0;
        for (let i = 0; i < fl.length; i++) {
            let f = fl[i];
            let wait = f.update(now);
            if (wait === undefined)
                write--;
            else
                (write !== i) && (fl[write] = fl[i]);
            write++;
        }
        fl.length = write;
    }
    /*
    start(target) {
        Flow.flows.push(this);
        this.flow = this.fn(...arguments)
        return this;
    }*/
    start(fn, target) {
        let fi = new FlowInstance(fn)
        this.flows.push(fi)
        fi.flow = fi.fn(...[...arguments].slice(1))
        return fi;
    }

    tweenVector3 = function({object, value='position', start, end, delay=0, duration=250, easing}) {
        this.start(function*({object, value, start, end, delay, duration, easing}) {
            let saveAutoUpdate = object.matrixAutoUpdate
            object.matrixAutoUpdate = true;
            let vEnd = end || new Vector3().copy(object[value]);
            let vStart = start || new Vector3().copy(Vector3.prototype.set.call(object[value], .01, .01, .01));
            yield delay;
            let tStart = performance.now();
            let tNow = tStart;
            while (tNow < (tStart + duration)) {
                let alpha = (tNow - tStart) / duration;
                Vector3.prototype.lerpVectors.call(object[value], vStart, vEnd, easing ? easing(alpha) : alpha);
                yield 0;
                tNow = performance.now();
            }
            Vector3.prototype.copy.call(object[value], vEnd);
            object.updateMatrix();
            object.matrixAutoUpdate = saveAutoUpdate;
        }, {
            object,
            value,
            start,
            end,
            delay,
            duration,
            easing
        })
    }
}
Object.assign(Flow, Easing)
