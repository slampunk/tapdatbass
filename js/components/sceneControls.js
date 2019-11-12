export default class SceneControls {
  constructor(props) {
    this.emitter = props.emitter;
    this.isPlaying = false;

    this.attachEvents();
  }

  attachEvents() {
    [...document.querySelectorAll('button[data-action]')]
      .forEach(button =>
        button.addEventListener('click', this.startPlayType, false)
      );

    document.querySelector('.playButton')
      .addEventListener('click', this.playPauseGame, false);

    this.emitter.on('track.load', this.onTrackLoading);
    this.emitter.on('track.load.complete', this.onTrackReady);
    this.emitter.on('track.stop', this.onTrackStop);
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

  playPauseGame = () => {
    if (!this.isPlaying) {
      document.body.classList.add('is-playing');
      this.emitter.emit('track.play');
      this.isPlaying = true;
    }
    else {
      this.emitter.emit('track.stop');
      document.body.classList.remove('is-playing');
      this.isPlaying = false;
    }
  }

  onTrackStop = () => {
    document.body.classList.remove('is-playing');
    this.isPlaying = false;
  }
}
