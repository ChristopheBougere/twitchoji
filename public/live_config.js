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
  displayHistogram()
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

function displayHistogram(){
  console.log("Starting displayHistogram")
  getHistory();
  console.log("Ending displayHistogram")

}

