## Terry's Note

- Backend in Typescript does not appear to be a requirement, but should be for good practice in real project.
- Backend uses SQLite in memory store (data is lost when shut down). For demo and purpose of this exercise, we can keep it in memory for now.
- Live video session only ends when all of the users are gone. Meaning even if the video is done playing at the end of the progress bar, the session is still live and active if there are at least one user is connected to the socket
- In the interest of time, I simplied the video control events and have combined seek and play together when seek event happens. Meaning when you seek for a progress, it plays automatically. (whereas if you were on pause and then seek, it would pause at the seeking position). Users can still achieve the similar pause+seek when they seek first and pause.
- Playing acorss all users may not be perfectly synced, but should be within 1 second latency.

## How to Run Locally

- Make sure nodeJS (I am using v19.7.0) and npm is installed on your local machine
- Open a terminal and run install dependencies
  `$ npm run deps`
- In your terminal at project root, start server
  `$ npm run start:server`
- In another terminal at project root, start client
  `$ npm run start:client`

## Nooks Watch Party Project

In this takehome project, we want to understand your:

- ability to build something non-trivial from scratch
- comfort picking up unfamiliar technologies
- architectural decisions, abstractions, and rigor

We want to respect your time, so please don't spend more than 5 hours on this, even if you don’t finish. We know that this is a challenging task & you are under time pressure and will keep that in mind when evaluating your solution.

### Instructions

To run the app simply "npm i" and then "npm start"

### Problem

Your task is to build a collaborative “Watch Party” app that lets a distributed group of users watch youtube videos together. The frontend should be written in Typescript (we have a skeleton for you set up) and the backend should be written in Node.JS. The app should support three main pages:

- `/create` **Create a new session**
  - by giving it a name and a youtube video link. After creating a session `ABC`, you should be automatically redirected to the page `/watch` page for that session
- `/watch/:sessionId` **Join an existing session**
  _⚠️ The player must be **synced for all users at all times** no matter when they join the party_
  - **Playing/pausing/seek** the video. When someone plays/pauses the video or jumps to a certain time in the video, this should update for everyone in the session
  - **Realtime** **Switching** the video. When someone switches the session to a different youtube video, this should update for everyone
  - **Late to the party**... Everything should stay synced if a user joins the session late (e.g. if the video was already playing, the new user should see it playing at the correct time)
  - **[Bonus] Active user list.** Before joining the session or creating a session, allow users to enter their name. The name of each user who’s currently in the session should show up in this list. If a user closes their Watch Party app, they should be removed from this list
  - **[Bonus] Session timeline / notifications.** When a user in the session plays, pauses or jumps to a certain time, you can add notifications so that other participants know why the video state changed. Even better, you could include a session timeline for events that have happened so far in the session.
- `/replay/:sessionId` **Replay an existing session**
  - All changes (like play/pause/seek or switch the video) that happened in the original session should be replayed exactly, as if the original live session was recorded.
    For example, if during the original session:
    - User 1 paused the video 5 seconds in
    - After waiting 10 seconds, User 2 moved the video slider to 15 seconds in and began playing
    - After waiting 5 seconds, User 1 moved the video slider back to the beginning of the video and kept playing
      Then the replay would replicate these exact steps: the replayed video would pause at 5 seconds in, after 10 seconds it should move to 15 seconds and start playing, and then after 15 seconds it should reset to the beginning of the video.
      A replayed session should not be controllable — it should be view only. Once the session “ends” (i.e, every user has left) you should pause the video.
      **[Bonus] Session timeline / notifications.** When a user in the replayed session plays, pauses or jumps to a certain time, you can add notifications so whoever is watching the replayed session knows why the video state changed. Even better, you could include a session timeline that shows all the events that happened during the replayed session, and which ones have been completed so far.

### Assumptions

- This app obviously **doesn’t need to be production-ready**, but you should at least be aware of any issues you may encounter in more real-world scenarios.
- We gave you almost all of the frontend UX you’ll need in the [starter repo](https://github.com/NooksApp/nooks-fullstack-takehome), including skeleton pages for the `create`, `watch` , and `replay` routes, so you can focus on implementing the core backend functionality & frontend video playing logic for the app.
- You should probably use **\*\*\*\***\*\*\*\***\*\*\*\***websockets**\*\*\*\***\*\*\*\***\*\*\*\*** to keep state synchronized between multiple users.
- You might have hundreds of sessions per day with lots of data. You’ll probably **need a database** to store events from previous sessions so you can replay them - feel free to use something simple like [sqlite](https://sqlite.org/index.html).

You will need to embed a Youtube video directly in the website. In our skeleton code we use [react-player](https://www.npmjs.com/package/react-player), but feel free to use another library or use the [Youtube IFrame API](https://developers.google.com/youtube/iframe_api_reference) directly.

In order to sync the video, you’ll need to know when any user plays, pauses, or seeks in their own player and transmit that information to everyone else. In order to get play, pause, and seek events you can use:

1. [YouTube iFrame API - Events](https://developers.google.com/youtube/iframe_api_reference#Events)
2. Build your own custom controls for play, pause & seek. If you choose this option, make sure the controls UX works very similarly to youtube’s standard controls (e.g. play/pause button and a slider for seek)

### Required Functionality

- [ ] **Creating a session**. Any user should be able to create a session to watch a given Youtube video.
- [ ] **Joining a session**. Any user should be able to join a session created by another user using the shareable session link.
- [ ] **Playing/pausing** the video. When a participant pauses the video, it should pause for everyone. When a participant plays the video, it should start playing for everyone.
- [ ] **“Seek”**. When someone jumps to a certain time in the video it should jump to that time for everyone.
- [ ] **Late to the party**... Everything should stay synced even if a user joins the watch party late (e.g. the video is already playing)
- [ ] **Player controls.** All the player controls (e.g. play, pause, and seek) should be intuitive and behave as expected. For play, pause & seek operations you can use the built-in YouTube controls or disable the YouTube controls and build your own UI (including a slider for the seek operation)
- [ ] **Replay**... replaying a watch party should replay all the events that happened during the watch party, in the order and timeline that they happened. It should look exactly like a live recording of the watch party.

### Bonus Functionality

- [ ] **Session names and user names**. This makes it easier to know what the session is about and see who else is in the session!
- [ ] **Intuitive UX for the replay session**. Show some sort of notifications or a timeline that makes it easy to understand when participants played, paused, or seeked during the replayed session.
- [ ] **Intuitive UX for the watch session**. Show some sort of notifications or a timeline that makes it easy to understand when participants play, pause, or seek the currently playing video.
- [ ] **Other fun ideas**. Search for sessions by name, put a list of currently active watch party sessions on the home page and let you join them, create watch parties with playlists of Youtube videos instead of a single video ...

Only attempt the bonus items once you’ve completed the required functionality and tested all the edge-cases for videos to be synced. If you can also complete the bonus functionality within the **5 hour time limit**, we will be impressed!

🚨 **Please fill out the rubric in the README with the functionality you were able to complete**

### Help & Clarifications

If you want something about the problem statement clarified at any point while you’re working on this, feel free to **email me** at nikhil@nooks.in or even **text me** at 408-464-2288. I will reply as soon as humanly possible and do my best to unblock you.

Feel free to use any resource on the Internet to help you tackle this challenge better: guides, technical documentation, sample projects on Github — anything is fair game! We want to see how you can build things in a real working environment where no information is off limits.

### Submission

When you’ve spent **5 hours** on this task and / or have finished it, please send back your results to me via email as a **zip file**. Make sure to include any instructions about how to run the app in the README.md.

I will take a look and we will schedule a time to talk about your solution!
