import MediaDevice from './MediaDevice';
import Emitter from './Emitter';
import socket from './socket';

const iceServers = { iceServers: [ 
  { urls: ['stun:stun.l.google.com:19302'] }
]};

// ADD More TURN Server

class MyPeerConnection extends Emitter {

  constructor(friendID) {
    super();
    this.rtcPeerConn = new RTCPeerConnection(iceServers);
    this.rtcPeerConn.onicecandidate = event => socket.emit('call', {
      to: this.friendID,
      candidate: event.candidate
    });
    this.rtcPeerConn.onaddstream = event => this.emit('peerStream', event.stream);

    this.mediaDevice = new MediaDevice();
    this.friendID = friendID;
  }
  /**
   * Starting the call
   * @param {Boolean} isCaller
   * @param {Object} config - configuration for the call {audio: boolean, video: boolean}
   */
  start(isCaller, config) {
    this.mediaDevice
      .on('stream', (stream) => {
        this.rtcPeerConn.addStream(stream);
        this.emit('localStream', stream);
        if (isCaller) socket.emit('request', { to: this.friendID });
        else this.createOffer();
      })
      .start(config);

    return this;
  }
  /**
   * Stop the call
   * @param {Boolean} isStarter
   */
  stop(isStarter) {
    if (isStarter) socket.emit('end', { to: this.friendID });
    this.mediaDevice.stop();
    this.rtcPeerConn.close();
    this.rtcPeerConn = null;
    this.off();
    return this;
  }

  createOffer() {
    this.rtcPeerConn.createOffer()
      .then(this.getDescription.bind(this))
      .catch(err => console.log(err));
    return this;
  }

  createAnswer() {
    this.rtcPeerConn.createAnswer()
      .then(this.getDescription.bind(this))
      .catch(err => console.log(err));
    return this;
  }

  getDescription(desc) {
    this.rtcPeerConn.setLocalDescription(desc);
    socket.emit('call', { to: this.friendID, sdp: desc });
    return this;
  }

  /**
   * @param {Object} sdp - Session description
   */
  setRemoteDescription(sdp) {
    const rtcSdp = new RTCSessionDescription(sdp);
    this.rtcPeerConn.setRemoteDescription(rtcSdp);
    return this;
  }
  /**
   * @param {Object} candidate - ICE Candidate
   */
  addIceCandidate(candidate) {
    if (candidate) {
      const iceCandidate = new RTCIceCandidate(candidate);
      this.rtcPeerConn.addIceCandidate(iceCandidate);
    }
    return this;
  }
}

export default MyPeerConnection;
