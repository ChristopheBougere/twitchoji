import React, { Component } from 'react';
import crossfilter from 'crossfilter2';
import * as d3 from 'd3';
import dc from 'dc';
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
    this.data.push(JSON.parse(content));
    this.updateCharts();
  }

  getLineChart(mood, color) {
    return dc.lineChart(this.chartComposite)
      .group(this.dimension.group().reduceSum(d => d.mood[mood] / d.number), mood)
      .colors(color);
  }

  initCharts(fromDatetime) {
    const { data } = this.state;
    this.chartRange = dc.barChart('#chartRange');
    this.chartComposite = dc.compositeChart('#chartLine');
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
      .rangeChart(this.chartRange)
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
    this.chartRange
      .width(null)
      .height(null)
      .margins({
        top: 0, right: 50, bottom: 20, left: 40,
      })
      .dimension(this.dimension)
      .group(this.group)
      .x(d3.scaleTime().domain(this.fullDomain))
      .xUnits(d3.timeDay)
      .centerBar(true)
      .gap(1)
      .round(d3.timeMinute.round)
      .alwaysUseRounding(true);
    dc.renderAll();
  }

  updateCharts() {
    const { data } = this.state;
    this.ndx.remove();
    this.ndx.add(data);
    const fromDatetime = new Date();
    fromDatetime.setMinutes(fromDatetime.getMinutes() - 30);
    this.fullDomain = [fromDatetime, new Date()];
    this.chartComposite.x(d3.scaleTime().domain(this.fullDomain));
    this.chartRange.x(d3.scaleTime().domain(this.fullDomain));
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
        <div id="chartLine" />
        <div id="chartRange" />
      </section>
    );
  }
}

export default LiveConfig;
