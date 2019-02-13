const broadcastAverageMood = require('./broadcast-average-mood');
const { formatDatetime } = require('../lib/datetime');

const {
  RANGE_SECONDS,
} = process.env;

async function handler(event, context) {
  console.log(event, context);
  const { Records: records } = event;
  const tasks = [];
  records.filter(r => r.eventName === 'INSERT') // only putItem, no updateItem
    .forEach((r) => {
      const { dynamodb: { Keys: { streamId, datetime } } } = r;
      const fromDate = new Date(datetime);
      fromDate.setSeconds(fromDate.getSeconds() - RANGE_SECONDS);

      tasks.push(
        broadcastAverageMood(streamId, formatDatetime(fromDate)),
      );
    });
  await Promise.all(tasks);
  console.log('Done.');
}

module.exports = {
  handler,
};
