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

  // twitch.listen('broadcast', function (target, contentType, content) {
  //   log(content);
  //   averageMood = JSON.parse(content);
  //   var userNumber = averageMood.number
  //   delete averageMood.number;
  //   ChartBar(averageMood, userNumber);
  // });
});
async function loadData() {
  var url = new URL(EBS_ENDPOINT);
  url.search = new URLSearchParams('{"operator":">"}');
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


function initCharts(history) {
  chartRange = dc.barChart("#chartRange");
  chartLine = dc.lineChart("#chartLine")
  var fromDate = (history.items[0] && new Date(history.items[0].datetime)) || new Date();
  var fullDomain = [fromDate, new Date()];
  var dimension = crossfilter(history.items).dimension(function (d) {
    return new Date(d.datetime);
  });

  var numberUserByGroup = dimension.group().reduceSum(function (d) {
    return d.number;
  });

  chartLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
    .renderArea(true)
    .width(null)
    .height(null)
    .transitionDuration(1000)
    .margins({ top: 30, right: 50, bottom: 25, left: 40 })
    .dimension(dimension)
    .mouseZoomable(true)
    .rangeChart(chartRange)
    .x(d3.scaleTime().domain(fullDomain))
    .round(d3.timeMinute.round)
    .xUnits(d3.timeDay)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .group(dimension.group().reduceSum(function (d) {
      return d.number;
    }), 'Monthly Index Average')
    .valueAccessor(function (d) {
      return d.value.avg;
    })

  chartRange
    .width(null)
    .height(null)
    .margins({ top: 0, right: 50, bottom: 20, left: 40 })
    .dimension(dimension)
    .group(numberUserByGroup)
    .x(d3.scaleTime().domain(fullDomain))
    .xUnits(d3.timeDay)
    .centerBar(true)
    .gap(1)
    .round(d3.timeMinute.round)
    .alwaysUseRounding(true);
  chartRange.on('filtered.dynamic-interval', function (_, filter) {
    chartLine.group(choose_group(filter || fullDomain));
  });
  chartRange.yAxis().tickFormat(function (v) { return ""; });

  dc.renderAll();
}