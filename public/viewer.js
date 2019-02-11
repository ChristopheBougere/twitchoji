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
  log(c);
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

function startFaceApi() {
  faceapi.loadFaceExpressionModel('/models')
    .then(function () {
      return faceapi.loadTinyFaceDetectorModel('/models');
    })
    .then(function () {
      return faceapi.loadSsdMobilenetv1Model('/models');
    })
    .then(function () {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    })
    .then(function(stream) {
      var el = document.getElementById('webcam');
      el.srcObject = stream;
      return faceapi.detectAllFaces(el, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }));
    })
    .then(function (res) {
      log(2)
      log(res);
    })
    .catch(function (error) {
      log("error");
      log(error);
    });
}

// function startFaceApi() {
//   twitch.rig.log(`hello`)
//   faceapi.loadFaceExpressionModel('/models')
//     .catch(function (err) {
//       twitch.rig.log('0');
//       console.log('0');
//     })
//     .then(() => new Promise(function(resolve, reject) {
//       navigator.getUserMedia({
//         video: true,
//         audio: false,
//       }, resolve, reject);
//     }))
//     .catch(function (err) {
//       twitch.rig.log('1');
//       console.error(err);
//     })
//     .then(function (stream) {
//       twitch.rig.log('plop');
//       var el = document.getElementById('webcam');
//       el.srcObj = stream;
//       return faceapi.detectSingleFace(el).withFaceExpressions();
//     })
//     .catch(function (err) {
//       twitch.rig.log('2');
//       console.log('2');
//     })
//     .then(function (result) {
//       twitch.rig.log(JSON.stringify(result, null, 2));
//     })
//     .catch(function (err) {
//       twitch.rig.log('3');
//       console.log('3');
//     });
// }


// // $(function() {
// //   
// // });
