# 🎵 Audio Player

It is an application to listen to music in a synchronized way between several devices.

## Motivation

I teach music in a music school. During the confinement in November 2020 in the Paris region, I had to give my lessons by videoconference. The problem I have been having is with sharing music through Teams, Google Meet or Zoom software. These software provide sound sharing (with the browser or from the computer's sound device) but does not allow real synchronization between users. This application was therefore created to facilitate the sharing of audio tracks, it is ideal for sharing music because the original sound of the shared files is maintained. Indeed, these files are loaded by the client's browser, and one of the users manages the synchronization.

## Installation

Use `npm install` (or `yarn install`) to install the dependencies. Then `cd` into the project folder and tap `npm start` (or `yarn start`).

## Quick Start

```console
yarn start
```

## How it works ?

Create a new room and invite some people to it by sharing the link by the clipboard button. Notive that the person which has created the room is the only one that could synchronize his audio player with the guests. He has also a special url with the id of the room followed by a url parameter admin set to true.

The people who clicked on the shared link will be redirect to the room. To be synchronized with the room's admin, they have to activate the synchronization with the button at the top bar.

## Licence

[MIT.](https://github.com/mxjoly/audio-player-firebase/blob/master/LICENSE)
