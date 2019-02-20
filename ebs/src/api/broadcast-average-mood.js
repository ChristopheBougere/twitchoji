const jwt = require('jsonwebtoken');
const rp = require('request-promise-native');
const AWS = require('../lib/aws');

const {
  JWT_SECRET,
  TABLE_NAME,
  TWITCH_OWNER_ID,
  TWITCH_API_ENDPOINT,
  TWITCH_CLIENT_ID,
} = process.env;

async function fetchItem(streamId) {
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const { Items: items } = await dynamoDoc.query({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#streamId = :streamId',
    ExpressionAttributeNames: {
      '#streamId': 'streamId',
    },
    ExpressionAttributeValues: {
      ':streamId': streamId,
    },
    Limit: 2,
    ScanIndexForward: false,
  }).promise();
  if (items && items.length === 2) {
    return items[1];
  }
  return null;
}

async function makeRequest(streamId, item) {
  // Generate JWT
  const token = jwt.sign({
    role: 'external',
    channel_id: streamId,
    user_id: TWITCH_OWNER_ID,
    pubsub_perms: {
      send: ['broadcast'],
    },
    exp: Math.floor(Date.now() / 1000) + 30,
  }, Buffer.from(JWT_SECRET, 'base64'), {
    algorithm: 'HS256',
  });

  // Broadcast
  try {
    const response = await rp(`${TWITCH_API_ENDPOINT}/message/${streamId}`, {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content_type: 'application/json',
        message: JSON.stringify(item),
        targets: ['broadcast'],
      }),
      resolveWithFullResponse: true,
    });
    console.log(`Status: ${response.statusCode} ${response.statusMessage}. Body: ${response.body}`);
    if (response.statusCode !== 204) {
      console.error(`Expecting HTTP 204, received ${response.statusCode}.`);
    }
  } catch (e) {
    console.error(`Failed to publish for stream ${streamId}`, e);
  }
}

async function broadcastAverageMood(streamId) {
  // Fetch last item from DynamoDB
  console.log(`Stream ${streamId}: fetching last item`);
  const item = await fetchItem(streamId);
  console.log(`Stream ${streamId} item: ${JSON.stringify(item, null, 2)}`);
  if (item) {
    // Then broadcast using Twitch PubSub
    await makeRequest(streamId, item);
  }
}

module.exports = broadcastAverageMood;
