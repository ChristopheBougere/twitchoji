import React, { Component } from 'react';
import dc, { crossfilter } from 'dc';
import { scaleTime } from 'd3-scale';
import { timeDay } from 'd3-time';
import { curveBasis } from 'd3-shape';
import 'dc/dc.css';
import './index.css';

import constants from '../../constants';

class LiveConfig extends Component {
  static formatDatetime(dateObj) {
    return `${dateObj.toISOString().split('.')[0]}Z`;
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      token: null,
      data: [],
    };
    this.onBroadcast = this.onBroadcast.bind(this);
    this.onAuthorized = this.onAuthorized.bind(this);

    this.styles = {
      seriesChart: {
        overflow: 'hidden',
      },
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
    const toDatetime = new Date();
    toDatetime.setMinutes(toDatetime.getMinutes() + 1);
    const data = await this.loadData({
      datetime: fromDatetime.toISOString(),
      operator: '>',
    });
    const rows = [];
    data.forEach((item) => {
      Object.keys(item.mood).forEach((mood) => {
        rows.push({
          datetime: item.datetime,
          mood,
          value: item[mood] * 100,
          number: item.number,
        });
      });
    });
    this.setState({
      data: rows,
    });

    this.initCharts(fromDatetime, toDatetime);
    window.Twitch.ext.listen('broadcast', this.onBroadcast);
  }

  async onBroadcast(target, contentType, content) {
    const { data } = this.state;
    console.log('broadcast', content);
    const item = JSON.parse(content);
    // If we already have the item, don't add it
    if (data.find(d => d.datetime === item.datetime)) {
      return;
    }
    const rows = [];
    Object.keys(item.mood).forEach((mood) => {
      rows.push({
        datetime: item.datetime,
        mood,
        value: item[mood] * 100,
        number: item.number,
      });
    });

    this.setState(prevState => ({
      data: [
        ...prevState.data,
        ...rows,
      ],
    }));
    this.updateCharts();
  }

  // getLineChart(mood, color) {
  //   return dc.lineChart(this.chartComposite)
  //     .curve(curveBasis)
  //     .group(this.dimension.group().reduceSum(d => d.mood[mood] / d.number), mood)
  //     .colors(color);
  // }

  initCharts(fromDatetime, endDate) {
    const { data } = this.state;
    this.chartComposite = dc.seriesChart('#seriesChart');
    this.ndx = crossfilter(data);
    this.dimension = this.ndx.dimension(d => [d.mood, new Date(d.datetime)]);
    this.group = this.dimension.group().reduceSum(d => d.number);
    this.fullDomain = [fromDatetime, endDate];

    this.chartComposite
      .width(null)
      .height(275)
      .chart(c => console.log(c) && dc.lineChart(c).curve(curveBasis))
      .x(scaleTime().domain(this.fullDomain))
      .xUnits(timeDay)
      .brushOn(false)
      .yAxisLabel('Mood %')
      // .clipPadding(10)
      .elasticY(true)
      .dimension(this.dimension)
      .group(this.group)
      // .mouseZoomable(true)
      .seriesAccessor(d => d.key[0]) // mood
      .keyAccessor(d => d.key[1]) // datetime
      .valueAccessor(d => d.value) // mood %
      .legend(dc.legend().autoItemWidth(true).horizontal(true));
    // .legend(dc.legend().x(350).y(350).itemHeight(13).gap(5).horizontal(1).legendWidth(140).itemWidth(70));
  // chart.yAxis().tickFormat(function(d) {return d3.format(',d')(d+299500);});
  // chart.margins().left += 40;
    // this.chartComposite
    //   .width(null)
    //   .height(275)
    //   .margins({
    //     top: 30, right: 50, bottom: 25, left: 40,
    //   })
    //   .transitionDuration(0)
    //   .dimension(this.dimension)
    //   .x(scaleTime().domain(this.fullDomain))
    //   .xUnits(timeDay)
    //   .brushOn(false)
    //   .elasticY(true)
    //   .legend(dc.legend().autoItemWidth(true).horizontal(true))
    //   .yAxisLabel("mood %")
    //   .title((d) => {
    //     const { data: newData } = this.state;
    //     const date = LiveConfig.formatDatetime(d.key);
    //     const { number } = newData.find(i => i.datetime === date);
    //     return `Total users: ${number}`;
    //   })
    //   .compose([
    //     this.getLineChart('fearful', 'black'),
    //     this.getLineChart('sad', 'pink'),
    //     this.getLineChart('happy', 'orange'),
    //     this.getLineChart('disgusted', 'green'),
    //     this.getLineChart('angry', 'red'),
    //     this.getLineChart('surprised', 'blue'),
    //   ]);
    dc.renderAll();
  }

  updateCharts() {
    const { data } = this.state;
    this.ndx.remove();
    this.ndx.add(data);

    const fromDatetime = new Date();
    fromDatetime.setMinutes(fromDatetime.getMinutes() - 30);
    const toDatetime = new Date();
    toDatetime.setMinutes(toDatetime.getMinutes() + 1);

    this.fullDomain = [fromDatetime, toDatetime];
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
        <div id="seriesChart" style={this.styles.seriesChart} />
      </section>
    );
  }
}

export default LiveConfig;
