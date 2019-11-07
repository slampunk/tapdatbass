import BeatDetectorService from './beatDetectorService.js';
let beatDetector = null;

export default class AudioService {
  constructor(props) {
    this.emitter = props.emitter;
    beatDetector = new BeatDetectorService(props);

    this.attachEvents();
  }

  attachEvents() {
    this.emitter.on('track.load', this.analyse);
    this.emitter.on('track.bpm', this.onTrackBpm);
    this.emitter.on('track.bpm.error', () => this.emitter.emit('track.load.error'));
  }

  onTrackBpm = () => {
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
      .catch(this.onAnalyseError);
  }

  analyseLowPass = buffer => {
    const offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
    const beatSource = offlineContext.createBufferSource();
    const filter = offlineContext.createBiquadFilter();

    offlineContext.oncomplete = beatDetector.calculateBPM;

    beatSource.buffer = buffer;
    filter.frequency.value = 100;

    beatSource.connect(filter);
    filter.connect(offlineContext.destination);

    beatSource.start();
    offlineContext.startRendering();
    return buffer;
  }

  onAnalyseError = err => {
  }
}
