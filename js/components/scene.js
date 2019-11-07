export default class Scene {
  constructor({ emitter }) {
    this.emitter = emitter;
    this.styleSheet = null;

    this.initializeStylesheet();
    this.randomiseColours();
    this.attachEvents();
  }

  initializeStylesheet() {
    this.styleSheet = document.createElement('style');
    document.head.appendChild(this.styleSheet);
  }

  attachEvents() {
  }

  randomiseColours() {
    let newColours = '';
    for (let i = 0; i < 6; i++) {
      newColours += `
        .rotator > div:nth-child(${i+1}) {
          background: rgba(
            ${Math.random() * 255 >> 0},
            ${Math.random() * 255 >> 0},
            ${Math.random() * 255 >> 0},
            0.7);
        }
      `;
    }
    this.styleSheet.textContent = newColours
  }
}
