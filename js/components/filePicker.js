export default class FilePicker {
  constructor(props) {
    this.emitter = props.emitter;
    this.fileInput = document.querySelector('input[type=file]');
    this.fileDisplay = document.getElementsByClassName('fileDisplay')[0];

    this.fileInput.addEventListener('change', this.setLocalSong, false);
  }

  setLocalSong = e => {
    const track = e.target.files[0];
    if (track) {
      this.emitter.emit('track.stop');
      this.emitter.emit('track.load', track);
      this.fileDisplay.setAttribute('data-song', track.name.replace('.mp3', ''));
    }
  }
}
