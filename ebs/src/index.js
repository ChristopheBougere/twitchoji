const broadcastAverageMood = require('./broadcast-average-mood');
const postMood = require('./post-mood');

function scheduleHandler() {
  let i = 0;
  const interval = setInterval(async () => {
    i += 1;
    console.log(`Iteration ${i}`);
    await broadcastAverageMood();
    if (i === 60) {
      clearInterval(interval);
    }
  }, 1000);
  return {};
}

async function apiHandler(event) {
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
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal error.',
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
}

async function handler(event, context) {
  console.log(event, context);
  if (event.source === 'aws.events') {
    const res = await scheduleHandler();
    return res;
  }
  const res = await apiHandler(event);
  return res;
}

module.exports = handler;
