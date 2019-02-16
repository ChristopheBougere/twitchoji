var EBS_ENDPOINT = 'https://yo1yc4g2z0.execute-api.us-east-1.amazonaws.com/dev/moods';
var twitch = window.Twitch.ext;
var context;
var token;
var tuid;
var detectionInterval;
var averageMood;
var chartBar;
var chartRange;
var ndx;
var moodDimension;

function nonzero_min(chart) {
  dc.override(chart, "yAxisMin", function () {
      var min = d3.min(chart.data(), function (layer) {
          return d3.min(layer.values, function (p) {
              return p.y + p.y0;
          });
      });
      return dc.utils.subtract(min, chart.yAxisPadding());
  });
  return chart;
}

var groups_by_min_interval = [
  {
    name: 'minutes',
    threshold: 60 * 60 * 1000,
    interval: d3.timeMinute
  }, {
    name: 'seconds',
    threshold: 60 * 1000,
    interval: d3.timeSecond
  }, {
    name: 'milliseconds',
    threshold: 0,
    interval: d3.timeMillisecond
  }
];

function log(message) {
  if (typeof message === 'string') {
    twitch.rig.log(message);
  }
  console.log(message);
}

twitch.onContext(function (c) {
  context = c;
});

twitch.onAuthorized(function (auth) {
  token = auth.token;
  tuid = auth.userId;
  if (!chartBar) {
    console.log("Init Charts")
    loadData();
  }

  twitch.listen('broadcast', function (target, contentType, content) {
    log(content);
    averageMood = JSON.parse(content);
    var userNumber = averageMood.number
    delete averageMood.number;
    ChartBar(averageMood, userNumber);
  });
});
function loadData(){
  getHistory('{"operator":">"}');
}
 function initCharts(history) {
  log(JSON.stringify(history))
  var chartBar = dc.lineChart("#chartLine");
  var chartRange = dc.lineChart("#chartRange");
  var fullDomain = [history.items[0].datetime, new Date()];
  var dimension = crossfilter(history.items).dimension(function (d) {
    return d.datetime;
  });
  function make_group(interval) {
    return dimension.group(interval).reduce(
      function (p, v) {
        p.count++;
        p.total += v.value;
        return p;
      },
      function (p, v) {
        p.count--;
        p.total += v.value;
        return p;
      },
      function () {
        return { count: 0, total: 0 };
      }
    );
  }
  chart
    .width(800)
    .height(300)
    .dimension(dimension)
    .group(choose_group(fullDomain))
    .yAxisPadding(0.1)
    .valueAccessor(function (kv) { return kv.mood.angry / kv.number; })
    .rangeChart(rangeChart)
    .x(d3.scaleTime().domain(fullDomain))
    .xUnits(d3.timeDay)
    .brushOn(false)
    .mouseZoomable(true)
    .zoomScale([1, 100])
    .zoomOutRestrict(true)
    .renderVerticalGridLines(true)
    .elasticY(true)
    .transitionDuration(100);
  nonzero_min(chart);
  rangeChart
    .width(800)
    .height(100)
    .dimension(dimension)
    .group(groups_by_min_interval[0].group)
    .yAxisPadding(1)
    .valueAccessor(function (kv) { return kv.mood.angry / kv.number; })
    .x(d3.scaleTime().domain(fullDomain))
    .xUnits(d3.timeDay);
  rangeChart.on('filtered.dynamic-interval', function (_, filter) {
    chart.group(choose_group(filter || fullDomain));
  });
  chart.yAxis().tickFormat(function (t) {
    return t.toFixed(0);
  });
  rangeChart.yAxis().tickFormat(function (t) {
    return "";
  });
  rangeChart.yAxis().ticks(0);
  dc.renderAll();
}

async function getHistory(params) {
  var url = new URL(EBS_ENDPOINT);
  url.search = new URLSearchParams(params)
  await fetch(url, {
    method: 'GET',
    headers: new Headers({
      Token: token,
    }),
    mode: 'cors',
  }).then(response => response.json())
    .then(data => {
      log(JSON.stringify(data))
      initCharts(data);
    })
    .catch(error => console.error(error));
}

function displayChartBar(averageMood, userNumber) {
  log("Starting displayChartBar");
  var json = remap(averageMood);
  log(JSON.stringify(json, null, 2));

  if (!chartBar) {
    initChartRange();
    ndx = crossfilter(json);
    moodDimension = ndx.dimension(function (d) { return d.expression; });
    sumGroup = moodDimension.group().reduceSum(function (d) { return (d.value); });
    chartBar = dc.barChart("#barChar");
    chartBar
      .width(null)
      .height(null)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .xAxisLabel('Expression')
      .yAxisLabel('%')
      .dimension(moodDimension)
      .barPadding(0.1)
      .outerPadding(0.05)
      .group(sumGroup);
    chartBar.render();
  } else {
    ndx.remove();
    ndx.add(json);
    moodDimension = ndx.dimension(function (d) { return d.expression; });
    sumGroup = moodDimension.group().reduceSum(function (d) { return (d.value); });
    chart.group(sumGroup);
    dc.redrawAll();
  }
  log("Ending displayChartBar");
}

function displayChartLine() {
  log("Starting displayChartLine");
  chartBar = dc.lineChart('#chartLine');
  var history = getHistory();
  log(JSON.stringify(history));
  initChartVolume(history);

  log("Ending displayChartLine");

}

function initChartRange(history) {
  ndx = crossfilter(history);
  moodDimension = ndx.dimension(function (d) { return d.date; });
  sumGroup = moodDimension.group().reduceSum(function (d) { return (d.value); });

  rangeChart
    .width(800)
    .height(100)
    .dimension(dimension)
    .group(groups_by_min_interval[0].group)
    .yAxisPadding(1)
    .valueAccessor(function (kv) { return kv.value.total / kv.value.count; })
    .x(d3.scaleTime().domain(fullDomain))
    .xUnits(d3.timeDay);
  rangeChart.on('filtered.dynamic-interval', function (_, filter) {
    chart.group(choose_group(filter || fullDomain));
  });
}
function remap(input) {
  return Object.keys(input).map(function (expression) {
    return {
      expression: expression,
      value: input[expression],
    };
  });
}

