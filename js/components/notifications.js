import { createSvgElement } from '../lib/utils.js';

export default class Notifications {
  constructor({ emitter }) {
    this.emitter = emitter;

    this.perfectText = '';
    this.goodText = '';
    this.okText = '';
    this.booText = '';

    this.msgText = {};

    this.throttleTimeout = null;
    this.doMsgUpdate = true;

    this.notifyElement = document.querySelector('.notification');
    this.attachEvents();
    this.init();
  }

  attachEvents() {
    this.emitter.on('tap.message', this.setMessage.bind(this));
  }

  init() {
    this.perfectText = this.getPerfectText();
    this.booText = this.getBooText();

    this.msgText = {
      'perfect!': {
        text: this.perfectText,
        className: 'perfect'
      },
      good: {
        text: this.goodText,
        className: 'good'
      },
      ok: {
        text: this.okText,
        className: 'ok'
      },
      'boo!': {
        text: this.booText,
        className: 'boo'
      }
    };
  }

  getPerfectText() {
    const WIDTH = this.notifyElement.clientWidth;
    const HEIGHT = this.notifyElement.clientHeight;
    const svg = createSvgElement('svg', {
      width: WIDTH,
      height: HEIGHT
    });
    const path = createSvgElement('path', {
      fill: 'transparent',
      id: 'perfectPath',
      d: `M 0 ${HEIGHT} C ${WIDTH / 4} ${ HEIGHT / 2 } ${3 * WIDTH / 4} ${ HEIGHT / 2 } ${WIDTH} ${HEIGHT}`
    });
    const text = createSvgElement('text', {
      width: WIDTH,
      x: WIDTH / 6
    });
    const textPath = createSvgElement('textPath', {
      'xlink:href': '#perfectPath'
    });
    textPath.textContent = 'perfect!';
    text.appendChild(textPath);
    svg.appendChild(path);
    svg.appendChild(text);

    return svg.outerHTML;
  }

  getBooText() {
    const WIDTH = this.notifyElement.clientWidth;
    const HEIGHT = this.notifyElement.clientHeight;
    const svg = createSvgElement('svg', {
      width: WIDTH,
      height: HEIGHT
    });
    const path = createSvgElement('path', {
      id: 'booPath',
      fill: 'transparent',
      d: `M 0 ${ HEIGHT } L ${ WIDTH } ${ HEIGHT / 2 } L ${ WIDTH } ${ HEIGHT }`
    });
    const text = createSvgElement('text', {
      width: WIDTH,
      x: WIDTH / 3
    });
    const textPath = createSvgElement('textPath', {
      'xlink:href': '#booPath'
    });
    textPath.textContent = 'boo!';
    text.appendChild(textPath);
    svg.appendChild(path);
    svg.appendChild(text);

    return svg.outerHTML;
  }

  setMessage(msg) {
    if (!this.doMsgUpdate) {
      return;
    }

    this.notifyElement.innerHTML = this.msgText[msg].text || msg;
    this.notifyElement.classList.add(this.msgText[msg].className);

    setTimeout(() => {
      this.notifyElement.innerHTML = '';
      this.notifyElement.className = 'notification';
    }, 3000);

    this.doMsgUpdate = false;
    this.throttleTimeout = setTimeout(() => {
      this.doMsgUpdate = true;
    }, 3100);

    this.emitter.emit('notification.playscoreaudio', msg);
  }
}
