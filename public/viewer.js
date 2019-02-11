var twitch = window.Twitch.ext;
var context;
var token;
var tuid;

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

  twitch.listen('average-mood', function (target, contentType, content) {
    log('Received average mood broadcast:', content);
    // TODO display emoji
  });
  // startFaceApi();
});

function detection() {
  return faceapi.detectSingleFace(document.getElementById('webcam'), new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5,
  }))
    .then(function (res) {
      log(res);
      return detection();
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
    .then(detection)
    .catch(function (error) {
      log(error);
    });
}
