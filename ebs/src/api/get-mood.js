const AWS = require('../lib/aws');
const { formatDatetime } = require('../lib/datetime');
const { encodeOffset, decodeOffset } = require('../lib/offset');

const {
  TABLE_NAME,
} = process.env;
const MAX_LIMIT = 600;

async function getMood(streamId, queryStringParameters) {
  const now = new Date();
  const operator = ['<', '<=', '=', '>=', '>'].includes(queryStringParameters.operator) ? queryStringParameters.operator : '>=';
  const datetime = queryStringParameters.datetime || formatDatetime(new Date(now.setHours(now.getHours() - 1)));
  const limit = Number(queryStringParameters.limit) > 0
    && Number(queryStringParameters.limit) <= MAX_LIMIT
    ? Number(queryStringParameters.limit) : MAX_LIMIT;
  let offset = queryStringParameters.offset ? decodeOffset(queryStringParameters.offset) : null;

  const dynamoDoc = new AWS.DynamoDB.DocumentClient();
  const items = [];
  do {
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
      LastEvaluatedKey: offset,
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
