const jwt = require('jsonwebtoken');
const postMood = require('./post-mood');
const getMood = require('./get-mood');

const {
  JWT_SECRET,
} = process.env;

// Verify the JWT token and return the current stream ID
function getStreamIdFromToken(token) {
  try {
    // https://dev.twitch.tv/docs/extensions/reference/#jwt-schema
    const {
      channel_id: streamId,
      role,
    } = jwt.verify(token, Buffer.from(JWT_SECRET, 'base64'), { algorithms: ['HS256'] });

    const allowedRoles = [
      'moderator',
      'viewer',
      'broadcaster',
    ];
    if (!allowedRoles.includes(role)) {
      throw new Error('INVALID_ROLE');
    }
    console.log('Authorized user.');
    return streamId;
  } catch (err) {
    console.error(err);
    throw new Error('INVALID_TOKEN');
  }
}

async function handler(event, context) {
  console.log(event, context);
  try {
    const {
      requestContext: { resourcePath },
      httpMethod,
      headers: { token },
      queryStringParameters,
    } = event;

    if (!token) {
      throw new Error('MISSING_TOKEN');
    }
    const streamId = getStreamIdFromToken(token);

    let res;
    switch (resourcePath) {
      case '/moods':
        switch (httpMethod) {
          case 'POST':
            res = await postMood(streamId, JSON.parse(event.body));
            break;
          case 'GET':
            res = await getMood(streamId, queryStringParameters || {});
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
    switch (e.message) {
      case 'MISSING_TOKEN':
      case 'INVALID_TOKEN':
      case 'INVALID_ROLE':
      case 'INVALID_HTTP_METHOD':
      case 'INVALID_PATH':
        ({ message } = e);
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
