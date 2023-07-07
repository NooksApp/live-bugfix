## System Overview

This is a simple implementation of a collaborative Youtube Watch Party, backed by a socket.io backend that broadcasts video.

When a user creates a session via the `create` endpoint, they get a unique session ID and a shareable link that they can use to have other clients join that session. This unique session ID is used as a "room" in the socket server, where any messages sent by one client can be forwarded on to all other clients.

Every Youtube player has a custom slider with a play / pause button. Whenever the play or pause button is pressed or the user seeks to a new position on the custom slider, a `videoControl` event is emitted indicating that a play or pause happened at the given position (or "progress") in the video. For simplicity, seeks and plays are treated as the same type of event - a seek to a new location is treated as a play from a different position, and every time you seek (even if the video was paused before), the video will play from the new position.

The backend keeps track of all the video control events for a session in memory, along with the epoch time that they were initiated. If the video is already playing, users who are late to the party compute where in the video they should jump to by computing the time elapsed since the most recent play event.

If no one is left in the session, the last user to leave emits an "END" video control event that resets the video state to the initial position, so that the video won't keep playing in the background with no one watching.



## How to Run Locally

- Make sure nodeJS (I am using v19.7.0) and npm is installed on your local machine
- Open a terminal and run install dependencies
  `$ npm run deps`
- In your terminal at project root, start server
  `$ npm run start:server`
- In another terminal at project root, start client
  `$ npm run start:client`

