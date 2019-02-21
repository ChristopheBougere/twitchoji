import React, { Component } from 'react';
import 'webrtc-adapter';
import * as faceapi from 'face-api.js';

import constants from '../../constants';
import AngrySvg from './svg/angry.svg';
import DisgustedSvg from './svg/disgusted.svg';
import FearfulSvg from './svg/fearful.svg';
import HappySvg from './svg/happy.svg';
import PlaySvg from './svg/play.svg';
import SadSvg from './svg/sad.svg';
import StopSvg from './svg/stop.svg';
import SurprisedSvg from './svg/surprised.svg';

class Viewer extends Component {
  constructor(props, context) {
    super(props, context);
    this.videoRef = React.createRef();
    this.state = {
      token: null,
      highestMood: null,
      lastUpdate: null,
      modelsLoaded: false,
      detecting: false,
      postDisabled: false,
    };
    this.onBroadcast = this.onBroadcast.bind(this);
    this.onAuthorized = this.onAuthorized.bind(this);
    this.onEmojiClick = this.onEmojiClick.bind(this);
    this.onStartFaceApiClick = this.onStartFaceApiClick.bind(this);
    this.onStopFaceApiClick = this.onStopFaceApiClick.bind(this);
    this.detection = this.detection.bind(this);

    this.styles = {
      container: {
        width: '100%',
      },
      video: {
        display: 'none',
        width: '100%',
      },
      average: {
        width: '90%',
        height: 'calc(90vw)',
        margin: 'auto',
      },
      emojiButton: {
        width: '39%',
        margin: '5%',
        cursor: 'pointer',
      },
      actionButtonContainer: {
        textAlign: 'center',
      },
      actionButton: {
        width: '39%',
        height: 'calc(50vw)',
        margin: 'auto',
        cursor: 'pointer',
      },
    };
  }

  componentDidMount() {
    window.Twitch.ext.onAuthorized(this.onAuthorized);
    window.Twitch.ext.listen('broadcast', this.onBroadcast);
  }

  onAuthorized(auth) {
    this.setState({
      token: auth.token,
    });
  }

  async onBroadcast(target, contentType, content) {
    const { mood } = JSON.parse(content);
    console.log(`Received mood ${JSON.stringify(mood, null, 2)}`);
    const highestMood = Object.keys(mood).reduce((a, b) => (mood[a] > mood[b] ? a : b));
    console.log(`Highest mood: ${highestMood}=${mood[highestMood]}`);
    const now = new Date().getTime();
    this.setState({
      highestMood,
      lastUpdate: now,
    });
    setTimeout(() => {
      const { lastUpdate } = this.state;
      if (lastUpdate === now) {
        this.setState({
          highestMood: null,
          lastUpdate: new Date().getTime(),
        });
      }
    }, 1000);
  }

  onEmojiClick(mood) {
    this.postMood({
      [mood]: 1.0,
    });
  }

  async onStartFaceApiClick() {
    const { modelsLoaded } = this.state;
    if (!modelsLoaded) {
      await faceapi.loadFaceExpressionModel('models');
      await faceapi.loadTinyFaceDetectorModel('models');
      this.setState({
        modelsLoaded: true,
      });
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      this.videoRef.current.srcObject = this.stream;
      this.detectionInterval = setInterval(this.detection, 1000);
      this.setState({
        detecting: true,
      });
    } catch (e) {
      console.warn('Unable to get user media');
    }
  }

  onStopFaceApiClick() {
    clearInterval(this.detectionInterval);
    this.stream.getTracks().forEach(track => track.stop());
    this.setState({
      detecting: false,
    });
  }

  get averageEmoji() {
    const { highestMood } = this.state;
    let img;
    switch (highestMood) {
      case 'angry': img = <AngrySvg />; break;
      case 'disgusted': img = <DisgustedSvg />; break;
      case 'fearful': img = <FearfulSvg />; break;
      case 'happy': img = <HappySvg />; break;
      case 'sad': img = <SadSvg />; break;
      case 'surprised': img = <SurprisedSvg />; break;
      default: break;
    }
    return (
      <div style={this.styles.average}>
        {img}
      </div>
    );
  }

  get emojiButtons() {
    const { detecting } = this.state;
    if (detecting) {
      return null;
    }
    return (
      <div style={{ width: '100%' }}>
        <div>
          <AngrySvg
            style={this.styles.emojiButton}
            alt="Angry"
            title="Angry"
            onClick={() => this.onEmojiClick('angry')}
          />
          <DisgustedSvg
            style={this.styles.emojiButton}
            alt="Disgusted"
            title="Disgusted"
            onClick={() => this.onEmojiClick('disgusted')}
          />
        </div>
        <div>
          <FearfulSvg
            style={this.styles.emojiButton}
            alt="Fearful"
            title="Fearful"
            onClick={() => this.onEmojiClick('fearful')}
          />
          <HappySvg
            style={this.styles.emojiButton}
            alt="Happy"
            title="Happy"
            onClick={() => this.onEmojiClick('happy')}
          />
        </div>
        <div>
          <SadSvg
            style={this.styles.emojiButton}
            alt="Sad"
            title="Sad"
            onClick={() => this.onEmojiClick('sad')}
          />
          <SurprisedSvg
            style={this.styles.emojiButton}
            alt="Surprised"
            title="Surprised"
            onClick={() => this.onEmojiClick('surprised')}
          />
        </div>
      </div>
    );
  }

  get actionButton() {
    const { detecting } = this.state;
    if (detecting) {
      return (
        <div style={this.styles.actionButtonContainer}>
          <StopSvg
            style={this.styles.actionButton}
            alt="Stop"
            title="Stop"
            onClick={this.onStopFaceApiClick}
          />
        </div>
      );
    }
    return (
      <div style={this.styles.actionButtonContainer}>
        <PlaySvg
          style={this.styles.actionButton}
          alt="Start"
          title="Start"
          onClick={this.onStartFaceApiClick}
        />
      </div>
    );
  }

  async detection() {
    if (!this.videoRef.current || this.videoRef.current.paused || this.videoRef.current.ended) {
      return;
    }
    const res = await faceapi.detectSingleFace(this.videoRef.current,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      })).withFaceExpressions();
    if (!res) {
      return;
    }
    const mood = {};
    res.expressions.forEach((m) => {
      mood[m.expression] = m.probability;
    });
    this.postMood(mood);
  }

  async postMood(mood) {
    const { token, postDisabled } = this.state;
    if (postDisabled) {
      console.warn('Too many requests.');
      return {};
    }
    if (!token) {
      console.warn('Unable to post mood: not authorized.');
      return {};
    }
    // Disable sending mood for 0.9 second
    this.setState({
      postDisabled: true,
    });
    setTimeout(() => {
      this.setState({
        postDisabled: false,
      });
    }, 900);
    const res = await fetch(constants.EBS_ENDPOINT, {
      method: 'POST',
      headers: new Headers({
        token,
      }),
      body: JSON.stringify({
        mood,
      }),
      mode: 'cors',
    });
    return res;
  }

  render() {
    return (
      <section style={this.styles.container}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video autoPlay ref={this.videoRef} style={this.styles.video} />
        {this.averageEmoji}
        {this.emojiButtons}
        {this.actionButton}
      </section>
    );
  }
}

export default Viewer;
