const jwt = require('jsonwebtoken');
const rp = require('request-promise-native');
const AWS = require('./aws');

const {
  JWT_SECRET,
  RANGE_SECONDS,
  TABLE_NAME,
  TWITCH_OWNER_ID,
  TWITCH_API_ENDPOINT,
  TWITCH_CLIENT_ID,
} = process.env;

async function makeRequest(streamId, averageMood) {
  // Generate JWT
  const token = jwt.sign({
    role: 'external',
    channel_id: streamId,
    user_id: TWITCH_OWNER_ID,
    pubsub_perms: {
      send: ['*'],
    },
    exp: Math.floor(Date.now() / 1000) + 30,
  }, JWT_SECRET, {
    algorithm: 'HS256',
  });

  // Publish to 'average-mood' topic
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
        targets: ['average-mood'],
      }),
    });
    if (response.statusCode !== 204) {
      console.error(`Expecting HTTP 204, received ${response.statusCode}. Response: ${JSON.stringify(response, null, 2)}`);
    }
  } catch (e) {
    console.error(`Failed to publish for stream ${streamId}`, e);
  }
}

async function broadcastAverageMood() {
  // 1. Fetch last items from DynamoDB
  const fromDate = new Date();
  fromDate.setSeconds(fromDate.getSeconds - RANGE_SECONDS);

  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const items = [];
  let lastEvaluatedKey;
  do {
    // eslint-disable-next-line no-await-in-loop
    const { Items, LastEvaluatedKey } = await dynamoDoc.query({
      TableName: TABLE_NAME,
      IndexName: 'gsi-datetime',
      KeyConditionExpression: 'gsi-datetime >= :datetime',
      ExpressionAttributeNames: {
        '#datetime': 'datetime',
      },
      ExpressionAttributeValues: {
        ':datetime': fromDate.toISOString(),
      },
    }).promise();
    items.push(...Items);
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);
  const streams = {};
  items.forEach((item) => {
    if (!streams[item.streamId]) {
      streams[item.streamId] = [];
    }
    streams[item.streamId].push(item);
  });
  console.log(`Streams: ${JSON.stringify(streams)}`);

  // For each stream
  const requests = [];
  for (const streamId in streams) { // eslint-disable-line no-restricted-syntax
    if (Object.prototype.hasOwnProperty.call(streams, streamId)) {
      // Compute average mood
      const averageMood = streams[streamId].reduce((acc, curr) => {
        Object.keys(curr).forEach((mood) => {
          if (!acc[mood]) {
            acc[mood] = 0;
          }
          acc[mood] += curr[mood];
        });
        return acc;
      }, {});
      Object.keys(averageMood).forEach((mood) => {
        averageMood[mood] /= streams[streamId].length;
      });
      console.log(`Average mood for stream ${streamId}: ${JSON.stringify(averageMood, null, 2)}`);
      requests.push(makeRequest(streamId, averageMood));
    }
  }
  const res = await Promise.all(requests);
  console.log('Request result:', res);
}

module.exports = broadcastAverageMood;
