# Twitchoji Extension Backend Service

The backend is deployed on AWS using Serverless framework. It i s composed of a single Lambda with an API Gateway endpoint, and a DynamoDB table.

## Architecture
![Architecture diagram](/ebs/architecture.png "Architecture diagram")


## Install
```bash
npm install
cp env_example.yml env.yml
```
Fill the `env.yml` file with your parameters.

## Deploy
```bash
npm run deploy
```

## Lint
```bash
npm run lint
npm run lint-fix
```

## Run locally
```bash
npm start
```
