export default class ScoreKeeper {
  constructor({ emitter }) {
    this.emitter = emitter;
    this.scoreDisplay = document.querySelector('.scoreDisplay');

    this.score = 0;
    this.oldScore = 0;
    this.updatingScore = 0;
    this.trackBpm = 0;
    this.isUpdatingDisplay = false;
    this.lastUpdateTimestamp = 0;

    this.attachEvents();
    this.init();
  }

  init() {
    this.emitter.emit('rafloop.subscribe', this.displayScoreLoop);
  }

  attachEvents() {
    this.emitter.on('tap.difference', this.keepScore);
    this.emitter.on('track.analysis', this.logTrackBpm);
    this.emitter.on('track.play', this.resetScore);
  }

  resetScore = () => {
    this.scoreDisplay.textContent = '0';
    this.score = this.oldScore = 0;
    this.updatingScore = 0;
  }

  keepScore = (tapDiff) => {
    let newScore = 0;
    let scoreMsg = '';
    if (tapDiff < 2) {
      newScore = 1000;
      scoreMsg = 'perfect!';
    }
    else if (tapDiff < 8) {
      newScore = 1666 - tapDiff * 1000 / 6;
      scoreMsg = 'good';
    }
    else if (tapDiff < 12) {
      newScore = 300;
      scoreMsg = 'ok';
    }
    else {
      newScore = -100;
      scoreMsg = 'boo!';
    }

    this.updateScore(newScore);
    this.emitter.emit('tap.message', scoreMsg);
  }

  updateScore(newScore) {
    this.oldScore = this.score;
    this.score = Math.max(0, this.score + newScore) >> 0;

    this.isUpdatingDisplay = true;
  }

  logTrackBpm = (details) => {
    this.trackBpm = details.bpm;
  }

  displayScoreLoop = (timestamp) => {
    if (this.isUpdatingDisplay) {
      this.lastUpdateTimestamp = timestamp;
      this.isUpdatingDisplay = false;
      this.updatingScore = this.oldScore;
    }
    if (this.oldScore !== this.score && this.updatingScore <= this.score) {
      this.updatingScore =
        this.oldScore + (this.score - this.oldScore) * (timestamp - this.lastUpdateTimestamp) / (15000 / this.trackBpm);
      this.scoreDisplay.textContent = this.updatingScore >> 0;
    }
  }
}
