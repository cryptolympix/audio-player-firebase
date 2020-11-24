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
        var isAdmin = getQuery('admin');
        loadRoom();

        var clipboard = new ClipboardJS('#clipboard-button', {
          text: () => {
            return window.location.href.replace('&admin=true', '');
          },
        });

        clipboard.on('success', () => {
          createAlert('.alert', 'Lien copié dans le presse-papier', 'success');
        });

        var closeButton = document.querySelector('#close-button');
        closeButton.classList.add(isAdmin ? 'btn-danger' : 'btn-secondary');
        if (!isAdmin) {
          closeButton.setAttribute('disabled', '');
          closeButton.style.cursor = 'not-allowed';
        }
        closeButton.addEventListener('click', (event) => {
          event.preventDefault();
          closeRoom();
        });
      }

      // JOIN PAGE
      if (document.location.pathname === '/join.html') {
        listRooms();
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

        var label = document.createElement('label');
        label.classList.add('form-check-label');
        label.setAttribute('for', track.ref);
        label.style.cursor = 'pointer';
        label.style.userSelect = 'none';
        label.innerHTML = `<b>${track.composer}</b> - ${track.title}`;

        var div = document.createElement('div');
        div.classList.add('form-check');
        div.appendChild(input);
        div.appendChild(label);
        div.onclick = (event) => toggleCheck(event, track.ref); // To unckeck the radio button

        function toggleCheck(event, name) {
          event.preventDefault();
          var trackNode = document.getElementsByName(name)[0];
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
      if (trackInfos.length > 0) {
        firebase
          .database()
          .ref(`rooms/${roomId}`)
          .set({
            activeTrack: trackInfos[0],
            state: 'pause',
            time: 0,
          })
          .then(() => {
            redirect(`/room.html?id=${roomId}&admin=true`);
          })
          .catch(console.error);
      } else {
        createAlert(
          '.alert',
          "Tu dois choisir au minimum une musique pour créer une salle d'écoute",
          'warning'
        );
      }
    })
    .catch(console.error);
}

async function closeRoom() {
  var roomId = getQuery('id');
  var isAdmin = getQuery('admin');

  if (isAdmin) {
    await firebase
      .database()
      .ref(`rooms/${roomId}`)
      .remove()
      .catch(console.error);
    await firebase
      .firestore()
      .collection('rooms')
      .doc(roomId)
      .delete()
      .catch(console.error);
    redirect('/');
  }
}

function loadRoom() {
  var roomId = getQuery('id');
  var isAdmin = getQuery('admin');
  var player = document.querySelector('#audio-player');
  var playlist = document.querySelector('#playlist');

  function initElements(room, tracks) {
    var roomName = document.querySelector('#room-name');
    var roomAdmin = document.querySelector('#room-admin');
    var trackComposer = document.querySelector('#active-track-composer');
    var trackTitle = document.querySelector('#active-track-title');
    var spinner = document.querySelector('#playlist-spinner');
    var syncButton = document.querySelector('#sync-button');
    var syncIcon = document.querySelector('#sync-icon');
    var syncState = document.querySelector('#sync-state');

    roomName.textContent = room.name;
    roomAdmin.textContent = `créée par ${room.admin}`;
    trackComposer.textContent = tracks[0].composer;
    trackTitle.textContent = tracks[0].title;
    spinner.remove();

    syncIcon.textContent = isAdmin ? 'sync' : 'sync_disabled';
    syncState.textContent = isAdmin
      ? 'Synchronisation activée'
      : 'Synchronisation désactivée';
    if (isAdmin) syncButton.classList.add('active');

    syncButton.addEventListener('click', () => {
      const isActive = syncButton.classList.contains('active');
      syncIcon.textContent = isActive ? 'sync_disabled' : 'sync';
      syncState.textContent = isActive
        ? 'Synchronisation désactivée'
        : 'Synchronisation activée';
    });
  }

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
        label.innerHTML = `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-music-note-list" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 13c0 1.105-1.12 2-2.5 2S7 14.105 7 13s1.12-2 2.5-2 2.5.895 2.5 2z"/>
        <path fill-rule="evenodd" d="M12 3v10h-1V3h1z"/>
        <path d="M11 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 16 2.22V4l-5 1V2.82z"/>
        <path fill-rule="evenodd" d="M0 11.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 .5 7H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5zm0-4A.5.5 0 0 1 .5 3H8a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5z"/>
      </svg> ${track.composer} - ${track.title}`;
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
          initElements(room, tracks);
          createPlaylist(tracks);
          initPlayer(tracks[0].url);

          var roomRef = firebase.database().ref(`rooms/${roomId}`);

          var isSync = () =>
            document.querySelector('#sync-button').classList.contains('active');

          player.onloadedmetadata = () => {
            var input = document.querySelector('.form-check-input:checked');
            var track = JSON.parse(input.value);
            roomRef.child('activeTrack').update(track);
            document.querySelector('#active-track-composer').textContent =
              track.composer;
            document.querySelector('#active-track-title').textContent =
              track.title;
          };

          /**
           * The admin emit the event wy updating the database
           */
          if (isAdmin) {
            player.onplay = () => {
              if (isSync()) roomRef.update({ state: 'play' });
            };

            player.onpause = () => {
              if (isSync()) roomRef.update({ state: 'pause' });
            };

            player.onseeking = (event) => {
              if (isSync()) roomRef.update({ time: event.target.currentTime });
            };

            /**
             *  The other user are listening the database events
             */
          } else {
            roomRef.child('state').on('value', (snap) => {
              if (isSync()) {
                if (snap.val() == 'play') {
                  player.play();
                } else {
                  player.pause();
                }
              }
            });

            roomRef.child('time').on('value', (snap) => {
              if (isSync()) player.currentTime = snap.val();
            });

            roomRef.child('activeTrack').on('value', (snap) => {
              if (isSync()) {
                var track = snap.val();
                player.src = track.url;
                document.querySelector('input:checked').checked = false;
                document.querySelector(
                  `input[id="${track.ref}"]`
                ).checked = true;
              }
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

async function listRooms() {
  var rooms = document.querySelector('#rooms');
  var snapshot = await firebase.firestore().collection('rooms').get();

  document.querySelector('#rooms').innerHTML = '';

  snapshot.forEach((doc) => {
    var roomId = doc.id;
    var data = doc.data();
    if (data.name && data.admin) {
      var a = document.createElement('a');
      a.setAttribute('href', `/room.html?id=${roomId}`);
      a.innerHTML = `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-speaker-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-2.5 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/>
      <path fill-rule="evenodd" d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm6 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 7a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>
    </svg> <b>${data.name}</b> créée par <i>${data.admin}</i>`;

      var li = document.createElement('li');
      li.classList.add('list-group-item');
      li.classList.add('border');
      li.classList.add('m-2');
      li.appendChild(a);
      rooms.appendChild(li);
    }
  });

  console.log(rooms.hasChildNodes());

  if (!rooms.hasChildNodes()) {
    var li = document.createElement('li');
    li.classList.add('list-group-item');
    li.classList.add('border-0');
    li.textContent = "Aucune salle d'écoute disponible";
    rooms.appendChild(li);
  }
}

function createAlert(id, msg, severity) {
  var alert = document.querySelector(id);
  alert.classList.remove('invisible');
  alert.classList.add(
    severity === 'success'
      ? 'alert-success'
      : severity === 'error'
      ? 'alert-danger'
      : severity === 'warning'
      ? 'alert-warning'
      : 'alert-info'
  );
  alert.textContent = msg;
  setTimeout(() => {
    alert.classList.remove('alert-success');
    alert.classList.remove('alert-danger');
    alert.classList.remove('alert-warning');
    alert.classList.remove('alert-info');
    alert.classList.add('invisible');
  }, 5000);
}

function redirect(to) {
  const location = window.location;
  const baseUrl = `${location.protocol}//${location.host}`;
  location.assign(baseUrl + to);
}

function getQuery(val) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(val);
}
