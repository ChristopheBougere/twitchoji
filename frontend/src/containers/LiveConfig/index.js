import React, { Component } from 'react';
import dc, { crossfilter, d3 } from 'dc';
import 'dc/dc.css';

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
  }

  componentDidMount() {
    window.Twitch.ext.onAuthorized(this.onAuthorized);
    window.Twitch.ext.listen('broadcast', this.onBroadcast);
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

  getLineChart(mood, color) {
    return dc.lineChart(this.chartComposite)
      .group(this.dimension.group().reduceSum(d => d.mood[mood] / d.number), mood)
      .colors(color);
  }

  initCharts(fromDatetime) {
    const { data } = this.state;
    this.chartComposite = dc.compositeChart('#compositeChart');
    this.ndx = crossfilter(data);
    this.dimension = this.ndx.dimension(d => new Date(d.datetime));
    this.group = this.dimension.group().reduceSum(d => d.number);
    this.fullDomain = [fromDatetime, new Date()];

    this.chartComposite
      .width(null)
      .height(null)
      .transitionDuration(1000)
      .margins({
        top: 30, right: 50, bottom: 25, left: 40,
      })
      .dimension(this.dimension)
      .x(d3.scaleTime().domain(this.fullDomain))
      .xUnits(d3.timeDay)
      .brushOn(false)
      .elasticY(true)
      .renderHorizontalGridLines(true)
      .legend(dc.legend().autoItemWidth(true).horizontal(true))
      .compose([
        this.getLineChart('fearful', 'blue'),
        this.getLineChart('sad', 'pink'),
        this.getLineChart('happy', 'orange'),
        this.getLineChart('disgusted', 'green'),
        this.getLineChart('angry', 'red'),
        this.getLineChart('surprised', 'black'),
      ]);
    dc.renderAll();
  }

  updateCharts() {
    const { data } = this.state;
    this.ndx.remove();
    this.ndx.add(data);
    console.info("new data to display ["+data+"]");
    const fromDatetime = new Date();
    fromDatetime.setMinutes(fromDatetime.getMinutes() - 30);
    this.fullDomain = [fromDatetime, new Date()];
    this.chartComposite.x(d3.scaleTime().domain(this.fullDomain));
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
        <div id="compositeChart" />
      </section>
    );
  }
}

export default LiveConfig;
