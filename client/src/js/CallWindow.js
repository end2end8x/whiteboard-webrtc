import React, { Component } from 'react';
import PropTypes from 'proptypes';
import classnames from 'classnames';
import _ from 'lodash';

class CallWindow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Video: true,
      Audio: true
    };

    this.btns = [
      { type: 'Video', icon: 'fa-video-camera' },
      { type: 'Audio', icon: 'fa-microphone' }
    ];
    
    this.drawing = false;
    this.current = {
      color: 'red'
    };

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onDrawingEvent = this.onDrawingEvent.bind(this);

    this.onResize = this.onResize.bind(this);
    this.onColorUpdate = this.onColorUpdate.bind(this);

    this.receiveDataChannelMessage = this.receiveDataChannelMessage.bind(this);
  }

  componentDidMount() {
    this.setMediaStream();
    this.setDataChannel();

    window.addEventListener('resize', this.onResize, false);
    this.onResize();
  }

  componentWillUnmount() {
    if( this.canvas ) {
      this.canvas.removeEventListener('mousedown', this.onMouseDown, false);
      this.canvas.removeEventListener('mouseup', this.onMouseUp, false);
      this.canvas.removeEventListener('mouseout', this.onMouseUp, false);
      this.canvas.removeEventListener('mousemove', this.throttle(this.onMouseMove, 10), false);
      
      //Touch support for mobile devices
      this.canvas.removeEventListener('touchstart', this.onMouseDown, false);
      this.canvas.removeEventListener('touchend', this.onMouseUp, false);
      this.canvas.removeEventListener('touchcancel', this.onMouseUp, false);
      this.canvas.removeEventListener('touchmove', this.throttle(this.onMouseMove, 10), false);
    }

    window.removeEventListener('resize', this.onResize, false);
  }

  componentWillReceiveProps(nextProps) {
    // Initialize when the call started
    if (!this.props.config && nextProps.config) {
      const { config, mediaDevice } = nextProps;
      _.forEach(config, (conf, type) =>
        mediaDevice.toggle(_.capitalize(type), conf));

      this.setState({
        Video: config.video,
        Audio: config.audio
      });
    }
  }

  componentDidUpdate() {
    this.setMediaStream();
    this.setDataChannel();
  }

  setMediaStream() {
    const { peerSrc, localSrc } = this.props;
    if (this.peerVideo && peerSrc) this.peerVideo.srcObject = peerSrc;
    if (this.localVideo && localSrc) this.localVideo.srcObject = localSrc;
  }

  setDataChannel() {
    if( this.canvas ) {
      this.canvas.addEventListener('mousedown', this.onMouseDown, false);
      this.canvas.addEventListener('mouseup', this.onMouseUp, false);
      this.canvas.addEventListener('mouseout', this.onMouseUp, false);
      this.canvas.addEventListener('mousemove', this.throttle(this.onMouseMove, 10), false);
      
      //Touch support for mobile devices
      this.canvas.addEventListener('touchstart', this.onMouseDown, false);
      this.canvas.addEventListener('touchend', this.onMouseUp, false);
      this.canvas.addEventListener('touchcancel', this.onMouseUp, false);
      this.canvas.addEventListener('touchmove', this.throttle(this.onMouseMove, 10), false);

      this.canvasCtx = this.canvas.getContext('2d');


      this.black.addEventListener('click', this.onColorUpdate, false);
      this.red.addEventListener('click', this.onColorUpdate, false);
      this.green.addEventListener('click', this.onColorUpdate, false);
      this.blue.addEventListener('click', this.onColorUpdate, false);
      this.yellow.addEventListener('click', this.onColorUpdate, false);

    } 

    const { status, rtcPeerConn } = this.props;
    if(status == 'active') {
      console.log("setDataChannel status " + status);

      const dataChannelOptions = {
          ordered: false, // guarantee order
          maxPacketLifeTime: 3000, // in milliseconds
      };

      rtcPeerConn.ondatachannel = (event) => {
        console.log("rtcPeerConn ondatachannel");
        this.dataChannel = event.channel;
        this.dataChannel.onmessage = this.receiveDataChannelMessage;
      }

      if(!this.dataChannel) {
        this.dataChannel = rtcPeerConn.createDataChannel('drawing', dataChannelOptions);
      }

      if(this.dataChannel) {
        this.dataChannel.onerror = (error) => {
          console.log("Data Channel onerror:", error);
        };

        this.dataChannel.onopen = () => {
          if (this.dataChannel.readyState === 'open') {
            this.dataChannel.send("Ping");
            console.log("dataChannel onopen");
            this.dataChannel.onmessage = this.receiveDataChannelMessage
          }
        };

        this.dataChannel.onclose = () => {
          console.log("Data Channel onclose");
        };
      } else {
        console.log("PeerConnection null");
      }

    }
  }

  receiveDataChannelMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.onDrawingEvent(data);
    } catch(e) {
      console.log("receiveDataChannelMessage ", event.data);
    }
  } 

  toggleMediaDevice(deviceType) {
    this.setState({
      [deviceType]: !this.state[deviceType]
    });
    this.props.mediaDevice.toggle(deviceType);
  }

  drawLine(x0, y0, x1, y1, color, sendData) {
    // draw
    this.canvasCtx.beginPath();
    this.canvasCtx.moveTo(x0, y0);
    this.canvasCtx.lineTo(x1, y1);
    this.canvasCtx.strokeStyle = color;
    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.stroke();
    this.canvasCtx.closePath();

    if (sendData == true) { 
      // send data channel
      var w = this.canvas.width;
      var h = this.canvas.height;
      var jsonData = {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color
      }
      if(this.dataChannel ) {
        this.dataChannel.send(JSON.stringify(jsonData));
      } 
    }

  }

  onMouseDown(e) {
    this.drawing = true;
    this.current.x = e.clientX||e.touches[0].clientX;
    this.current.y = e.clientY||e.touches[0].clientY;
  }

  onMouseUp(e){
    if (!this.drawing) { return; }
    this.drawing = false;
    this.drawLine(this.current.x, this.current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, this.current.color, true);
  }

  onMouseMove(e){
    if (!this.drawing) { return; }
    this.drawLine(this.current.x, this.current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, this.current.color, true);
    this.current.x = e.clientX||e.touches[0].clientX;
    this.current.y = e.clientY||e.touches[0].clientY;
  }

  onColorUpdate(e){
    this.current.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
        // console.log('throttle');
      }
    };
  }

  onDrawingEvent(data) {
    if( this.canvas ) {
      var w = this.canvas.width;
      var h = this.canvas.height;
      this.drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, false);
    }
  }

  onResize() {
    if( this.canvas ) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  renderControlButtons() {
    const getClass = (icon, type) => classnames(`btn-action fa ${icon}`, {
      disable: !this.state[type]
    });

    return this.btns.map(btn => (
      <button
        key={`btn${btn.type}`}
        className={getClass(btn.icon, btn.type)}
        onClick={() => this.toggleMediaDevice(btn.type)}
      />
    ));
  }

  render() {
    const { status } = this.props;

    return (
      <div className={classnames('call-window', status)}>

        <div class="colors">
          <div class="color black" ref={el => this.black = el} ></div>
          <div class="color red" ref={el => this.red = el} ></div>
          <div class="color green" ref={el => this.green = el} ></div>
          <div class="color blue" ref={el => this.blue = el} ></div>
          <div class="color yellow" ref={el => this.yellow = el} ></div>
        </div>

        <canvas id="canvas" ref={el => this.canvas = el} />

        <video id="peerVideo" ref={el => this.peerVideo = el} autoPlay />
        <video id="localVideo" ref={el => this.localVideo = el} autoPlay muted />
        <div className="video-control">
          {this.renderControlButtons()}
          <button
            className="btn-action hangup fa fa-phone"
            onClick={() => this.props.endCall(true)}
          />
        </div>
      </div>
    );
  }
}

CallWindow.propTypes = {
  status: PropTypes.string.isRequired,
  localSrc: PropTypes.object, // eslint-disable-line
  peerSrc: PropTypes.object, // eslint-disable-line
  config: PropTypes.object, // eslint-disable-line
  mediaDevice: PropTypes.object, // eslint-disable-line
  endCall: PropTypes.func.isRequired,
  rtcPeerConn: PropTypes.object, // eslint-disable-line
};

export default CallWindow;
