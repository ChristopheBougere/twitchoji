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
});

function getHistory() {
  var history = fetch(EBS_ENDPOINT, {
    method: 'GET',
    headers: new Headers({
       Token: token,
     }),
    mode: 'cors',
  });
  log(history);
}

function displayHistogram(){
  getHistory();
}

