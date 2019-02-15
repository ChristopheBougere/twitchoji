var EBS_ENDPOINT = 'https://yo1yc4g2z0.execute-api.us-east-1.amazonaws.com/dev/moods';
var twitch = window.Twitch.ext;
var context;
var token;
var tuid;
var detectionInterval;
var averageMood;
var lastAverageEmojiDate;

function log(message) {
  if (typeof message === 'string') {
    twitch.rig.log(message);
  }
  console.log(message);
}

twitch.onAuthorized(function (auth) {
  token = auth.token;
  console.log('Token', token);

  log('Listening pubsub.');
  twitch.listen('broadcast', function (target, contentType, content) {
    log('Received expressions:');
    averageMood = JSON.parse(content);
    delete averageMood.number;
    console.log(averageMood);
    const highestMood = Object.keys(averageMood).reduce(function(a, b) {
      return averageMood[a] > averageMood[b] ? a : b;
    });
    log(highestMood, average[highestMood]);
    var averageMoodEl = document.getElementById('average');
    if (highestMood === 'neutral') {
      averageMoodEl.innerHTML = '';
    } else {
      lastAverageEmojiDate = new Date();
      // If no new emoji in 2 seconds, clear
      setTimeout(function() {
        if (new Date() - lastAverageEmojiDate >= 2000) {
          averageMoodEl.innerHTML = '';
        }
      }, 2000);
      averageMoodEl.innerHTML = '<img src="svg/' + highestMood + '.svg" />';
    }
  });
});

function postMood(mood) {
  if (!token) {
    return Promise.resolve();
  }
  return fetch(EBS_ENDPOINT, {
    method: 'POST',
    headers: new Headers({
      token: token,
    }),
    body: JSON.stringify({
      mood: mood,
    }),
    mode: 'cors',
  });
}

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
      if (!res) {
        return Promise.resolve();
      }
      var mood = {};
      res.expressions.forEach(function (m) {
        mood[m.expression] = m.probability;
      });
      return postMood(mood);
    })
    .catch(function (err) {
      log('Detection error:');
      log(err);
    });
}

function startFaceApi() {
  var videoEl = document.getElementById('webcam');
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
      videoEl.srcObject = stream;
      document.getElementById('buttons').style.display = 'none';
      document.getElementById('start-button').style.display = 'none';
      document.getElementById('stop-button').style.display = 'block';
    })
    .then(function () {
      detectionInterval = setInterval(detection, 1000);
    })
    .catch(function (error) {
      log('Init error:');
      log(error);
    });
}

function stopFaceApi() {
  clearInterval(detectionInterval);
  document.getElementById('buttons').style.display = 'block';
  document.getElementById('start-button').style.display = 'block';
  document.getElementById('stop-button').style.display = 'none';
}

function onEmojiClick(mood) {
  var obj = {};
  obj[mood] = 1.;
  postMood(obj);
}

navigator.mediaDevices.enumerateDevices()
  .then(function (res) {
    var hasCameraAccess = res.find(function (item) {
      log(item);
      return item.kind === 'videoinput';
    });
    if (hasCameraAccess) {
      document.getElementById('start-button').style.display = 'block';
    } else {
      return Promise.reject(new Error('NO_CAMERA'));
    }
  })
  .catch(function (err) {
    log('User has no access to camera.');
    log(err);

  });
