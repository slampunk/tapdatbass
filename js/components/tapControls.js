import { createSvgElement } from '../lib/utils.js';

export default class TapControls {
  constructor(props) {
    this.emitter = props.emitter;
    this.tappers = [...document.querySelectorAll('.tap-controls li')];
    this.cube = document.querySelector('.rotator');
    this.arrowDropTime = 0;

    // Lower number more difficult
    this.difficultyMultiplier = 3;
    this.init();
  }

  init() {
    this.appendSvg();
    this.attachEvents();
    this.arrowDropTime = this.getArrowDropTime();
    this.setDropTransitionDuration();
  }

  getArrowDropTime() {
    const ELEMENT_HEIGHT = this.tappers[0].clientHeight;
    const WINDOW_HEIGHT = window.innerHeight;
    const dropTime = this.difficultyMultiplier * WINDOW_HEIGHT / ( WINDOW_HEIGHT + ELEMENT_HEIGHT );
    // this.emitter.emit('
    return dropTime;
  }

  setDropTransitionDuration() {
    const durationStyle = document.createElement('style');
    durationStyle.textContent = `
      .tap-controls li .arrow {
        transition-duration: ${this.arrowDropTime}s
      }
    `;
    document.head.appendChild(durationStyle);
  }

  attachEvents() {
    this.tappers.forEach(tapper => {
      tapper.addEventListener('touchstart', this.tapBeat, false);
      tapper.addEventListener('mousedown', this.tapBeat, false);
      tapper.addEventListener('touchcancel', this.endTapBeat, false);
      tapper.addEventListener('mouseout', this.endTapBeat, false);
      tapper.addEventListener('touchend', this.endTapBeat, false);
      tapper.addEventListener('mouseup', this.endTapBeat, false);
    });

    this.emitter.on('beatArrow', this.generateBeatArrow, false);
  }

  tapBeat = e => {
    if (!e.target.classList.contains('isDown')) {
      e.target.classList.add('isDown');
      this.cube.classList.add('beat');
    }
  }

  endTapBeat = e => {
    e.target.classList.remove('isDown');
    this.cube.classList.remove('beat');
  }

  generateBeatArrow = () => {
    const arrowNum = Math.random() * 4 >> 0;
    let arrow = document.createElement('span');
    arrow.classList.add('arrow');
    this.tappers[arrowNum].appendChild(arrow);
    setTimeout(() => {
      arrow.style.transform = 'translateY(20vw)';
    });
    setTimeout(() => {
      arrow.remove();
      arrow = null;
    }, this.arrowDropTime * 1000);
  }

  appendSvg() {
    this.tappers.forEach(el => {
      el.appendChild(this.generateSvg());
    });
  }

  generateSvg() {
    const WIDTH = this.tappers[0].clientWidth;
    const HEIGHT = this.tappers[0].clientWidth;
    const INNER_COLOUR = '#aaa';
    const gutter = 16;


    const svg = createSvgElement('svg', {
      width: WIDTH,
      height: HEIGHT
    });

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

    const innerLine = createSvgElement('line', {
      fill: 'transparent',
      stroke: INNER_COLOUR,
      strokeWidth: 8,
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

    const innerPath = createSvgElement('path', {
      fill: 'transparent',
      stroke: INNER_COLOUR,
      strokeWidth: 8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: `M ${ HEIGHT / 4 + gutter } ${ HEIGHT / 4 }
          L ${ gutter } ${ HEIGHT / 2 }
          L ${ HEIGHT / 4 + gutter } ${ 3 * HEIGHT / 4 }`
    });

    const fillerLine = createSvgElement('line', {
      stroke: INNER_COLOUR,
      strokeWidth: 8,
      strokeLinecap: 'round',
      x1: gutter,
      x2: WIDTH - gutter,
      y1: HEIGHT / 2,
      y2: HEIGHT / 2
    });

    svg.append(outerLine);
    svg.append(innerLine);
    svg.append(outerPath);
    svg.append(innerPath);
    svg.append(fillerLine);

    return svg;
  }
}
