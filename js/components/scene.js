export default class Scene {
  constructor({ emitter }) {
    this.emitter = emitter;
    this.styleSheet = null;
    this.visualisation = document.getElementsByClassName('visualisation')[0];

    this.initializeStylesheet();
    this.randomiseColours();
    this.attachEvents();
  }

  initializeStylesheet() {
    this.styleSheet = document.createElement('style');
    document.head.appendChild(this.styleSheet);
  }

  attachEvents() {
    this.emitter.on('scene.add.wobble', this.addWobble.bind(this));
    this.emitter.on('scene.remove.wobble', this.removeWobble.bind(this));
  }

  randomiseColours() {
    let newColours = '';
    for (let i = 0; i < 6; i++) {
      const randomColours = [
        Math.random() * 255 >> 0,
        Math.random() * 255 >> 0,
        Math.random() * 255 >> 0
      ];
      newColours += `
        .rotator > div:nth-child(${i+1}) {
          background: rgba(${ randomColours.join(', ') }, 0.7);
          color: rgba(${ randomColours.join(', ') }, 0.7);
        }

        .rotator > div:nth-child(${i+1})::before {
          background: linear-gradient(
                        180deg,
                        rgba(${ randomColours.join(', ') }, 0.7) 0%,
                        rgba(${ randomColours.join(', ') }, 0.7) 25%,
                        rgba(${ randomColours.join(', ') }, 0) 50%
                      );
        }
      `;
    }
    this.styleSheet.textContent = newColours
  }

  addWobble() {
    this.visualisation.classList.add('wobble');
  }

  removeWobble() {
    this.visualisation.classList.remove('wobble');
  }
}
