let EBS_ENDPOINT = 'https://yo1yc4g2z0.execute-api.us-east-1.amazonaws.com/dev/moods';
let twitch = window.Twitch.ext;
let context;
let token;
let tuid;
let chartBar;
let chartComposite;
let data;
let ndx;

function log(message) {
  if (typeof message === 'string') {
    twitch.rig.log(message);
  }
  console.log(message);
}

twitch.onContext(function (c) {
  context = c;
});

twitch.onAuthorized(async function (auth) {
  token = auth.token;
  tuid = auth.userId;
  if (!chartComposite) {
    console.log("Init Charts")
    var d = await loadData(token, { "datetime": new Date(), "operator": ">" });
    await initCharts(d);
  }

  // twitch.listen('broadcast', function (target, contentType, content) {
  //   log(content);
  //   averageMood = JSON.parse(content);
  //   updateGraphs(averageMood);
  // });
});

async function loadData(token, params = {}) {
  const url = new URL(EBS_ENDPOINT);
  let offset;
  let items
  const rows = [];
  do {
    const obj = { ...params };
    if (offset)
      obj.offset = offset;
    url.search = new URLSearchParams(
      obj
    );
    const res = await fetch(url, {
      method: 'GET',
      headers: new Headers({
        Token: token,
      }),
      mode: 'cors',
    });
    ({ offset, items } = await res.json());
    rows.push(...items);
  } while (offset);
  return rows;

}


function initCharts(data) {
  chartRange = dc.barChart("#chartRange");
  chartComposite = dc.compositeChart("#chartLine")
  let fromDate = new Date();
  fromDate.setMinutes(fromDate.getMinutes() - 30);
  let fullDomain = [fromDate, new Date()];
  let dimension;
  if(!data){
    ndx = crossfilter(emptyData());
    dimension = ndx.dimension(function (d) {
      return new Date(d.datetime);
    });
  }else{
    ndx = crossfilter(data);
    dimension = ndx.dimension(function (d) {
      return new Date(d.datetime);
    });
  }


  var numberUserByGroup = dimension.group().reduceSum(function (d) {
    return d.number;
  });

  chartComposite /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
    .width(null)
    .height(null)
    .transitionDuration(1000)
    .margins({ top: 30, right: 50, bottom: 25, left: 40 })
    .dimension(dimension)
    .rangeChart(chartRange)
    .x(d3.scaleTime().domain(fullDomain))
    .xUnits(d3.timeDay)
    .brushOn(false)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .legend(dc.legend().autoItemWidth(true).horizontal(true))
    .compose([
      dc.lineChart(chartComposite).group(dimension.group().reduceSum(function (d) { return d.mood.fearful / d.number; }), 'fearful').colors("blue"),
      dc.lineChart(chartComposite).group(dimension.group().reduceSum(function (d) { return d.mood.sad / d.number; }), 'sad').colors("pink"),
      dc.lineChart(chartComposite).group(dimension.group().reduceSum(function (d) { return d.mood.happy / d.number; }), 'happy').colors("orange"),
      dc.lineChart(chartComposite).group(dimension.group().reduceSum(function (d) { return d.mood.disgusted / d.number; }), 'disgusted').colors("green"),
      dc.lineChart(chartComposite).group(dimension.group().reduceSum(function (d) { return d.mood.angry / d.number; }), 'angry').colors("red")
    ])

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

  dc.renderAll();
}

function updateGraphs(averageMood){
  ndx.remove();
  data.push(averageMood)
  ndx.add(data);
  dc.redrawAll();
}

function remap(input) {
  return Object.keys(input).map(function (expression) {
    return {
      expression: expression,
      value: input[expression],
    };
  });
}

function emptyData(){
return {"mood":{"disgusted":0,"happy":0,"sad":0,"neutral":0,"angry":0,"fearful":0,"surprised":0},"datetime":new Date(),"number":0};
}