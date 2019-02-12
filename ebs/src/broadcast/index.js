const broadcastAverageMood = require('./broadcast-average-mood');

async function handler(event, context) {
  console.log(event, context);
  await new Promise((resolve) => {
    let i = 0;
    const interval = setInterval(async () => {
      if (i === 60) {
        clearInterval(interval);
        resolve();
      } else {
        i += 1;
        console.log(`Iteration ${i}`);
        try {
          await broadcastAverageMood();
        } catch (e) {
          console.error(e);
        }
      }
    }, 1000);
  });
}

module.exports = {
  handler,
};
