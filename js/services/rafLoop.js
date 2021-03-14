export default class RAFLoop {
  constructor({ emitter }) {
    this.emitter = emitter;
    this.pauseLoop = false;
    this.loopFns = {};

    this.attachEvents();
    this.loop(0);
  }

  attachEvents() {
    this.emitter.on('rafloop.subscribe', this.subscribe);
    this.emitter.on('rafloop.unsubscribe', this.unsubscribe);
  }

  subscribe = (fn, cb) => {
    let token = '';
    do {
      token = (Math.random() + 1).toString(36).substring(2, 10);
    } while (this.loopFns.hasOwnProperty(token));

    this.loopFns[token] = fn;

    if (cb) {
      cb(token);
    }
  }

  unsubscribe = (token) => {
    if (this.loopFns.hasOwnProperty(token)) {
      delete this.loopFns[token];
    }
  }

  loop(timestamp) {
    if (this.pauseLoop) {
      return;
    }

    for (let key in this.loopFns) {
      this.loopFns[key](timestamp);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}
