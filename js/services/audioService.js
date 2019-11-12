import BeatDetectorService from './beatDetectorService.js';
let beatDetector = null;

export default class AudioService {
  constructor(props) {
    this.emitter = props.emitter;

    this.audioBuffer = null;
    this.source = null;
    this.lpSource = null;
    this.fftSize = 1024;

    this.trackBpm = 0;
    this.threshold = 0;
    this.thresholdScaler = 0.85;

    this.isPlaying = false;

    beatDetector = new BeatDetectorService(props);

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('track.load', this.analyse);
    this.emitter.on('track.analysis', this.onTrackBpm);
    this.emitter.on('track.bpm.error', () => this.emitter.emit('track.load.error'));
    this.emitter.on('track.play', this.play);
    this.emitter.on('track.stop', this.stop);
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
    filter.connect(compressor);
    // filter.connect(offlineContext.destination);
    compressor.connect(offlineContext.destination);

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

    const { context, analyser, lpAnalyser, filter } = this.setupTrackingAnalysers();

    this.trackBeats(lpAnalyser);

    this.source = context.createBufferSource();
    this.lpSource = context.createBufferSource();

    this.source.buffer = this.audioBuffer;
    this.lpSource.buffer = this.audioBuffer;

    this.lpSource.connect(lpAnalyser);
    this.source.connect(analyser);

    this.lpSource.start(0);
    this.source.start(0);
  }

  stop = () => {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;
    this.source.stop();
    this.lpSource.stop();
  }

  setupTrackingAnalysers() {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    const lpAnalyser = context.createAnalyser();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();

    compressor.threshold.value = -12;
    compressor.knee.value = 40;
    compressor.ratio.value = 2;
    compressor.attack.value = 0;
    compressor.release.value = .25;

    analyser.fftSize = this.fftSize;
    lpAnalyser.fftSize = this.fftSize;

    filter.type = 'lowpass';
    filter.frequency.value = 100;

    filter.connect(compressor);
    lpAnalyser.connect(filter);
    analyser.connect(gainNode);
    //gainNode.connect(context.destination);
    compressor.connect(context.destination);

    return { context, analyser, lpAnalyser, filter };
  }

  trackBeats(lpAnalyser) {
    let dataArray = new Uint8Array(this.fftSize);
    let inBeat = false;

    const emitOnBeat = () => {
      lpAnalyser.getByteTimeDomainData(dataArray);

      let total = 0;
      for (let i = 0; i < this.fftSize; i++) {
        if (dataArray[i] >= this.threshold && !inBeat) {
          inBeat = true;
          this.emitter.emit('beatArrow');
          setTimeout(() => {
            inBeat = false;
          }, ( 30 / this.trackBpm ) * 990);
        }
      }

      if (this.isPlaying) {
        requestAnimationFrame(emitOnBeat);
      }
    }

    emitOnBeat();
  }
}
