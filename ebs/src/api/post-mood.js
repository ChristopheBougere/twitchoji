const jwt = require('jsonwebtoken');
const AWS = require('../lib/aws');
const { formatDatetime } = require('../lib/datetime');

const {
  JWT_SECRET,
  TABLE_NAME,
} = process.env;

// Verify the JWT token and return the current stream ID
function verifyUser(token) {
  try {
    // https://dev.twitch.tv/docs/extensions/reference/#jwt-schema
    const {
      channel_id: streamId,
      role,
    } = jwt.verify(token, Buffer.from(JWT_SECRET, 'base64'), { algorithms: ['HS256'] });

    const allowedRoles = [
      'moderator',
      'viewer',
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

async function writeMood(mood, streamId) {
  // Check if item already exist
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const datetime = formatDatetime(new Date());
  try {
    const item = {
      streamId,
      datetime,
      mood,
      number: 1,
    };
    console.log(`Adding item (if not exists): ${JSON.stringify(item, null, 2)}`);
    await dynamoDoc.put({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(#streamId) AND attribute_not_exists(#datetime)',
      ExpressionAttributeNames: {
        '#streamId': 'streamId',
        '#datetime': 'datetime',
      },
    }).promise();
    console.log('Item added.');
  } catch (e) {
    if (e.name === 'ConditionalCheckFailedException') {
      console.log('Item already exists. Updating it...');
      await dynamoDoc.update({
        TableName: TABLE_NAME,
        Key: {
          streamId,
          datetime,
        },
        UpdateExpression: `SET ${[
          '#number = #number + :one',
          'mood.#neutral = mood.#neutral + :neutral',
          'mood.#happy = mood.#happy + :happy',
          'mood.#sad = mood.#sad + :sad',
          'mood.#angry = mood.#angry + :angry',
          'mood.#fearful = mood.#fearful + :fearful',
          'mood.#disgusted = mood.#disgusted + :disgusted',
          'mood.#surprised = mood.#surprised + :surprised',
        ].join(', ')}`,
        ExpressionAttributeNames: {
          '#number': 'number',
          '#neutral': 'neutral',
          '#happy': 'happy',
          '#sad': 'sad',
          '#angry': 'angry',
          '#fearful': 'fearful',
          '#disgusted': 'disgusted',
          '#surprised': 'surprised',
        },
        ExpressionAttributeValues: {
          ':one': 1,
          ':neutral': mood.neutral,
          ':happy': mood.happy,
          ':sad': mood.sad,
          ':angry': mood.angry,
          ':fearful': mood.fearful,
          ':disgusted': mood.disgusted,
          ':surprised': mood.surprised,
        },
      }).promise();
      console.log('Item updated.');
    } else {
      throw e;
    }
  }
}

async function postMood(body) {
  const streamId = verifyUser(body.token);

  const mood = {
    neutral: body.mood.neutral || 0,
    happy: body.mood.happy || 0,
    sad: body.mood.sad || 0,
    angry: body.mood.angry || 0,
    fearful: body.mood.fearful || 0,
    disgusted: body.mood.disgusted || 0,
    surprised: body.mood.surprised || 0,
  };

  await writeMood(mood, streamId);

  return {
    message: 'OK',
  };
}

module.exports = postMood;
