import EventEmitter from './lib/eventEmitter.js';
import FilePicker from './components/filePicker.js';
import TapControls from './components/tapControls.js';
import Scene from './components/scene.js';
import SceneControls from './components/sceneControls.js';
import AudioService from './services/audioService.js';
import AnalyseAnimation from './components/analyseAnimation.js';

class App {
  constructor() {
    const emitter = new EventEmitter();
    const filePicker = new FilePicker({ emitter });
    const audioService = new AudioService({ emitter });
    const tapControls = new TapControls({ emitter });
    const scene = new Scene({ emitter });
    const sceneControls = new SceneControls({ emitter });
    const analyseAnimation = new AnalyseAnimation({ emitter });
  }
}

const app = new App();
