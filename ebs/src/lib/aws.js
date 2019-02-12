const https = require('https');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

if (process.env.IS_OFFLINE) {
  AWS.config.dynamodb = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
  };
  AWS.config.dynamodb.documentClient = {
    region: 'localhost',
    endpoint: 'http://localhost:8000',
  };
}

// Using HTTP keep-alive
// https://theburningmonk.com/2019/02/lambda-optimization-tip-enable-http-keep-alive/
const sslAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: true,
});
sslAgent.setMaxListeners(0);
AWS.config.update({
  httpOptions: {
    agent: sslAgent,
  },
});


module.exports = AWS;
