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

async function fetchItems(streamId, fromDate) {
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const items = [];
  let lastEvaluatedKey;
  do {
    // eslint-disable-next-line no-await-in-loop
    const { Items, LastEvaluatedKey } = await dynamoDoc.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#streamId = :streamId AND #datetime >= :datetime',
      ExpressionAttributeNames: {
        '#streamId': 'streamId',
        '#datetime': 'datetime',
      },
      ExpressionAttributeValues: {
        ':streamId': streamId,
        ':datetime': fromDate,
      },
    }).promise();
    items.push(...Items);
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);
  return items;
}

function computeAverageMood(items) {
  const inital = {
    number: 0,
    neutral: 0,
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0,
  };
  let number = 0;
  const averageMood = items.reduce((acc, curr) => {
    number += curr.number;
    acc.neutral += curr.mood.neutral;
    acc.happy += curr.mood.happy;
    acc.sad += curr.mood.neutral;
    acc.angry += curr.mood.angry;
    acc.fearful += curr.mood.fearful;
    acc.disgusted += curr.mood.disgusted;
    acc.surprised += curr.mood.surprised;
    return acc;
  }, inital);

  if (number) {
    averageMood.neutral /= number;
    averageMood.happy /= number;
    averageMood.sad /= number;
    averageMood.angry /= number;
    averageMood.fearful /= number;
    averageMood.disgusted /= number;
    averageMood.surprised /= number;
  }
  return averageMood;
}

async function makeRequest(streamId, averageMood) {
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
        message: JSON.stringify(averageMood),
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

async function broadcastAverageMood(streamId, fromDate) {
  // Fetch last items from DynamoDB
  console.log(`Stream ${streamId}: fetching items since ${fromDate}`);
  const items = await fetchItems(streamId, fromDate);
  console.log(`Stream ${streamId} items: ${JSON.stringify(items, null, 2)}`);

  // Compute average mood
  const averageMood = computeAverageMood(items);
  console.log(`Stream ${streamId} average mood: ${JSON.stringify(averageMood, null, 2)}`);

  // Then broadcast using Twitch PubSub
  await makeRequest(streamId, averageMood);
}

module.exports = broadcastAverageMood;
