var EBS_ENDPOINT = 'https://yo1yc4g2z0.execute-api.us-east-1.amazonaws.com/dev/moods';
var twitch = window.Twitch.ext;
var context;
var token;
var tuid;
var detectionInterval;
var averageMood;

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
    log('Received expressions:');
    averageMood = JSON.parse(content);
    displayBarChar(averageMood)
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

function displayBarChar(averageMood) {
  console.log("Starting displayHistogram")
  var chart = dc.barChart("#barChar");

  d3.json(averageMood).then(function (moods) {
    var ndx = crossfilter(moods),
      moodDimension = ndx.dimension(function (d) { return Object.keys(moods); }),
      sumGroup = moodDimension.group().reduceSum(function (d) { return d[0]; });
    chart
      .width(768)
      .height(380)
      .x(d3.scaleBand())
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .xAxisLabel('Expression')
      .yAxisLabel('%')
      .dimension(moodDimension)
      .barPadding(0.1)
      .outerPadding(0.05)
      .group(moods);
    chart.render();
  });

console.log("Ending displayHistogram");
}

