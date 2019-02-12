const broadcastAverageMood = require('./broadcast-average-mood');
const postMood = require('./post-mood');

async function broadcastHandler(event, context) {
  console.log(event, context);
  await new Promise((resolve) => {
    let i = 0;
    const interval = setInterval(async () => {
      i += 1;
      console.log(`Iteration ${i}`);
      try {
        await broadcastAverageMood();
      } catch (e) {
        console.error(e);
      }
      if (i === 60) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

async function apiHandler(event, context) {
  console.log(event, context);
  try {
    const {
      requestContext: { resourcePath },
      httpMethod,
    } = event;
    let res;
    switch (resourcePath) {
      case '/moods':
        switch (httpMethod) {
          case 'POST':
            res = await postMood(JSON.parse(event.body));
            break;
          default: throw new Error('INVALID_HTTP_METHOD');
        }
        break;
      default: throw new Error('INVALID_PATH');
    }
    return {
      statusCode: 200,
      body: JSON.stringify(res),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } catch (e) {
    console.error(e);
    let message;
    switch (e.name) {
      case 'INVALID_HTTP_METHOD':
      case 'INVALID_PATH':
      case 'INVALID_TOKEN':
      case 'INVALID_ROLE':
      case 'INVALID_MOOD_NAME':
      case 'INVALID_MOOD_VALUE':
        message = e.name;
        break;
      default:
        message = 'INTERNAL_ERROR';
        break;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        message,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
}

module.exports = {
  broadcastHandler,
  apiHandler,
};
