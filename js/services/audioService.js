import BeatDetectorService from './beatDetectorService.js';
let beatDetector = null;

export default class AudioService {
  constructor(props) {
    this.emitter = props.emitter;
    this.loopToken = '';

    this.audioBuffer = null;
    this.source = null;
    this.lpSource = null;
    this.fftSize = 1024;

    this.crowdCtx = null;
    this.crowdSource = null;
    this.crowdGain = null;
    this.crowdVolume = this.currentVolume = 0;

    this.masterVolume = 1;

    this.trackBpm = 0;
    this.threshold = 0;
    this.thresholdScaler = 0.85;

    this.startDelay = 0;
    this.isPlaying = false;

    this.shakeBeat = 0;
    this.shakerTimeouts = [];

    this.isEnded = false;

    beatDetector = new BeatDetectorService(props);

    this.scoreAudios = {
      'boo!': {
        isReady: false,
        player: new Audio('../../assets/audio/boo.mp3')
      },
      'perfect!': {
        isReady: false,
        player: new Audio('../../assets/audio/cheer.mp3')
      }
    };

    this.attachEvents();
  }

  async setupCrowd() {
    const { crowdCtx, crowdSource, crowdGain } = await this.setupBackgroundAudio();
    this.crowdCtx = crowdCtx;
    this.crowdSource = crowdSource;
    this.crowdGain = crowdGain;

    this.setCrowdVolume(0);
    this.crowdSource.start(0);
  }

  attachEvents() {
    this.emitter.on('track.load', this.analyse);
    this.emitter.on('track.analysis', this.onTrackBpm);
    this.emitter.on('track.bpm.error', () => this.emitter.emit('track.load.error'));
    this.emitter.on('track.play', this.play);
    this.emitter.on('track.stop', this.stop);
    this.emitter.on('game.start.delay', this.setStartDelay);

    for (let scoreType in this.scoreAudios) {
      this.scoreAudios[scoreType].player.addEventListener('canplaythrough', () => {
        this.scoreAudios[scoreType].isReady = true;
      });
      this.scoreAudios[scoreType].player.addEventListener('ended', () => {
        this.scoreAudios[scoreType].player.currentTime = 0;
      });
    }

    this.emitter.on('notification.playscoreaudio', this.playScoreAudio.bind(this));
    this.emitter.on('volume.crowd', this.setCrowdVolume.bind(this));
    this.emitter.on('volume.master', this.setMasterVolume.bind(this));
    this.emitter.on('option.volume.stoplooping', this.stopLoopingPreview.bind(this));
  }

  setMasterVolume(volume, doPreview) {
    this.masterVolume = volume;
    this.scoreAudios['perfect!'].player.volume = volume;
    this.scoreAudios['boo!'].player.volume = volume;

    if (doPreview) {
      if (this.scoreAudios['perfect!'].player.paused) {
        this.scoreAudios['perfect!'].player.play();
        this.scoreAudios['perfect!'].player.loop = true;
      }
    }
  }

  stopLoopingPreview() {
    this.scoreAudios['perfect!'].player.loop = false;
  }

  setCrowdVolume(volume, transitionTime = 2000) {
    if (volume !== this.crowdVolume) {
      const oldVolume = this.crowdVolume;
      const currentVolume = this.currentVolume;
      this.crowdVolume = volume;
      this.transitionCrowdVolume(oldVolume, volume, currentVolume, transitionTime);
    }
    else {
      volume = Math.max(Math.min(volume, 1), 0);
      this.crowdGain.gain.setValueAtTime(this.getVolume(volume), this.crowdCtx.currentTime);
    }
  }

  getVolume(volume) {
    return volume * this.masterVolume;
  }

  transitionCrowdVolume(oldVol, newVol, currentVol, transitionTime = 2000) {
    if (this.volumeTransitionSubscription) {
      this.emitter.emit('rafloop.unsubscribe', this.volumeTransitionSubscription);
    }

    currentVol = currentVol || oldVol;

    let transTimestamp = 0;
    const volumeTransition = timestamp => {
      try {
        transTimestamp = transTimestamp || timestamp;
        let elapsedMS = timestamp - transTimestamp;
        this.currentVolume = elapsedMS > 0 ? Math.max(0, Math.min(currentVol + (newVol - currentVol) / transitionTime * elapsedMS, 1)) : currentVol;
        this.crowdGain.gain.setValueAtTime(this.getVolume(this.currentVolume), this.crowdCtx.currentTime);
      } catch(e) {
        console.log(this.currentVolume, e);
      }
    }

    this.emitter.emit('rafloop.subscribe', volumeTransition, (token) => {
      this.volumeTransitionSubscription = token;
      setTimeout(() => {
        this.emitter.emit('rafloop.unsubscribe', this.volumeTransitionSubscription);
        this.volumeTransitionSubscription = null;
        this.currentVolume = null;
        this.crowdGain.gain.setValueAtTime(this.crowdVolume, this.crowdCtx.currentTime);
      }, transitionTime);
    });
  }

  onTrackBpm = (details) => {
    this.threshold = (details.threshold + 1) * 0x80 * this.thresholdScaler;
    this.trackBpm = details.bpm;
    this.trackSilences = details.silences;
    this.emitter.emit('track.load.complete');
  }

  analyse = track => {
    const reader = new FileReader();

    reader.onload = () => {
      this.emitter.emit('notification.progress', 'Analysing...');
      this.handleAnalysis(reader.result);
    };

    reader.readAsArrayBuffer(track);
  }

  handleAnalysis = result => {
    const context = new AudioContext();

    context.decodeAudioData(result)
      .then(this.analyseLowPass)
      .then(this.setAudioBuffer)
      .catch(this.onAnalyseError);
  }

  analyseLowPass = buffer => {
    const offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
    const beatSource = offlineContext.createBufferSource();
    const filter = offlineContext.createBiquadFilter();
    const compressor = offlineContext.createDynamicsCompressor();

    offlineContext.oncomplete = beatDetector.calculateBPM;

    beatSource.buffer = buffer;

    compressor.threshold.value = -12;
    compressor.knee.value = 40;
    compressor.ratio.value = 2;
    compressor.attack.value = 0.2;
    compressor.release.value = 1;

    filter.frequency.value = 100;

    beatSource.connect(filter);
    // filter.connect(compressor);
    // compressor.connect(offlineContext.destination);
    filter.connect(offlineContext.destination);

    beatSource.start();
    offlineContext.startRendering();
    return buffer;
  }

  setAudioBuffer = buffer => {
    this.audioBuffer = buffer;
  }

  onAnalyseError = err => {
  }

  play = () => {
    this.isPlaying = true;

    const {
      context,
      gainNode,
      lpAnalyser,
      shakeAnalyser,
      filter,
      shakeFilter
    } = this.setupTrackingAnalysers();

    this.trackBeats(lpAnalyser);

    this.source = context.createBufferSource();
    this.lpSource = context.createBufferSource();
    this.shakeSource = context.createBufferSource();

    this.source.buffer = this.audioBuffer;
    this.lpSource.buffer = this.audioBuffer;
    this.shakeSource.buffer = this.audioBuffer;

    this.source.connect(gainNode);
    this.lpSource.connect(filter);
    this.shakeSource.connect(shakeFilter);

    this.shakeSource.start(0.6);
    this.lpSource.start(0.6);
    this.source.start(this.startDelay + 0.6);

    this.source.onended = () => {
      setTimeout(() => {
        this.emitter.emit('track.stop');

        if (this.isEndOfSong(context.currentTime, this.audioBuffer.duration)) {
          this.emitter.emit('game.result');
        }
      }, 1000);
    }

    this.trackSilences
      .forEach(this.addShakerAtSilenceEnd.bind(this));

    this.setupCrowd();
  }

  addShakerAtSilenceEnd(silence, i) {
    if (!silence.start) {
      return;
    }

    if (i % 2) {
      this.shakerTimeouts.push({
        start: setTimeout(() => {
          document.body.classList.add('shaker');
        }, (0.6 + this.startDelay + silence.end - 3) * 1000),
        end: setTimeout(() => {
          document.body.classList.remove('shaker');
        }, (0.6 + this.startDelay + silence.end + 16 * 60 / this.trackBpm) * 1000)
      });
    }
  }

  isEndOfSong(currentTime, duration) {
    return currentTime > duration * 0.95;
  }

  stop = () => {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    this.source.stop();
    this.lpSource.stop();
    const fadeOutTime = 4000;
    this.setCrowdVolume(0, fadeOutTime);
    setTimeout(() => {
      this.crowdSource.stop();
    }, fadeOutTime);
    this.emitter.emit('rafloop.unsubscribe', this.loopToken);

    this.shakerTimeouts.forEach(shaker => {
      clearTimeout(shaker.start);
      clearTimeout(shaker.end);
    });
  }

  setupCompressor(compressor) {
    compressor.threshold.value = -12;
    compressor.knee.value = 40;
    compressor.ratio.value = 2;
    compressor.attack.value = 0;
    compressor.release.value = .25;
  }

  setupFilter(filter) {
    filter.type = 'lowpass';
    filter.frequency.value = 100;
  }

  setupTrackingAnalysers() {
    const context = new AudioContext();

    const gainNode = context.createGain();

    const lpAnalyser = context.createAnalyser();
    const filter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();

    const shakeAnalyser = context.createAnalyser();
    const shakeFilter = context.createBiquadFilter();
    const shakeCompressor = context.createDynamicsCompressor();

    this.setupCompressor(compressor);
    this.setupCompressor(shakeCompressor);

    this.setupFilter(filter);
    this.setupFilter(shakeFilter);

    lpAnalyser.fftSize = this.fftSize;
    shakeAnalyser.fftSize = this.fftSize;

    filter.connect(compressor);
    compressor.connect(lpAnalyser);

    shakeFilter.connect(shakeCompressor);
    shakeCompressor.connect(shakeAnalyser);

    gainNode.connect(context.destination);

    return { context, lpAnalyser, shakeAnalyser, gainNode, filter, shakeFilter };
  }

  setupBackgroundAudio() {
    const crowdCtx = new AudioContext();
    const crowdSource = crowdCtx.createBufferSource();
    crowdSource.loop = true;
    const crowdGain = crowdCtx.createGain();

    return fetch('/assets/audio/crowdcheer.mp3')
      .then(response => response.arrayBuffer())
      .then(arraybuffer => crowdCtx.decodeAudioData(arraybuffer))
      .then(audioBuffer => {
        crowdSource.buffer = audioBuffer;
        crowdSource.connect(crowdGain);
        crowdGain.connect(crowdCtx.destination);

        return {
          crowdCtx,
          crowdSource,
          crowdGain
        };
      });
  }

  trackBeats(lpAnalyser) {
    let dataArray = new Uint8Array(this.fftSize);
    let inBeat = false;

    const emitOnBeat = (timestamp) => {
      lpAnalyser.getByteTimeDomainData(dataArray);

      let total = 0;
      for (let i = 0; i < this.fftSize; i++) {
        if (dataArray[i] >= this.threshold && !inBeat) {
          inBeat = true;
          this.emitter.emit('beatArrow');
          setTimeout(() => {
            inBeat = false;
          }, ( 24 / this.trackBpm ) * 990);
        }
      }
    }

    this.emitter.emit('rafloop.subscribe', emitOnBeat, token => {
      this.loopToken = token;
    });

  }

  setStartDelay = startDelay => {
    this.startDelay = startDelay;
  }

  playScoreAudio(scoreType) {
    const scorePlayer = this.scoreAudios[scoreType];

    if (scorePlayer && scorePlayer.isReady) {
      scorePlayer.player.play();
    }
  }
}
