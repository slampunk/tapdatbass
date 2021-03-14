export default class SceneControls {
  constructor(props) {
    this.emitter = props.emitter;
    this.isPlaying = false;

    this.attachEvents();
  }

  attachEvents() {
    [...document.querySelectorAll('button[data-action]')]
      .forEach(button =>
        button.addEventListener('click', this.startPlayType.bind(this), false)
      );

    document.querySelector('.playButton')
      .addEventListener('click', this.playPauseGame.bind(this), false);

    this.emitter.on('track.load', this.onTrackLoading.bind(this));
    this.emitter.on('track.load.complete', this.onTrackReady.bind(this));
    this.emitter.on('track.stop', this.onTrackStop.bind(this));
    this.emitter.on('game.result', this.onResult.bind(this));
  }

  startPlayType(e) {
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

  playPauseGame() {
    if (!this.isPlaying) {
      document.body.classList.add('is-playing');
      document.body.classList.remove('results');
      this.emitter.emit('track.play');
      this.isPlaying = true;
    }
    else {
      this.emitter.emit('track.stop');
      document.body.classList.remove('is-playing');
      this.isPlaying = false;
    }
  }

  onTrackStop() {
    document.body.classList.remove('is-playing');
    this.isPlaying = false;
  }

  onResult() {
    document.body.classList.add('results');
  }
}
