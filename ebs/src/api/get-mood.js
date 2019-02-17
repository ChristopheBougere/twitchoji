const AWS = require('../lib/aws');
const { formatDatetime } = require('../lib/datetime');
const { encodeOffset, decodeOffset } = require('../lib/offset');

const {
  TABLE_NAME,
  MAX_GET_LIMIT,
} = process.env;

async function getMood(streamId, queryStringParameters) {
  const now = new Date();
  const operator = ['<', '<=', '=', '>=', '>'].includes(queryStringParameters.operator) ? queryStringParameters.operator : '>=';
  const datetime = queryStringParameters.datetime
    || formatDatetime(new Date(now.setHours(now.getHours() - 1)));
  const limit = Number(queryStringParameters.limit) > 0
    && Number(queryStringParameters.limit) <= Number(MAX_GET_LIMIT)
    ? Number(queryStringParameters.limit) : Number(MAX_GET_LIMIT);
  let offset = queryStringParameters.offset ? decodeOffset(queryStringParameters.offset) : null;

  console.log(`operator: ${operator}, datetime: ${datetime}, limit: ${limit}, offset: ${JSON.stringify(offset)}`);
  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const items = [];
  do {
    console.log(`Querying ${limit - items.length} items with offset ${JSON.stringify(offset)}...`);
    // eslint-disable-next-line no-await-in-loop
    const { Items, LastEvaluatedKey } = await dynamoDoc.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: `#streamId = :streamId AND #datetime ${operator} :datetime`,
      ExpressionAttributeNames: {
        '#streamId': 'streamId',
        '#datetime': 'datetime',
      },
      ExpressionAttributeValues: {
        ':streamId': streamId,
        ':datetime': datetime,
      },
      ExclusiveStartKey: offset,
      Limit: limit - items.length,
    }).promise();
    items.push(...Items);
    offset = LastEvaluatedKey;
  } while (offset && items.length < limit);
  return {
    items,
    offset: encodeOffset(offset),
  };
}

module.exports = getMood;
