const AWS = require('../lib/aws');

const {
  TABLE_NAME,
} = process.env;

// TODO add pagination or timerange

async function getMood(streamId) {
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const items = [];
  let lastEvaluatedKey;
  do {
    // eslint-disable-next-line no-await-in-loop
    const { Items, LastEvaluatedKey } = await dynamoDoc.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#streamId = :streamId',
      ExpressionAttributeNames: {
        '#streamId': 'streamId',
      },
      ExpressionAttributeValues: {
        ':streamId': streamId,
      },
    }).promise();
    items.push(...Items);
    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);
  return items;
}

module.exports = getMood;
