const postMood = require('./post-mood');

async function handler(event, context) {
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
  handler,
};
