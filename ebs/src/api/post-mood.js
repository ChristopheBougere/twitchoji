const AWS = require('../lib/aws');
const { formatDatetime } = require('../lib/datetime');
const broadcastAverageMood = require('./broadcast-average-mood');

const {
  TABLE_NAME,
  MAX_UPDATES,
} = process.env;

async function getNumberForItem(streamId, datetime) {
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const { Item: item } = await dynamoDoc.get({
    TableName: TABLE_NAME,
    Key: {
      streamId,
      datetime,
    },
    ProjectionExpression: 'mood.#number',
    ExpressionAttributeNames: {
      '#number': 'number',
    },
    ReturnConsumedCapacity: 'NONE',
  }).promise();
  return (item && item.number) || 0;
}

async function writeMoodAndBroadcast(mood, streamId, datetime) {
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
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
  console.log('Item added. Now broadcasting average mood');
  // Then broadcast average mood
  await broadcastAverageMood(streamId);
  console.log('Broadcast done.');
}

async function updateMood(mood, streamId, datetime) {
  // Check if item already exist
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
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
}

async function postMood(streamId, body) {
  const datetime = formatDatetime(new Date());
  console.log(`Datetime: ${datetime}`);
  // First we check if an item already exists
  const number = await getNumberForItem(streamId, datetime);

  // If the item has already been updated enough times, ignoring
  if (number >= Number(MAX_UPDATES)) {
    return {
      message: 'TOO_MANY_UPDATES',
    };
  }

  const mood = {
    neutral: body.mood.neutral || 0,
    happy: body.mood.happy || 0,
    sad: body.mood.sad || 0,
    angry: body.mood.angry || 0,
    fearful: body.mood.fearful || 0,
    disgusted: body.mood.disgusted || 0,
    surprised: body.mood.surprised || 0,
  };
  // If item does not exist, we add it and broadcast previous mood
  if (number === 0) {
    console.log('No item existing, adding a new one...');
    try {
      await writeMoodAndBroadcast(mood, streamId, datetime);
      return {
        message: 'OK',
      };
    } catch (e) {
      // In case an item has been added meanwhile
      if (e.name === 'ConditionalCheckFailedException') {
        console.log('Item already exists. Updating it instead');
      } else {
        throw e;
      }
    }
  }
  // Otherwise we update it
  await updateMood(mood, streamId, datetime);
  return {
    message: 'OK',
  };
}

module.exports = postMood;
