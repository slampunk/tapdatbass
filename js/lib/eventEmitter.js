export default class EventEmitter {
  constructor(props) {

    let _listener = {};
    Object.defineProperty(this, 'listener', {
      get: () => _listener
    });
  }

  on(ev, fnObj) {
    fnObj = typeof fnObj == 'function' ? {fn: fnObj, scope: null} : fnObj;

    let tokens =
      ev.split(',')
        .map(this._subscribe(fnObj));

    if (tokens.length === 1) {
      return tokens[0];
    }

    return tokens;
  }

  _subscribe = (fnObj) => (ev) => {
    ev = ev.trim();
    if (!this.listener[ev]) {
      this.listener[ev] = {};
    }

    let token = '';
    do {
      token = (Math.random() + 1).toString(36).substring(2, 10);
    } while (!!this.listener[ev][token]);

    this.listener[ev][token] = fnObj;
    return token;
  }

  off(ev, token) {
    ev.split(',')
      .map(singleEv => singleEv.trim())
      .forEach(e => {
        if (this.listener[e] && this.listener[e][token]) {
          delete this.listener[e][token];
        }
      });
  }

  emit() {
    let args = Array.prototype.slice.call(arguments);
    let ev = args.splice(0, 1)[0];

    if (!this.listener[ev]) {
      return;
    }

    for (let token in this.listener[ev]) {
      try {
        let fn = this.listener[ev][token].fn;
        let scope = this.listener[ev][token].scope || null;
        fn.apply(scope, args);
      } catch(e) {
        console.log(e, ev, this.listener[ev]);
      }
    }
  }
}
