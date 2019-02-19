import React, { Component } from 'react';
import dc, { crossfilter } from 'dc';
import { scaleTime } from 'd3-scale';
import { timeDay, timeMinute } from 'd3-time';
import 'dc/dc.css';
import './index.css';

import constants from '../../constants';

class LiveConfig extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      token: null,
      data: [],
    };
    this.onBroadcast = this.onBroadcast.bind(this);
    this.onAuthorized = this.onAuthorized.bind(this);

    this.styles = {
      compositeChar: {
        overflowX: 'hidden';
      }
    };
  }

  componentDidMount() {
    window.Twitch.ext.onAuthorized(this.onAuthorized);
  }

  async onAuthorized(auth) {
    this.setState({
      token: auth.token,
    });
    const fromDatetime = new Date();
    fromDatetime.setMinutes(fromDatetime.getMinutes() - 30);
    const data = await this.loadData({
      datetime: fromDatetime.toISOString(),
      operator: '>',
    });
    this.setState({
      data,
    });
    this.initCharts(fromDatetime);
    window.Twitch.ext.listen('broadcast', this.onBroadcast);
  }

  async onBroadcast(target, contentType, content) {
    this.setState(prevState => ({
      data: [
        ...prevState.data,
        JSON.parse(content),
      ],
    }));
    this.updateCharts();
  }

  formatDatetime(dateObj) {
    return `${dateObj.toISOString().split('.')[0]}Z`;
  }
  
  getLineChart(mood, color) {
    return dc.lineChart(this.chartComposite)
      .group(this.dimension.group().reduceSum(d => d.mood[mood] / d.number), mood)
      .colors(color);
  }

  initCharts(fromDatetime) {
    const { data } = this.state;
    this.chartComposite = dc.compositeChart('#compositeChar');
    this.ndx = crossfilter(data);
    this.dimension = this.ndx.dimension(d => new Date(d.datetime));
    this.group = this.dimension.group().reduceSum(d => d.number);
    this.fullDomain = [fromDatetime, new Date()];

    this.chartComposite
      .width(null)
      .height(null)
      .transitionDuration(1000)
      .mouseZoomable(true)
      .margins({
        top: 30, right: 50, bottom: 25, left: 40,
      })
      .dimension(this.dimension)
      .x(scaleTime().domain(this.fullDomain))
      .xUnits(timeDay)
      .brushOn(false)
      .elasticY(true)
      .legend(dc.legend().autoItemWidth(true).horizontal(true))
      .title((d) => {
        const date =this.formatDatetime(d.key)
        const number = this.state.data.find( i => i.datetime === date).number;
        return `Total users: ${number}`;
      })
      .compose([
        this.getLineChart('fearful', 'blue'),
        this.getLineChart('sad', 'pink'),
        this.getLineChart('happy', 'orange'),
        this.getLineChart('disgusted', 'green'),
        this.getLineChart('angry', 'red'),
        this.getLineChart('surprised', 'black'),
      ])
    dc.renderAll();
  }

  updateCharts() {
    const { data } = this.state;
    this.ndx.remove();
    this.ndx.add(data);
    const fromDatetime = new Date();
    fromDatetime.setMinutes(fromDatetime.getMinutes() - 30);
    this.fullDomain = [fromDatetime, new Date()];
    this.chartComposite.x(scaleTime().domain(this.fullDomain));
    dc.redrawAll();
  }

  async loadData(params = {}) {
    const { token } = this.state;
    if (!token) {
      console.warn('Unable to get mood: not authorized.');
      return [];
    }
    const url = new URL(constants.EBS_ENDPOINT);
    let offset;
    let items;
    const rows = [];
    do {
      const obj = { ...params };
      if (offset) {
        obj.offset = offset;
      }
      url.search = new URLSearchParams(obj);
      const res = await fetch(url, { // eslint-disable-line no-await-in-loop
        method: 'GET',
        headers: new Headers({
          Token: token,
        }),
        mode: 'cors',
      });
      ({ offset, items } = await res.json()); // eslint-disable-line no-await-in-loop
      rows.push(...items);
    } while (offset);
    return rows;
  }

  render() {
    return (
      <section>
        <div id="compositeChar" style={this.styles.compositeChart} />
      </section>
    );
  }
}

export default LiveConfig;
