export default class AnalyseAnimation {
  constructor({ emitter }) {
    this.emitter = emitter;
    this.container = document.querySelector('.analyseAnimation div');
    this.appendSvg();
    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('track.load', this.showAnimation);
    this.emitter.on('track.load.complete, track.load.error', this.hideAnimation);
  }

  showAnimation() {
    document.body.classList.add('analysing');
  }

  hideAnimation() {
    document.body.classList.remove('analysing');
  }

  appendSvg() {
    this.container.innerHTML = `
      <svg width="192" height="192">
        ${this.getRandomiseWaveform()}
        ${this.getMagnifyingGlass()}
      </svg>
    `;
  }

  getRandomiseWaveform() {
    const width = 8;
    const gap = 2;
    let generatedLines = '';
    for (let i = 0; i < 16; i++) {
      const randomHeight = (Math.random() * 40 * Math.sin(Math.PI / 16 * i)) >> 0;
      generatedLines += `
        <line stroke=#42A5F5
              stroke-width=${width}
              stroke-linecap=round
              x1=${20 + i * (width + gap)}
              x2=${20 + i * (width + gap)}
              y1=${96 - randomHeight}
              y2=${96 + randomHeight}
        />
      `;
    }
    return generatedLines;
  }

  getMagnifyingGlass() {
    return `
      <g>
        <circle cx=96
                cy=96
                r=20
                stroke=#111
                fill=transparent
                stroke-width=4px
        />
        <path
          stroke-width=2px
          stroke=black
          fill=transparent
          d="M 96 84 Q 84 84 84 96"
        />
        <line x1=104
              x2=112
              y1=112
              y2=126
              stroke=#111
              stroke-width=3px
        />
        <line x1=107
              x2=117
              y1=118
              y2=136
              stroke=#111
              stroke-width=8px
        />
      </g>
    `;
  }
}
