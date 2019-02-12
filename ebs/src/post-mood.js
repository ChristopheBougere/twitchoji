const jwt = require('jsonwebtoken');
const uuidV4 = require('uuid/v4');
const AWS = require('./aws');

const {
  JWT_SECRET,
  TABLE_NAME,
} = process.env;

const allowedRoles = [
  'moderator',
  'viewer',
];
const allowedMoods = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised',
];

async function postMood(body) {
  const { token, mood } = body;
  let streamId;
  let opaqueUserId;
  let role;
  let userId;
  try {
    // https://dev.twitch.tv/docs/extensions/reference/#jwt-schema
    ({
      channel_id: streamId,
      opaque_user_id: opaqueUserId,
      role,
      user_id: userId,
    } = jwt.verify(token, Buffer.from(JWT_SECRET, 'base64'), { algorithms: ['HS256'] }));
  } catch (err) {
    console.error(err);
    throw new Error('INVALID_TOKEN');
  }
  if (!allowedRoles.includes(role)) {
    throw new Error('INVALID_ROLE');
  }
  console.log('Authorized user.');
  if (Object.keys(mood).some(m => !allowedMoods.includes(m))) {
    console.log(`Invalid moon name: ${JSON.stringify(mood, null, 2)}`);
    throw new Error('INVALID_MOOD_NAME');
  }
  if (Object.values(mood).some(m => typeof m !== 'number' || m < 0 || m > 1)) {
    console.log(`Invalid moon value: ${JSON.stringify(mood, null, 2)}`);
    throw new Error('INVALID_MOOD_VALUE');
  }
  const datetime = new Date().toISOString();
  const item = {
    id: uuidV4(),
    streamId,
    userId: userId || opaqueUserId,
    mood,
    datetime,
  };
  console.log(`Storing item: ${JSON.stringify(item, null, 2)}`);
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  await dynamoDoc.put({
    TableName: TABLE_NAME,
    Item: item,
  }).promise();
  return {
    message: 'Mood added.',
  };
}

module.exports = postMood;
