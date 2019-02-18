import React, { Component } from 'react';
import 'webrtc-adapter';
import * as faceapi from 'face-api.js';

import { EBS_ENDPOINT } from '../../constants';
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
    };
    this.onBroadcast = this.onBroadcast.bind(this);
    this.onAuthorized = this.onAuthorized.bind(this);
    this.onEmojiClick = this.onEmojiClick.bind(this);
    this.startFaceApi = this.startFaceApi.bind(this);
    this.stopFaceApi = this.stopFaceApi.bind(this);

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
      actionButton: {
        width: '39%',
        height: 'calc(50vw)',
        margin: 'auto',
        display: 'none',
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
    const highestMood = Object.keys(mood).reduce(function(a, b) {
      return mood[a] > mood[b] ? a : b;
    });
    console.log(`Highest mood: ${highestMood}=${mood[highestMood]}`);
    const now = new Date().getTime();
    this.setState({
      highestMood,
      lastUpdate: now,
    });
    setTimeout(() => {
      if (this.state.lastUpdate === now) {
        this.setState({
          highestMood: null,
          lastUpdate: new Date().getTime(),
        });
      }
    }, 1000);
  }

  componentWillUnmount() {}

  onEmojiClick(mood) {
    this.postMood({
      [mood]: 1.,
    });
  }

  async startFaceApi() {
    if (!this.state.modelsLoaded) {
      await faceapi.loadFaceExpressionModel('/models');
      await faceapi.loadTinyFaceDetectorModel('/models');
      this.setState({
        modelsLoaded: true,
      });
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    } catch (e) {
      console.warn('Unable to get user media');
    }
    this.videoRef.current.srcObject = stream;
    this.detectionInterval = setInterval(this.detectionInterval, 1000);
    this.setState({
      detecting: true,
    });
  }

  stopFaceApi() {
    clearInterval(this.detectionInterval);
    this.setState({
      detecting: false,
    });
  }

  async postMood(mood) {
    if (!this.state.token) {
      console.warn('Unable to post mood: not authorized.');
      return;
    }
    const res = await fetch(EBS_ENDPOINT, {
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

  get averageEmoji() {
    let img;
    switch (this.state.highestMood) {
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
    if (this.state.detecting) {
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
    if (this.state.detecting) {
      return (
        <StopSvg
          style={this.styles.actionButton}
          alt="Stop"
          title="Stop"
          onClick={this.stopFaceApi}
        />
      );
    } else {
      return (
        <PlaySvg
          style={this.styles.actionButton}
          alt="Start"
          title="Start"
          onClick={this.startFaceApi}
        />
      );
    }
  }

  render() {
    return (
      <section style={this.styles.container}>
        <video autoPlay ref={this.videoRef} style={this.styles.video} />
        {this.averageEmoji}
        {this.emojiButtons}
        {this.actionButton}
      </section>
    );
  }
}

export default Viewer;
