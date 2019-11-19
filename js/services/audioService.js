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

    this.trackBpm = 0;
    this.threshold = 0;
    this.thresholdScaler = 0.85;

    this.startDelay = 0;
    this.isPlaying = false;

    this.shakeBeat = 0;

    beatDetector = new BeatDetectorService(props);

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('track.load', this.analyse);
    this.emitter.on('track.analysis', this.onTrackBpm);
    this.emitter.on('track.bpm.error', () => this.emitter.emit('track.load.error'));
    this.emitter.on('track.play', this.play);
    this.emitter.on('track.stop', this.stop);
    this.emitter.on('game.start.delay', this.setStartDelay);
  }

  onTrackBpm = (details) => {
    this.threshold = (details.threshold + 1) * 0x80 * this.thresholdScaler;
    this.trackBpm = details.bpm;
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
      }, 1000);
    }
  }

  stop = () => {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    this.source.stop();
    this.lpSource.stop();
    this.emitter.emit('rafloop.unsubscribe', this.loopToken);
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
}
