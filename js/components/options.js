import { createSvgElement } from '../lib/utils.js';

export default class Options {
  constructor({ emitter }) {
    this.emitter = emitter;

    this.optionsContainer = document.querySelector('.options');
    this.optionTrigger = document.querySelector('label[for=options]');

    this.appendSvg();
    this.attachEvents();
    this.loadSettings()
      .then(this.updateOptions.bind(this))
      .then(this.notifyComponents.bind(this));
  }

  attachEvents() {
    this.listenForOptionChanges();
    this.updateRangeChanges();
    document.addEventListener('keyup', this.detectEscape.bind(this), false);
  }

  detectEscape(e) {
    const keyCode = e.keyCode || e.which;

    if (keyCode === 27 && this.optionTrigger.control.checked) {
      this.optionTrigger.control.checked = false;
    }
  }

  listenForOptionChanges() {
    [...this.optionsContainer.querySelectorAll('input[data-option],input[data-action]')]
      .forEach(input => {
        input.addEventListener('change', this.updateOption.bind(this), false);
      });
  }

  updateRangeChanges() {
    [...this.optionsContainer.querySelectorAll('input[type=range]')]
      .forEach(input => {
        input.addEventListener('input', this.updateProgress.bind(this), false);
      });
  }

  updateOption(e) {
    const optionName = e.currentTarget.getAttribute('data-option');
    const actionName = e.currentTarget.getAttribute('data-action');

    const optionValue = e.currentTarget.checked;
    this.emitter.emit(`option.${optionName || actionName}`, optionValue);

    if (optionName) {
      this.saveSetting('checkbox', optionName, optionValue, e.currentTarget.id, optionName, null);
    }
  }

  updateProgress(e) {
    const val = +e.currentTarget.value;
    e.currentTarget.nextElementSibling.setAttribute('value', val * 0.99);

    const rangeOption = e.currentTarget.getAttribute('data-range-option');

    if (rangeOption) {
      this.emitter.emit(rangeOption, val.toFixed(2), true);
    }

    this.saveSetting('range', rangeOption, val, e.currentTarget.id, null, rangeOption);
  }

  saveSetting(type, name, value, id, dataOption, dataRangeOption) {
    this.loadSettings()
      .then(settings => {
        settings[name] = {
          type,
          value,
          id,
          dataOption,
          dataRangeOption
        };

        localStorage.setItem('settings', JSON.stringify(settings));
      });
  }

  appendSvg() {
    this.optionTrigger.innerHTML = this.generateGearSvg();
  }

  generateGearSvg() {
    const WIDTH = this.optionTrigger.clientWidth;

    const svg = createSvgElement('svg', {
      width: WIDTH,
      height: WIDTH
    });

    const outerCircle = createSvgElement('circle', {
      cx: WIDTH/2,
      cy: WIDTH/2,
      r: WIDTH/4 - 1,
      fill: 'black'
    });

    const vertLine = createSvgElement('line', {
      x1: WIDTH/2,
      x2: WIDTH/2,
      y1: WIDTH/2 - 7 * WIDTH/32,
      y2: WIDTH/2 + 7 * WIDTH/32,
      stroke: 'black',
      strokeWidth: WIDTH/8,
      strokeLinecap: 'round'
    });

    const diagLine1 = createSvgElement('line', {
      x1: WIDTH/2,
      x2: WIDTH/2,
      y1: WIDTH/2 - 7 * WIDTH/32,
      y2: WIDTH/2 + 7 * WIDTH/32,
      stroke: 'black',
      strokeWidth: WIDTH/8,
      strokeLinecap: 'round'

    });

    const diagLine2 = createSvgElement('line', {
      x1: WIDTH/2,
      x2: WIDTH/2,
      y1: WIDTH/2 - 7 * WIDTH/32,
      y2: WIDTH/2 + 7 * WIDTH/32,
      stroke: 'black',
      strokeWidth: WIDTH/8,
      strokeLinecap: 'round'
    });

    diagLine1.style.transformOrigin = '50% 50%';
    diagLine1.style.transform = 'rotate(60deg)';
    diagLine2.style.transformOrigin = '50% 50%';
    diagLine2.style.transform = 'rotate(-60deg)';


    const innerCircle = createSvgElement('circle', {
      cx: WIDTH/2,
      cy: WIDTH/2,
      r: 3 * WIDTH/32,
      fill: 'white'
    });

    svg.appendChild(outerCircle);
    svg.appendChild(vertLine);
    svg.appendChild(diagLine1);
    svg.appendChild(diagLine2);
    svg.appendChild(innerCircle);

    return svg.outerHTML;
  }

  loadSettings() {
    return new Promise(resolve => {
      try {
        resolve(JSON.parse(localStorage.getItem('settings')) || {})
      } catch(e) {
        resolve({});
      }
    });
  }

  updateOptions(settings) {
    for (const key in settings) {
      const { type, id, value } = settings[key];
      const element = document.getElementById(id);

      if (!element) {
        return settings;
      }

      if (type === 'checkbox') {
        element.checked = value;
      }
      else {
        element.value = value;
      }

      if (element.nextElementSibling.tagName.toLowerCase() === 'progress') {
        element.nextElementSibling.value = value;
      }
    }

    return settings;
  }

  notifyComponents(settings) {
    for (const key in settings) {
      const { value, dataOption, dataRangeOption } = settings[key];
      if (dataOption) {
        this.emitter.emit(`option.${dataOption}`, value);
      }
      if (dataRangeOption) {
        this.emitter.emit(dataRangeOption, value);
      }
    }

    return settings;
  }
}
