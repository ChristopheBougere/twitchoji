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
    initCharts();
  }

  twitch.listen('broadcast', function (target, contentType, content) {
    log(content);
    averageMood = JSON.parse(content);
    var userNumber = averageMood.number
    delete averageMood.number;
    ChartBar(averageMood, userNumber);
  });
});

async function  initCharts() {
  var history = getHistory();
  // var chartBar = dc.lineChart("#chartLine");
  // var chartRange = dc.lineChart("#chartRange");
  // var fullDomain = [data[0].date, data.slice(-1)[0].date];
  // var dimension = crossfilter(data).dimension(function (d) {
  //   return d.date;
  // });
}

async function getHistory() {
  await fetch(EBS_ENDPOINT, {
    method: 'GET',
    headers: new Headers({
      Token: token,
      operator: ">",
    }),
    mode: 'cors',
  }).then(response => response.json())
    .then(data => {
      log(JSON.stringify(data)) // Prints result from `response.json()` in getRequest
      return data;
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

