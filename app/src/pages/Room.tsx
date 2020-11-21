import React, { useEffect, useState } from 'react';
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
  const [admin, setAdmin] = useState('');

  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);

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
            setAdmin(data.admin);
            setTracks(data.tracks);
            setActiveTrack(data.tracks[0]);
            setAudio(new Audio(data.tracks[0].url));
            setLoaded(true);
          }
        } else {
          throw new Error("The room doesn't exist");
        }
      })
      .catch((err) => {
        console.error(err.message);
        setAlert({ msg: err.message, severity: 'error' });
      });
  }, [roomId, history, isAdmin, location.state?.fromCreate]);

  /**
   * Synchronize the audio source
   */
  useEffect(() => {
    firebase
      .database()
      .ref(`rooms/${roomId}/currentTrack`)
      .on('value', (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          const track = tracks.find((track) => track.ref === activeTrack?.ref);
          if (track) {
            setActiveTrack(track);
          } else {
            setActiveTrack({
              composer: data.composer,
              ref: data.ref,
              title: data.title,
              url: data.url,
            });
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isAdmin, tracks]);

  /**
   * Synchronize the state of the audio (playing or not)
   */
  useEffect(() => {
    function handleState(snap: firebase.database.DataSnapshot) {
      if (audio) {
        switch (snap.val()) {
          case 'play':
            if (audio.paused) audio.play();
            break;
          case 'pause':
            if (!audio.paused) audio.pause();
            break;
          default:
            if (!audio.paused) audio.pause();
            break;
        }
      }
    }

    const stateRef = firebase.database().ref(`rooms/${roomId}/state`);

    if (!isAdmin && synchronized) {
      stateRef.on('value', handleState);
    }

    return () => {
      stateRef.off('value', handleState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isAdmin, synchronized, audio]);

  /**
   * Synchronized the audio time
   */
  useEffect(() => {
    function handleTime(snap: firebase.database.DataSnapshot) {
      if (audio) {
        setTime(snap.val());
        audio.currentTime = snap.val();
      }
    }

    const timeRef = firebase.database().ref(`rooms/${roomId}/time`);

    if (!isAdmin && synchronized) {
      timeRef.on('value', handleTime);
    }

    return () => {
      timeRef.off('value', handleTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, isAdmin, synchronized, audio]);

  /**
   * Update the state of the audio
   * @param state
   */
  function onStateChange(state: 'play' | 'pause') {
    if (isAdmin && synchronized) {
      firebase
        .database()
        .ref(`rooms/${roomId}`)
        .update({ state, time })
        .catch(console.error);
    }
  }

  function onToggleSync() {
    setSynchronized(!synchronized);
    if (isMobile) {
      setAlert({
        msg: synchronized
          ? `Synchronisation désactivée`
          : `Synchronisation activée`,
        severity: synchronized ? 'warning' : 'success',
      });
    }
  }

  /**
   * Skip the current to go to the previous track (-1), or the next track (1)
   * @param a -1 or 1
   */
  function skipTrack(a: number) {
    if (activeTrack) {
      let index = tracks.findIndex((track) => track.ref === activeTrack.ref);
      if (index > -1) {
        const next = tracks[Math.abs((index + a) % tracks.length)];
        firebase
          .database()
          .ref(`rooms/${roomId}`)
          .update({ activeTrack: next })
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
        .update({ activeTrack: track })
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
      firebase.database().ref(`rooms/${roomId}`).remove().catch(console.error);
      firebase
        .firestore()
        .collection('rooms')
        .doc(roomId)
        .delete()
        .catch(console.error);
      history.push('/');
    }
  }

  // Set the audio instance of AudioPlayer to the state and update the current time
  function onListen(event: any) {
    setTime(event.target.currentTime);
  }

  function handleCloseAlert(event?: React.SyntheticEvent, reason?: string) {
    if (reason === 'clickaway') return;
    setAlert(null);
  }

  if (!loaded || !activeTrack) {
    return <div />;
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
            src={activeTrack.url}
            autoPlayAfterSrcChange={false}
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
