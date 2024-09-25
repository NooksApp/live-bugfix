## Watch Party Functionality

Here is a demo of how the watch party works: https://www.loom.com/share/c6bb194d55b749919a308e7c5fd89521

## System Overview

This is a simple implementation of a collaborative Youtube Watch Party, backed by a socket.io backend that enables users to send messages to each other via our server in real time.

When a user creates a session via the `/create` page, they get a unique session ID and a shareable link that they can use to have other clients join that session. This unique session ID is used as a "room" in the socket server, where any messages sent by one client can be forwarded on to all other clients.

Every Youtube player has a custom slider with a play / pause button. Whenever the play or pause button is pressed or the user seeks to a new position on the custom slider, a `videoControl` event is emitted indicating that a play or pause happened at the given position in the video. For simplicity, seeks and plays are treated as the same type of event - a seek to a new location is treated as a play from a different position, and every time you seek (even if the video was paused before), the video will play from the new position.

## Instructions

1. There is a significant bug in this implementation of a collaborative watch party. Find the bug.
2. Figure out the best strategy to fix the bug and implement the fix!

## Recommended Reading Order

`server/src/app.ts` - has all the server logic that implements the watch party collaboration functionality
`src/VideoPlayer.ts` - makes API calls to the server and listens to socket events to control the users progress through the video

## How to Run Locally

- Make sure nodeJS (I am using v19.7.0) and npm is installed on your local machine
- Open a terminal and run install dependencies
  `$ npm run deps`
- In your terminal at project root, start the server and the client simultaneously
  `$ npm run start`
