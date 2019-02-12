const broadcastAverageMood = require('./broadcast-average-mood');

async function handler(event, context) {
  console.log(event, context);
  await new Promise((resolve) => {
    let i = 0;
    const interval = setInterval(async () => {
      i += 1;
      console.log(`Iteration ${i}`);
      try {
        await broadcastAverageMood();
      } catch (e) {
        console.error(e);
      }
      if (i === 60) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });
}

module.exports = {
  handler,
};
