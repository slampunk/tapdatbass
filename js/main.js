import EventEmitter from './lib/eventEmitter.js';
import RAFLoop from './services/rafLoop.js';
import FilePicker from './components/filePicker.js';
import TapControls from './components/tapControls.js';
import KeybControls from './components/keyboardControls.js';
import Scene from './components/scene.js';
import SceneControls from './components/sceneControls.js';
import AudioService from './services/audioService.js';
import AnalyseAnimation from './components/analyseAnimation.js';
import Notifications from './components/notifications.js';
import ScoreKeeper from './components/scoreKeeper.js';
import Options from './components/options.js';

class App {
  constructor() {
    const emitter = new EventEmitter();
    const rafLoop = new RAFLoop({ emitter });
    const filePicker = new FilePicker({ emitter });
    const audioService = new AudioService({ emitter });
    const tapControls = new TapControls({ emitter });
    const keybControls = new KeybControls({ emitter });
    const scene = new Scene({ emitter });
    const sceneControls = new SceneControls({ emitter });
    const analyseAnimation = new AnalyseAnimation({ emitter });
    const notifications = new Notifications({ emitter });
    const scoreKeeper = new ScoreKeeper({ emitter });
    const options = new Options({ emitter });

    window.emitter = emitter;
    this.attachEvents();
  }

  attachEvents() {
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      this.emitter.emit('track.stop');
      e.returnValue = '';
    }, false);
  }
}

const app = new App();
