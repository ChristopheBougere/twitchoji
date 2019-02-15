var EBS_ENDPOINT = 'https://yo1yc4g2z0.execute-api.us-east-1.amazonaws.com/dev/moods';
var twitch = window.Twitch.ext;
var context;
var token;
var tuid;
var detectionInterval;
var averageMood;
var chartBar;
var chartMove;
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
  displayChartLine();
  twitch.listen('broadcast', function (target, contentType, content) {
    log(content);
    averageMood = JSON.parse(content);
    var userNumber = averageMood.number
    delete averageMood.number;
    displayBarChar(averageMood, userNumber);
  });
});

function getHistory() {
  fetch(EBS_ENDPOINT, {
    method: 'GET',
    headers: new Headers({
      Token: token,
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

function initChartVolume(history) {
  ndx = crossfilter(history);
  moodDimension = ndx.dimension(function (d) { return d.date; });
  sumGroup = moodDimension.group().reduceSum(function (d) { return (d.value); });

  volumeChart = dc.volumeChart('#chartVolume');
  volumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
    .height(40)
    .margins({ top: 0, right: 50, bottom: 20, left: 40 })
    .dimension(moveMonths)
    .group(volumeByMonthGroup)
    .centerBar(true)
    .gap(1)
    .x(d3.scaleTime().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)]))
    .round(d3.timeMonth.round)
    .alwaysUseRounding(true)
    .xUnits(d3.timeMonths);
}
function remap(input) {
  return Object.keys(input).map(function (expression) {
    return {
      expression: expression,
      value: input[expression],
    };
  });
}

