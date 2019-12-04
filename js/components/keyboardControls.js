export default class KeyboardControls {
  constructor({ emitter }) {
    this.emitter = emitter;

    this.arrowKeys = {
      65: 'left',
      68: 'right',
      87: 'up',
      83: 'down',
      37: 'left',
      39: 'right',
      38: 'up',
      40: 'down'
    };

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('track.play', this.bindKeys.bind(this));
    this.emitter.on('track.stop', this.unbindKeys.bind(this));
  }

  bindKeys() {
    if (!this._bound) {
      this._bound = this.checkKey.bind(this);
      document.addEventListener('keydown', this._bound, false);
    }
  }

  unbindKeys() {
    document.removeEventListener('keydown', this._bound, false);
    this._bound = null;
  }

  checkKey(e) {
    const keyCode = e.keyCode || e.which;
    switch(keyCode) {
      case 32:
        this.emitter.emit('track.stop');
        break;
      default:
        this.emitter.emit('tap.arrow', this.arrowKeys[keyCode]);
    }
  }
}
