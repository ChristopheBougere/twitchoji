import React, { Component } from 'react';

import './live-config.css';

class LiveConfig extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {};
  }

  componentDidMount() {
    window.Twitch.ext.onAuthorized(auth => {
      console.log(auth);
    });
  }

  componentWillUnmount() {}

  render() {
    return <section className='LiveConfig'>LiveConfig</section>;
  }
}

export default LiveConfig;
