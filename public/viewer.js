var twitch = window.Twitch.ext;
var context;
var token;
var tuid;

function startFaceApi() {
  faceapi.loadFaceExpressionModel('/models')
    .then(function() {
      return navigator.getUserMedia({
        video: true,
        audio: false,
      });
    })
    .then(function (stream) {
      var el = document.getElementById('webcam');
      el.srcObj = stream;
      return faceapi.detectSingleFace(el).withFaceExpressions();
    })
    .then(function (result) {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(function (err) {
      console.error(err);
    });
}

twitch.onContext(function(c) {
  twitch.rig.log(c);
  context = c;
});

twitch.onAuthorized(function(auth) {
  token = auth.token;
  tuid = auth.userId;

  startFaceApi();
});

twitch.listen('average-mood', function (target, contentType, content) {
  twitch.rig.log('Received average mood broadcast:', content);
  // TODO display emoji
});
