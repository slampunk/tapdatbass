export default class ScoreKeeper {
  constructor({ emitter }) {
    this.emitter = emitter;
    this.scoreDisplay = document.querySelector('.scoreDisplay');
    this.comboDisplay = document.querySelector('.comboNumber');
    this.resultsDisplay = document.querySelector('.gameResult');
    this.shareBtn = document.querySelector('.shareResult');
    this.songName = '';

    this.score = 0;
    this.oldScore = 0;
    this.updatingScore = 0;
    this.trackBpm = 0;
    this.isUpdatingDisplay = false;
    this.lastUpdateTimestamp = 0;
    this.crowdVolume = 0;

    this.performance = {
      'perfect!': 0,
      'good': 0,
      'ok': 0,
      'boo!': 0
    };
    this.combo = 0;
    this.longestCombo = 0;

    this.allowShakerClassTimeout = null;

    this.attachEvents();
    this.init();
  }

  init() {
    this.emitter.emit('rafloop.subscribe', this.displayScoreLoop);
    this.checkShareAPI();
  }

  checkShareAPI() {
    if (navigator.share) {
      this.shareBtn.addEventListener('click', this.shareResult.bind(this), false);
    }
    else {
      this.shareBtn.classList.add('hidden');
    }
  }

  attachEvents() {
    this.emitter.on('tap.difference', this.keepScore);
    this.emitter.on('track.load', this.saveTrackName.bind(this));
    this.emitter.on('track.analysis', this.logTrackBpm);
    this.emitter.on('track.play', this.resetScore);
    this.emitter.on('game.result', this.setResults.bind(this));
  }

  shareResult() {
    const text = `I scored ${this.score} on ${this.songName}. Can you do better? :P`;

    navigator.share({
      title: 'Can you beat my score?',
      url: location.href,
      text
    });
  }

  saveTrackName(track) {
    this.songName = track.name
      .replace(/-/g, ' ')
      .replace('.mp3', '')
      .replace('.aac', '')
      .replace('.wma', '')
      .replace('.flac', '');
  }

  resetScore = () => {
    this.scoreDisplay.textContent = '0';
    this.score = this.oldScore = 0;
    this.updatingScore = 0;
    this.longestCombo = this.combo = 0;
    for (const key in this.performance) {
      this.performance[key] = 0;
    }
  }

  keepScore = (tapDiff) => {
    let newScore = 0;
    let scoreMsg = '';
    let goodTap = true;

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
      this.combo = -1;
      this.crowdVolume = 0;
      this.emitter.emit('volume.crowd', this.crowdVolume);
      this.emitter.emit('scene.remove.wobble');
      goodTap = false;
    }

    this.combo++;
    this.updateScore(newScore);
    this.emitter.emit('tap.message', scoreMsg);

    this.performance[scoreMsg]++;
    if (this.combo > this.longestCombo) {
      this.longestCombo = this.combo;
    }

    if (this.combo > 4) {
      this.comboDisplay.textContent = '';
      setTimeout(() => {
        this.comboDisplay.textContent = this.combo;
      }, 16);
    }
    else {
      this.comboDisplay.textContent = '';
    }

    if (this.combo === 10) {
      this.emitter.emit('scene.add.wobble');
    }

    if (this.combo === 20) {
      this.crowdVolume = 0.33;
    }
    else if (this.combo === 50) {
      this.crowdVolume = 0.67;
    }

    if (this.combo % 10 === 0) {
      this.emitter.emit('volume.crowd', this.crowdVolume);
    }

    if (goodTap) {
      document.body.classList.add('allowShaker');
      clearTimeout(this.allowShakerClassTimeout);
      this.allowShakerClassTimeout = setTimeout(() => {
        document.body.classList.remove('allowShaker');
      }, 5000);
    }
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

  setResults() {
    for (const key in this.performance) {
      this.resultsDisplay.querySelector(`p[data-field="${key}"] span:nth-of-type(2)`)
        .textContent = this.performance[key];
    }

    this.resultsDisplay.querySelector('p[data-field="song"] span:nth-of-type(2)')
      .textContent = this.songName;

    this.resultsDisplay.querySelector('p[data-field="longestCombo"] span:nth-of-type(2)')
      .textContent = this.longestCombo;

    this.resultsDisplay.querySelector('p[data-field="score"] span:nth-of-type(2)')
      .textContent = this.score;

    setTimeout(() => {
      this.comboDisplay.textContent = '';
    }, 3000);

    this.emitter.emit('scene.remove.wobble');
  }
}
