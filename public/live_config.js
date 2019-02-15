var EBS_ENDPOINT = 'https://yo1yc4g2z0.execute-api.us-east-1.amazonaws.com/dev/moods';
var twitch = window.Twitch.ext;
var context;
var token;
var tuid;
var detectionInterval;
var averageMood;
var chart;
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
  twitch.listen('broadcast', function (target, contentType, content) {
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
      console.log(data) // Prints result from `response.json()` in getRequest
      data.map(i => i.dateTime)
      console.log(data) // Prints result from `response.json()` in getRequest
    })
    .catch(error => console.error(error));
}

function displayBarChar(averageMood, userNumber) {
  log("Starting displayHistogram");
  var json = remap(averageMood);
  log(JSON.stringify(json, null, 2));

  if (!chart) {
    ndx = crossfilter(json);
    moodDimension = ndx.dimension(function (d) { return d.expression; });
    sumGroup = moodDimension.group().reduceSum(function (d) { return (d.value / userNumber); });
    chart = dc.barChart("#barChar");
    chart
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
    chart.render();
  } else {
    ndx.remove();
    ndx.add(json);
    moodDimension = ndx.dimension(function (d) { return d.expression; });
    sumGroup = moodDimension.group().reduceSum(function (d) { return (d.value / userNumber); });
    chart.group(sumGroup);
    dc.redrawAll();
  }
  log("Ending displayHistogram");
}

function remap(input) {
  return Object.keys(input).map(function (expression) {
    return {
      expression: expression,
      value: input[expression],
    };
  });
}

