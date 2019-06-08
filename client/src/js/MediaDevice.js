import _ from 'lodash';
import Emitter from './Emitter';

/**
 * Manage all media devices
 */
class MediaDevice extends Emitter {
  /**
   * Start media devices and send stream
   */

  start() {
    const constraints = {
      video: {
        facingMode: 'user',
        height: { min: 360, ideal: 720, max: 1080 }
      },
      audio: true
    };

    var localVideo = document.getElementById('localVideo');

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.stream = stream;
        // this.drawToCanvas();
        this.emit('stream', stream);
      })
      .catch(err => console.log(err));

    return this;
  }

  drawToCanvas() {
    var whiteBoard =  document.getElementById('whiteBoard');
    var localVideo = document.getElementById('localVideo');
    whiteBoard.getContext( '2d' ).drawImage( localVideo, 0, 0, whiteBoard.width, whiteBoard.height );
    // requestAnimationFrame( this.drawToCanvas );
  }

  /**
   * Turn on/off a device
   * @param {String} type - Type of the device
   * @param {Boolean} [on] - State of the device
   */
  toggle(type, on) {
    const len = arguments.length;
    if (this.stream) {
      this.stream[`get${type}Tracks`]().forEach((track) => {
        const state = len === 2 ? on : !track.enabled;
        _.set(track, 'enabled', state);
      });
    }
    return this;
  }

  /**
   * Stop all media track of devices
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    return this;
  }
}

export default MediaDevice;
