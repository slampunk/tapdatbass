export default class SceneControls {
  constructor(props) {
    this.emitter = props.emitter;

    this.attachEvents();
  }

  attachEvents() {
    [...document.querySelectorAll('button[data-action]')]
      .forEach(button =>
        button.addEventListener('click', this.startPlayType, false)
      );

    this.emitter.on('track.load', this.onTrackLoading);
    this.emitter.on('track.load.complete', this.onTrackReady);
  }

  startPlayType = e => {
    const playType = e.currentTarget.getAttribute('data-action');
    document.body.classList.add(playType);
    this.emitter.emit('play.type', playType);
  }

  onTrackReady() {
    document.body.classList.add('ready');
  }

  onTrackLoading() {
    document.body.classList.remove('ready');
  }
}
