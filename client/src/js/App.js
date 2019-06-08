import React, { Component } from 'react';
import { render } from 'react-dom';
import _ from 'lodash';
import socket from './socket';
import MyPeerConnection from './MyPeerConnection';
import MainWindow from './MainWindow';
import CallWindow from './CallWindow';
import CallModal from './CallModal';
import '../css/app.scss';
import adapter from 'webrtc-adapter';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientId: '',
      callWindow: '',
      callModal: '',
      callFrom: '',
      localSrc: null,
      peerSrc: null
    };
    this.myPeer = {};
    this.config = null;
    this.startCallHandler = this.startCall.bind(this);
    this.endCallHandler = this.endCall.bind(this);
    this.rejectCallHandler = this.rejectCall.bind(this);
  }

  componentDidMount() {
    socket
      .on('init', data => this.setState({ clientId: data.id }))
      .on('request', data => this.setState({ callModal: 'active', callFrom: data.from }))
      .on('call', (data) => {
        if (data.sdp) {
          this.myPeer.setRemoteDescription(data.sdp);
          if (data.sdp.type === 'offer') this.myPeer.createAnswer();
        } else this.myPeer.addIceCandidate(data.candidate);
      })
      .on('end', this.endCall.bind(this, false))
      .emit('init');
  }

  startCall(isCaller, friendID, config) {
    this.config = config;
    this.myPeer = new MyPeerConnection(friendID)
      .on('localStream', (src) => {
        const newState = { callWindow: 'active', localSrc: src };
        if (!isCaller) newState.callModal = '';
        this.setState(newState);
      })
      .on('peerStream', src => this.setState({ peerSrc: src }))
      .start(isCaller, config);
  }

  rejectCall() {
    socket.emit('end', { to: this.state.callFrom });
    this.setState({ callModal: '' });
  }

  endCall(isStarter) {
    if (_.isFunction(this.myPeer.stop)) this.myPeer.stop(isStarter);
    this.myPeer = {};
    this.config = null;
    this.setState({
      callWindow: '',
      localSrc: null,
      peerSrc: null
    });
  }

  render() {

    console.log(adapter);

    return (
      <div >
        <MainWindow
          clientId={this.state.clientId}
          startCall={this.startCallHandler}
        />
        <CallWindow
          status={this.state.callWindow}
          localSrc={this.state.localSrc}
          peerSrc={this.state.peerSrc}
          config={this.config}
          mediaDevice={this.myPeer.mediaDevice}
          endCall={this.endCallHandler}
          rtcPeerConn={this.myPeer.rtcPeerConn}
        />
        <CallModal
          status={this.state.callModal}
          startCall={this.startCallHandler}
          rejectCall={this.rejectCallHandler}
          callFrom={this.state.callFrom}
        />
      </div >
    );
  }
}

export default App;
