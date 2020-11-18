import React, { useEffect, useState, FormEvent } from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useLocation, useParams, useHistory } from 'react-router-dom';
import CopyToClipboard from 'react-copy-to-clipboard';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import firebase from '../firebase';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import QueueMusicIcon from '@material-ui/icons/QueueMusic';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import SyncIcon from '@material-ui/icons/Sync';
import SyncDisabledIcon from '@material-ui/icons/SyncDisabled';
import ShareIcon from '@material-ui/icons/Share';
import CloseIcon from '@material-ui/icons/Close';

interface Track {
  title: string;
  composer: string;
  ref: string;
  url: string;
}

type Severity = 'info' | 'success' | 'warning' | 'error';

interface SnackAlert {
  msg: string;
  severity: Severity;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      margin: 'auto',
    },
    form: {
      maxWidth: theme.spacing(120),
      padding: theme.spacing(5),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 'auto',
    },
    textfield: {
      '&:selected': {
        backgroundColor: '#ffff',
      },
    },
    helperText: {
      color: theme.palette.text.disabled,
      fontWeight: 500,
    },
    submit: {
      marginTop: theme.spacing(10),
    },
  })
);

export default function Room() {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation<{ fromCreate: boolean }>();
  const query = new URLSearchParams(location.search);
  const isMobile = useMediaQuery('(max-width:600px)');
  const { roomId } = useParams<{ roomId: string }>();

  const isAdmin = query.get('admin') === 'true';

  const [synchronized, setSynchronized] = useState(isAdmin);
  const [loaded, setLoaded] = useState(false);
  const [alert, setAlert] = useState<SnackAlert | null>(null);

  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [admin, setAdmin] = useState('');
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  const [username, setUsername] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState(false);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrack, setActiveTrack] = useState<Track | null>();
  const [audio, setAudio] = useState<HTMLAudioElement>(new Audio());
  const [time, setTime] = useState(0);

  /**
   * Disconnect the user when he exiting the page
   */
  useEffect(() => {
    // When reloading or exiting the page
    window.addEventListener('beforeunload', () => {
      firebase
        .database()
        .ref(`rooms/${roomId}`)
        .child('users')
        .set(activeUsers.filter((user) => user !== username))
        .catch(console.error);
    });
  }, [activeUsers, roomId, username, admin, isAdmin]);

  /**
   * Load the data of the room
   */
  useEffect(() => {
    firebase
      .firestore()
      .collection('rooms')
      .doc(roomId)
      .get()
      .then((snap) => {
        if (snap.exists) {
          const data = snap.data();
          if (data) {
            setName(data.name);
            setSize(data.size);
            setAdmin(data.admin);
            setTracks(data.tracks);
            if (isAdmin && location.state?.fromCreate) {
              setUsername(data.admin);
              setUsernameSaved(true);
            }
            return data;
          }
        } else {
          throw new Error("The room desn' exist");
        }
      })
      .then((data) => {
        firebase
          .database()
          .ref(`rooms/${roomId}/users`)
          .set(activeUsers.concat(data?.admin))
          .then(() => {
            setLoaded(true);
          })
          .catch(console.error);
      })
      .catch((err) => {
        console.error(err.message);
        history.push('/');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, history, isAdmin, location.state?.fromCreate]);

  /**
   * Synchronize the active users in the room
   */
  useEffect(() => {
    firebase
      .database()
      .ref(`rooms/${roomId}`)
      .child('users')
      .on('value', (snap) => {
        setActiveUsers(snap.val() || []);
      });
  }, [roomId]);

  /**
   * Synchronize the audio source
   */
  useEffect(() => {
    firebase
      .database()
      .ref(`rooms/${roomId}`)
      .child('currentTrack')
      .on('value', (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setActiveTrack({
            composer: data.composer,
            title: data.title,
            ref: data.ref,
            url: data.url,
          });
          audio.src = data.url;
        }
      });
  }, [roomId, isAdmin, audio]);

  /**
   * Synchronize the state of the audio (playing or not)
   */
  useEffect(() => {
    if (isAdmin || !synchronized) return;
    firebase
      .database()
      .ref(`rooms/${roomId}`)
      .child('state')
      .on('value', (snapshot) => {
        switch (snapshot.val()) {
          case 'play':
            if (audio.paused) audio.play();
            break;
          case 'pause':
            if (!audio.paused) audio.pause();
            break;
          default:
            audio.pause();
            break;
        }
      });
  }, [roomId, isAdmin, audio, synchronized]);

  /**
   * Synchronized the audio time
   */
  useEffect(() => {
    if (isAdmin || !synchronized) return;
    firebase
      .database()
      .ref(`rooms/${roomId}`)
      .child('time')
      .on('value', (snapshot) => {
        audio.currentTime = snapshot.val();
      });
  }, [roomId, isAdmin, audio, synchronized]);

  /**
   * Update the state of the audio
   * @param state
   */
  function onStateChange(state: 'play' | 'pause') {
    if (synchronized) {
      firebase
        .database()
        .ref(`rooms/${roomId}`)
        .child('state')
        .set(state)
        .catch(console.error);
      firebase
        .database()
        .ref(`rooms/${roomId}`)
        .child('time')
        .set(time)
        .catch(console.error);
    }
  }

  // Set the audio instance of AudioPlayer to the state and update the current time
  function onListen(event: any) {
    if (!audio) {
      const newAudio = event.target;
      setAudio(newAudio);
    }
    setTime(event.target.currentTime);
  }

  function onToggleSync() {
    setSynchronized(!synchronized);
    if (isMobile) {
      setAlert({
        msg: synchronized ? `Tu n'est plus synchronisé` : `Tu es synchronisé`,
        severity: synchronized ? 'warning' : 'success',
      });
    }
  }

  /**
   * When a user enter in the room, he must choose a username to be identified in the room
   * @param event
   */
  function chooseUsername(event: FormEvent) {
    event.preventDefault();

    if (
      username.match(
        /[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+/
      )
    ) {
      firebase
        .database()
        .ref(`rooms/${roomId}`)
        .child('users')
        .set(activeUsers.concat(username))
        .then(() => {
          if (activeUsers.length < size) {
            if (!activeUsers.includes(username)) {
              setUsername(username);
              setUsernameSaved(true);
              setLoaded(true);
            } else {
              setAlert({
                msg: "Ce nom d'utilisateur est déjà utilisé",
                severity: 'warning',
              });
            }
          } else {
            setAlert({
              msg: 'La salle est pleine, vous ne pouvez plus rentrer...',
              severity: 'warning',
            });
          }
        })
        .catch(console.error);
    } else {
      setUsernameError(true);
    }
  }

  /**
   * Skip the current to go to the previous track (-1), or the next track (1)
   * @param a -1 or 1
   */
  function skipTrack(a: number) {
    if (activeTrack) {
      let index = tracks.findIndex((track) => (track.ref = activeTrack.ref));
      console.log(index);
      if (index > -1) {
        const next = tracks[Math.abs((index + a) % tracks.length)];
        firebase
          .database()
          .ref(`rooms/${roomId}`)
          .child('currentTrack')
          .set(next)
          .then(() => {
            setActiveTrack(next);
          })
          .catch(console.error);
      }
    }
  }

  function selectTrack(track: Track) {
    if (isAdmin && synchronized) {
      firebase
        .database()
        .ref(`rooms/${roomId}`)
        .child('currentTrack')
        .set(track)
        .then(() => {
          if (track !== activeTrack) {
            setActiveTrack(track);
          }
        })
        .catch(console.error);
    }
  }

  /**
   * Delethe the room in the database and redirect to home page
   */
  function closeRoom() {
    if (isAdmin) {
      firebase
        .database()
        .ref('rooms')
        .child(roomId)
        .remove()
        .catch(console.error);
      firebase
        .firestore()
        .collection('rooms')
        .doc(roomId)
        .delete()
        .catch(console.error);
      history.push('/');
    }
  }

  function handleCloseAlert(event?: React.SyntheticEvent, reason?: string) {
    if (reason === 'clickaway') return;
    setAlert(null);
  }

  if (!loaded) {
    return <div />;
  }

  if (!usernameSaved) {
    return (
      <ClickAwayListener onClickAway={() => setUsernameError(false)}>
        <Grid container direction="column" justify="center">
          <Typography variant="h3" component="h3">
            Choisir un nom d'utilisateur pour la salle d'écoute
          </Typography>
          <form className={classes.form} onSubmit={chooseUsername} noValidate>
            <FormControl component="fieldset" fullWidth>
              <TextField
                className={classes.textfield}
                id="username"
                label="Nom d'utilisateur"
                required
                fullWidth
                autoFocus
                type="text"
                margin="normal"
                inputProps={{ maxLength: 30 }}
                FormHelperTextProps={{ className: classes.helperText }}
                helperText="Doit contenir entre 1 et 30 lettres (caractères numériques non autorisés)"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                error={usernameError}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                <Typography variant="button">Valider</Typography>
              </Button>
            </FormControl>
          </form>
          {alert !== null && (
            <Snackbar
              open={true}
              autoHideDuration={6000}
              onClose={handleCloseAlert}
            >
              <Alert onClose={handleCloseAlert} severity={alert.severity}>
                <Typography variant="subtitle1">{alert.msg}</Typography>
              </Alert>
            </Snackbar>
          )}
        </Grid>
      </ClickAwayListener>
    );
  }

  return (
    <ClickAwayListener onClickAway={() => setAlert(null)}>
      <Grid container className={classes.root} justify="center">
        <Grid container direction="column" justify="center">
          <Grid item>
            <Typography variant="h1" component="h1">
              {name}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="subtitle1" style={{ marginTop: '10px' }}>
              crée par <b>{admin}</b>
            </Typography>
          </Grid>
        </Grid>

        <Grid container direction="row" style={{ marginTop: '50px' }}>
          <Grid
            container
            direction="row"
            justify="space-between"
            alignItems="center"
          >
            <Grid
              container
              direction="column"
              style={{ flex: isMobile ? 5 : 1, textAlign: 'left' }}
            >
              <Grid item>
                <Typography
                  variant="h6"
                  component="a"
                  href={activeTrack?.url}
                  target="_blank"
                  style={{
                    textDecoration: 'none',
                    fontStyle: 'italic',
                    fontWeight: 500,
                  }}
                >
                  {activeTrack?.title}
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="body2">{activeTrack?.composer}</Typography>
              </Grid>
            </Grid>

            <Grid
              container
              justify="flex-end"
              alignItems="center"
              style={{ flex: 1 }}
            >
              {!isMobile && (
                <Grid item>
                  <Typography variant="h6" style={{ marginRight: '10px' }}>
                    {synchronized
                      ? 'Synchronisation activée'
                      : 'Synchronisation désactivée'}
                  </Typography>
                </Grid>
              )}
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onToggleSync}
                >
                  {synchronized ? (
                    <SyncIcon htmlColor="#fff" />
                  ) : (
                    <SyncDisabledIcon htmlColor="#fff" />
                  )}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Grid container style={{ marginTop: '20px' }}>
          <AudioPlayer
            src={activeTrack?.url}
            autoPlayAfterSrcChange={false}
            autoPlay={false}
            showDownloadProgress
            showSkipControls={!isMobile && isAdmin}
            listenInterval={500}
            preload="auto"
            onPlay={() => onStateChange('play')}
            onPause={() => onStateChange('pause')}
            onListen={onListen}
            onClickNext={() => skipTrack(1)}
            onClickPrevious={() => skipTrack(-1)}
          />
        </Grid>

        <Grid container direction="column" style={{ marginTop: '30px' }}>
          <Grid item>
            <Typography variant="h5" component="h5">
              Playlist
            </Typography>
          </Grid>
          <Grid container direction="column" style={{ marginTop: '10px' }}>
            {tracks.map((track, i) => (
              <Button
                key={`track-${i}`}
                variant="text"
                onClick={() => selectTrack(track)}
                disabled={!isAdmin}
              >
                <QueueMusicIcon />
                <Typography
                  variant="body1"
                  style={{
                    marginLeft: '10px',
                    fontStyle: 'italic',
                  }}
                >
                  {track.composer} - {track.title}
                </Typography>
              </Button>
            ))}
          </Grid>
        </Grid>

        <Grid
          container
          direction="column"
          justify="center"
          style={{ marginTop: '30px' }}
        >
          <Grid item>
            <Typography variant="h5">
              {activeUsers.length || 0} / {size} Participants
            </Typography>
          </Grid>
          <Grid container direction="column" style={{ marginTop: '10px' }}>
            {activeUsers.map((user, i) => (
              <Typography key={`user-${i}`} variant="body2">
                {user}
              </Typography>
            ))}
          </Grid>
        </Grid>

        <Grid
          container
          direction="column"
          justify="center"
          style={{ marginTop: '30px', width: '300px' }}
          spacing={5}
        >
          <Grid item>
            <CopyToClipboard
              text={`${process.env.REACT_APP_PUBLIC_URL}/rooms/${roomId}`}
              onCopy={() =>
                setAlert({
                  msg: "Lien d'invitation copié !",
                  severity: 'success',
                })
              }
            >
              <Button
                variant="contained"
                color="primary"
                style={{ width: '100%' }}
              >
                <ShareIcon htmlColor="#fff" />
                <Typography
                  variant="button"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginLeft: '5px',
                  }}
                >
                  Partager la salle d'écoute
                </Typography>
              </Button>
            </CopyToClipboard>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              style={{ width: '100%' }}
              onClick={closeRoom}
              disabled={!isAdmin}
            >
              <CloseIcon htmlColor="#fff" />
              <Typography
                variant="button"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginLeft: '5px',
                }}
              >
                Fermer la salle d'écoute
              </Typography>
            </Button>
          </Grid>
        </Grid>

        {alert !== null && (
          <Snackbar
            open={true}
            autoHideDuration={6000}
            onClose={handleCloseAlert}
          >
            <Alert onClose={handleCloseAlert} severity={alert.severity}>
              <Typography variant="subtitle1">{alert.msg}</Typography>
            </Alert>
          </Snackbar>
        )}
      </Grid>
    </ClickAwayListener>
  );
}
