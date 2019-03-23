# Live Mood (a.k.a. Twitchoji)
This repository contains the code of our our submission ([Loic Szpieg](https://github.com/loic-sz) and myself) for the [Twitch extension challenge](https://twitchdev.devpost.com/).
You can get the details about the project [on the DevPost project page](https://devpost.com/software/live-mood-2b5arl).
The LiveMood extension is [available on Twitch](https://www.twitch.tv/ext/h2c9fot9q8wp04jt9ho7thei0upodf-0.0.6).

## Presentation Video (click on the image)
[![Click to watch the video](https://img.youtube.com/vi/FBHXO7Ls0aY/maxresdefault.jpg)](https://www.youtube.com/watch?v=FBHXO7Ls0aY)

## Inspiration
We strongly believe relevant interaction between the broadcaster and the chat is critical on Twitch. The chat is great but sometimes can be unreadable.

## What it does
Live Mood let you see in real time your chat reaction in a quick glance. Indeed, chat reactions are aggregated, averaged and finally displayed on your stream with a dynamic emoji. Technically, Live Mood retrieves viewers mood by leveraging facial expression recognition through their webcams. Each browser will calculate it locally and send it to Live Mood server. Received expressions are averaged to create a unique emoji and can be sent to the browsers and displayed on the stream.

## How we built it
Expressions recognition is done with face-api.js. Charts are built with d3.js. Frontend uses React. The backend is serverless (API Gateway/Lambda/DynamoDB).

## Challenges we ran into
The API allowing to get the webcam stream (getUserMedia) is not available by default when asked from within a cross-origin iframe in some browser. A fallback is available, as users can also click on the buttons to share their mood. Recommended browser is Firefox.

## Accomplishments that we're proud of
Everything is computed in the browser, no image is sent to any server. We only receive mood ratio, such as {surprised: 0.7, happy: 0.5, ...}.
Even though we will receive a lot of data in real-time, the backend scales well and could handle popular Twitch channels.

## What we learned
How does Twitch work under the hood (API, PubSub, ...).
Iframe security policies.

## What's next for Live Mood
Share mood evolution graph on social networks.
Extract mood ratio from chat as well.
Automatically generate a highlight video of the stream session, with the most intense moments (premium feature).
The ability for broadcasters to upload custom emojis
UI enhancements

## Screenshots
### Channel view
![Viewer](/screenshots/channel.png "Viewer")

### Broadcaster view
![Broadcaster](/screenshots/dashboard.png "Broadcaster")
