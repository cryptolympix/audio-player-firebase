document.addEventListener('DOMContentLoaded', () => {
  firebase
    .auth()
    .signInAnonymously()
    .then(() => {
      // CREATE PAGE
      if (document.location.pathname === '/create.html') {
        var form = document.querySelector('#form-create');
        form.addEventListener('submit', createRoom);
        loadTracks();
      }

      // ROOM PAGE
      if (document.location.pathname === '/room.html') {
        loadRoom();
      }
    })
    .catch(console.error);
});

function loadTracks() {
  var audioRef = firebase.storage().ref('audio');
  var trackList = document.querySelector('#tracklist');

  audioRef
    .list()
    .then(async (res) => {
      var tracks = [];
      var promises = [];

      res.prefixes.forEach(async (folder) => {
        promises.push(
          new Promise((resolve, reject) => {
            audioRef
              .child(folder.name)
              .list()
              .then(async (res) => {
                var promises = [];

                res.items.forEach((item) => {
                  const ref = `audio/${folder.name}/${item.name}`;
                  promises.push(
                    new Promise((resolve, reject) => {
                      firebase
                        .storage()
                        .ref(ref)
                        .getDownloadURL()
                        .then((url) => {
                          // Format the name of the audio to be a title
                          let formatTitle = item.name.replaceAll('_', ' ');
                          const index = item.name.lastIndexOf('.');
                          if (index > -1) {
                            formatTitle = formatTitle.slice(0, index);
                          }

                          tracks.push({
                            title: formatTitle,
                            composer: folder.name || 'Unknown',
                            url,
                            ref,
                          });
                          resolve();
                        })
                        .catch(reject);
                    })
                  );
                });
                await Promise.all(promises);
                resolve();
              })
              .catch(reject);
          })
        );
      });
      await Promise.all(promises);
      return tracks;
    })
    // Sort the track alphabetically
    .then((tracks) => {
      return tracks.sort((trackA, trackB) => {
        if (trackA.composer < trackB.composer) return -1;
        if (trackA.composer > trackB.composer) return 1;
        return 0;
      });
    })
    // Add the node to the dom
    .then((tracks) => {
      trackList.innerHTML = '';
      tracks.forEach((track) => {
        var input = document.createElement('input');
        input.classList.add('form-check-input');
        input.classList.add('track');
        input.setAttribute('type', 'radio');
        input.setAttribute('id', track.ref);
        input.setAttribute('value', JSON.stringify(track));
        input.setAttribute('name', track.ref);
        // To unckeck the radio button
        input.onclick = (event) => toggleCheck(event, track.ref);

        var label = document.createElement('label');
        label.classList.add('form-check-label');
        label.setAttribute('for', track.ref);
        label.style.cursor = 'pointer';
        label.style.userSelect = 'none';
        label.innerHTML = `<b>${track.composer}</b> - ${track.title}`;
        // To unckeck the radio button
        label.onclick = (event) => toggleCheck(event, track.ref);

        var div = document.createElement('div');
        div.classList.add('form-check');
        div.appendChild(input);
        div.appendChild(label);

        function toggleCheck(event, name) {
          event.preventDefault();
          var trackNode = document.getElementsByName(name)[0];
          console.log(trackNode);
          var checked = trackNode.checked;
          trackNode.checked = !checked;
        }

        trackList.appendChild(div);
      });
    })
    .catch(console.error);
}

function createRoom(event) {
  event.preventDefault();

  var roomName = document.querySelector('#room-name').value;
  var roomAdmin = document.querySelector('#admin-name').value;
  var roomId =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Get the checked input
  var selectedTracks = document.querySelectorAll('.track:checked');
  var trackInfos = [];
  selectedTracks.forEach((track) => trackInfos.push(JSON.parse(track.value)));

  firebase
    .firestore()
    .collection('rooms')
    .doc(roomId)
    .set({
      name: roomName,
      admin: roomAdmin,
      createdAt: Date.now(),
      tracks: trackInfos,
    })
    .then(() => {
      firebase
        .database()
        .ref(`rooms/${roomId}`)
        .set({
          activeTrack: trackInfos[0],
          state: 'pause',
          time: 0,
        })
        .then(() => {
          const location = window.location;
          const baseUrl = `${location.protocol}//${location.host}`;
          location.assign(baseUrl + `/room.html?id=${roomId}&admin=true`);
        })
        .catch(console.error);
    })
    .catch(console.error);
}

function loadRoom() {
  const urlParams = new URLSearchParams(window.location.search);

  var roomId = urlParams.get('id');
  var isAdmin = urlParams.get('admin');
  var player = document.querySelector('#audio-player');
  var playlist = document.querySelector('#playlist');

  function initPlayer(url) {
    player.preload = 'auto';
    player.src = url;
  }

  function createPlaylist(tracks) {
    tracks
      .sort((trackA, trackB) => {
        if (trackA.composer < trackB.composer) return -1;
        if (trackA.composer > trackB.composer) return 1;
        return 0;
      })
      .forEach((track, i) => {
        var input = document.createElement('input');
        input.classList.add('form-check-input');
        if (i === 0) input.setAttribute('checked', '');
        input.setAttribute('type', 'radio');
        input.setAttribute('id', track.ref);
        input.setAttribute('name', 'tracks');
        input.setAttribute('value', JSON.stringify(track));

        var label = document.createElement('label');
        label.classList.add('form-check-label');
        label.textContent = `${track.composer} - ${track.title}`;
        label.setAttribute('for', track.ref);

        var div = document.createElement('div');
        div.classList.add('form-check');
        div.classList.add('p-0');
        div.classList.add('list-group-item');
        div.appendChild(input);
        div.appendChild(label);
        div.onclick = () => {
          player.src = track.url;
        };

        playlist.appendChild(div);
      });
  }

  firebase
    .firestore()
    .collection('rooms')
    .doc(roomId)
    .get()
    .then((snap) => {
      if (snap.exists) {
        var room = snap.data();
        var roomName = room.name;
        var roomAdmin = room.admin;
        var tracks = room.tracks;

        if (roomName && roomAdmin && tracks) {
          playlist.innerHTML = '<h3 class="h3 mb-3">Playlist</h3>';
          createPlaylist(tracks);
          initPlayer(tracks[0].url);

          var roomRef = firebase.database().ref(`rooms/${roomId}`);

          /**
           * The admin emit the event wy updating the database
           */
          if (isAdmin) {
            player.onplay = () => roomRef.update({ state: 'play' });
            player.onpause = () => roomRef.update({ state: 'pause' });

            player.onseeking = (event) => {
              roomRef.update({ time: event.target.currentTime });
            };

            player.onloadedmetadata = () => {
              var track = document.querySelector('.form-check-input:checked');
              roomRef.child('activeTrack').update(JSON.parse(track.value));
            };
            /**
             *  The other user are listening the database events
             */
          } else {
            roomRef.child('state').on('value', (snap) => {
              if (snap.val() == 'play') {
                player.play();
              } else {
                player.pause();
              }
            });

            roomRef.child('time').on('value', (snap) => {
              player.currentTime = snap.val();
            });

            roomRef.child('activeTrack').on('value', (snap) => {
              var track = snap.val();
              player.src = track.url;
              document.querySelector('input:checked').checked = false;
              document.querySelector(`input[id="${track.ref}"]`).checked = true;
            });
          }
        } else {
          throw new Error("Something wen wrong when loading the room's data");
        }
      } else {
        throw new Error('Failed to load the room');
      }
    })
    .catch(console.error);
}
