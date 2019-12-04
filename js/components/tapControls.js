import { createSvgElement } from '../lib/utils.js';

export default class TapControls {
  constructor(props) {
    this.emitter = props.emitter;
    this.tappers = [...document.querySelectorAll('.tap-controls li')];
    this.directionsToArrows = {
      left: this.tappers[0],
      down: this.tappers[1],
      up: this.tappers[2],
      right: this.tappers[3]
    };

    this.tapBtnHeight = this.tappers[0].clientHeight;
    this.cube = document.querySelector('.rotator');
    this.arrowDropTime = 0;
    this.dropArrowHtml = '';

    this.beatCounter = 1;

    this.isTouching = false;
    this.isBotPlay = false;

    // Number of seconds for an arrow to traverse
    // the window's height.
    // The lower number -> the more difficult
    this.difficultyMultiplier = 2;

    this.init();
  }

  init() {
    this.appendSvg();
    this.attachEvents();
    this.arrowDropTime = this.getArrowDropTime();
    this.setDropTransitionDuration();
    this.emitter.emit('game.start.delay', this.difficultyMultiplier);
    this.setDropArrowHtml();
  }

  getArrowDropTime() {
    const ELEMENT_HEIGHT = this.tappers[0].clientHeight;
    const WINDOW_HEIGHT = window.innerHeight;
    const dropTime = this.difficultyMultiplier * ( WINDOW_HEIGHT + ELEMENT_HEIGHT ) / WINDOW_HEIGHT;
    return dropTime;
  }

  setDropTransitionDuration() {
    let durationStyle = document.querySelector('style.trans-duration');
    if (!durationStyle) {
      durationStyle = document.createElement('style');
      durationStyle.classList.add('trans-duration');
      document.head.appendChild(durationStyle);
    }

    durationStyle.textContent = `
      .tap-controls li .arrow {
        transition-duration: ${this.arrowDropTime}s
      }
    `;
  }

  setDropArrowHtml() {
    const WIDTH = this.tappers[0].clientWidth;
    const HEIGHT = this.tappers[0].clientWidth;

    const svg = createSvgElement('svg', {
      width: WIDTH,
      height: HEIGHT
    });

    const { innerLine, innerPath, fillerLine } = this.generateInnerArrow({
      WIDTH,
      HEIGHT,
      colour: 'yellow'
    });

    svg.appendChild(innerLine);
    svg.appendChild(innerPath);
    svg.appendChild(fillerLine);

    this.dropArrowHtml = svg.outerHTML;
  }

  attachEvents() {
    this.tappers.forEach(tapper => {
      tapper.addEventListener('touchstart', this.tapBeat, { passive: false });
      tapper.addEventListener('mousedown', this.tapBeat, { passive: false });
      tapper.addEventListener('touchcancel', this.endTapBeat, { passive: false });
      tapper.addEventListener('mouseout', this.endTapBeat, { passive: false });
      tapper.addEventListener('touchend', this.endTapBeat, { passive: false });
      tapper.addEventListener('mouseup', this.endTapBeat, { passive: false });
    });

    this.emitter.on('beatArrow', this.generateTapArrow);
    this.emitter.on('tap.arrow', this.tapSpecificArrow);
    this.emitter.on('option.botplay', this.setBotPlay.bind(this));
  }

  setBotPlay(botPlayState) {
    this.isBotPlay = botPlayState;
  }

  tapSpecificArrow = arrowDirection => {
    this.directionsToArrows[arrowDirection].dispatchEvent(new Event('mousedown'));
    setTimeout(() => {
      this.directionsToArrows[arrowDirection].dispatchEvent(new Event('mouseup'));
    }, 100);
  }

  tapBeat = e => {
    if (!this.isTouching && !e.currentTarget.classList.contains('isDown')) {
      e.preventDefault();
      this.isTouching = true;
      e.currentTarget.classList.add('isDown');
      this.cube.classList.add('beat');
      let currentArrow = e.currentTarget.querySelector('.arrow:not(.removing)');
      if (!currentArrow) {
        return;
      }

      this.interrogateUserTap(currentArrow);
    }
  }

  interrogateUserTap(tap) {
    let diff = +(
      window.getComputedStyle(tap, null)
        .getPropertyValue('transform')
        .split(/,|\)/)[5]
    );

    tap.style.transitionDuration = `0.5s`;
    tap.style.opacity = '0';
    tap.style.transform = `scale(2) translateY(${diff}px)`;
    tap.classList.add('removing');
    this.emitter.emit('tap.difference', Math.abs(diff));
  }

  endTapBeat = e => {
    this.isTouching = false;
    e.currentTarget.classList.remove('isDown');
    this.cube.classList.remove('beat');
  }

  generateTapArrow = () => {
    const arrowNum = Math.random() * 4 >> 0;
    let arrow = document.createElement('span');
    arrow.classList.add('arrow');
    arrow.innerHTML = this.dropArrowHtml;
    this.tappers[arrowNum].appendChild(arrow);
    setTimeout(() => {
      arrow.style.transform = `translateY(${this.tapBtnHeight}px)`;
    });
    this.doBotPlayOn(this.tappers[arrowNum]);
    /*
    setTimeout(() => {
      this.tappers[arrowNum].dispatchEvent(new Event('mousedown'));
      setTimeout(() => {
        this.tappers[arrowNum].dispatchEvent(new Event('mouseup'));
      }, 50);
    }, this.difficultyMultiplier * 1000);*/
    setTimeout(() => {
      if (arrow) {
        arrow.remove();
        arrow = null;
      }
    }, this.arrowDropTime * 1000);
  }

  doBotPlayOn(tapper) {
    if (this.isBotPlay) {
      setTimeout(() => {
        tapper.dispatchEvent(new Event('mousedown'));
        setTimeout(() => {
          tapper.dispatchEvent(new Event('mouseup'));
        }, 50);
      }, this.difficultyMultiplier * 1000);
    }
  }

  appendSvg() {
    this.tappers.forEach(el => {
      el.appendChild(this.generateSvg());
    });
  }

  generateOuterArrow({ WIDTH, HEIGHT, gutter = 16 }) {
    const outerLine = createSvgElement('line', {
      fill: 'transparent',
      stroke: 'white',
      strokeWidth: 16,
      strokeLinecap: 'round',
      x1: gutter,
      x2: WIDTH - gutter,
      y1: HEIGHT / 2,
      y2: HEIGHT / 2
    });

    const outerPath = createSvgElement('path', {
      fill: 'transparent',
      stroke: 'white',
      strokeWidth: 16,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: `M ${ HEIGHT / 4 + gutter } ${ HEIGHT / 4 }
          L ${ gutter } ${ HEIGHT / 2 }
          L ${ HEIGHT / 4 + gutter } ${ 3 * HEIGHT / 4 }`
    });

    return { outerLine, outerPath };
  }

  generateInnerArrow({ WIDTH, HEIGHT, colour = '#aaa', gutter = 16 }) {
    const innerLine = createSvgElement('line', {
      fill: 'transparent',
      stroke: colour,
      strokeWidth: 8,
      strokeLinecap: 'round',
      x1: gutter,
      x2: WIDTH - gutter,
      y1: HEIGHT / 2,
      y2: HEIGHT / 2
    });

    const innerPath = createSvgElement('path', {
      fill: 'transparent',
      stroke: colour,
      strokeWidth: 8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: `M ${ HEIGHT / 4 + gutter } ${ HEIGHT / 4 }
          L ${ gutter } ${ HEIGHT / 2 }
          L ${ HEIGHT / 4 + gutter } ${ 3 * HEIGHT / 4 }`
    });

    const fillerLine = createSvgElement('line', {
      stroke: colour,
      strokeWidth: 8,
      strokeLinecap: 'round',
      x1: gutter,
      x2: WIDTH - gutter,
      y1: HEIGHT / 2,
      y2: HEIGHT / 2
    });

    return { innerLine, innerPath, fillerLine };
  }

  generateSvg() {
    const WIDTH = this.tappers[0].clientWidth;
    const HEIGHT = this.tappers[0].clientWidth;

    const svg = createSvgElement('svg', {
      width: WIDTH,
      height: HEIGHT
    });

    const { outerLine, outerPath } = this.generateOuterArrow({ WIDTH, HEIGHT });
    const { innerLine, innerPath, fillerLine } = this.generateInnerArrow({ WIDTH, HEIGHT });

    svg.append(outerLine);
    svg.append(innerLine);
    svg.append(outerPath);
    svg.append(innerPath);
    svg.append(fillerLine);

    return svg;
  }
}
