var EBS_ENDPOINT = 'https://ow7zib97nl.execute-api.us-east-1.amazonaws.com/experiment/moods';
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

twitch.onContext(function(c) {
  context = c;
});

twitch.onAuthorized(function(auth) {
  token = auth.token;
  tuid = auth.userId;

  log('Listening pubsub.');
  twitch.listen('broadcast', function (target, contentType, content) {
    log('Received expressions:');
    averageMood = JSON.parse(content);
    log(averageMood);
    // TODO display emoji
  });
});

function detection() {
  var videoEl = document.getElementById('webcam');
  if (videoEl.paused || videoEl.ended) {
    return;
  }
  faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5,
  })).withFaceExpressions()
    .then(function (res) {
      if (!token || !res) {
        return;
      }
      var mood = {};
      res.expressions.forEach(function (m) {
        mood[m.expression] = m.probability;
      });
      return fetch(EBS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          token: token,
          mood: mood,
        }),
        mode: 'cors',
      });
    })
    .catch(function (err) {
      log('Detection error:');
      log(err);
    });
}

function startFaceApi() {
  faceapi.loadFaceExpressionModel('/models')
    .then(function () {
      return faceapi.loadTinyFaceDetectorModel('/models');
    })
    .then(function () {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    })
    .then(function(stream) {
      document.getElementById('webcam').srcObject = stream;
    })
    .then(function () {
      detectionInterval = setInterval(detection, 1000);
    })
    .catch(function (error) {
      log('Init error:');
      log(error);
    });
}
