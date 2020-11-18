import React, { useState, useEffect, FormEvent } from 'react';
import {
  makeStyles,
  createStyles,
  Theme,
  useTheme,
} from '@material-ui/core/styles';
import { v1 as uuidv1 } from 'uuid';
import { useHistory } from 'react-router-dom';
import crypto from 'crypto';
import firebase from '../firebase';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Checkbox from '@material-ui/core/Checkbox';

interface Track {
  composer: string;
  title: string;
  ref: string;
  url?: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    item: {
      margin: 'auto',
    },
    form: {
      maxWidth: theme.spacing(120),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
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
    control: {
      marginTop: theme.spacing(5),
    },
    list: {
      maxHeight: '600px',
      overflowY: 'scroll',
    },
    track: {
      marginTop: theme.spacing(3),
      textAlign: 'left',
    },
    submit: {
      marginTop: theme.spacing(10),
    },
  })
);

export default function Create() {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();

  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<any>('');
  const [roomSize, setRoomSize] = useState<any>('');
  const [roomAdmin, setRoomAdmin] = useState<any>('');
  const [roomNameError, setRoomNameError] = useState(false);
  const [roomSizeError, setRoomSizeError] = useState(false);
  const [roomAdminError, setRoomAdminError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [storageTracks, setStorageTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);

  useEffect(() => {
    listAudioTracksFromStorage();
  }, []);

  function listAudioTracksFromStorage() {
    let audioRef = firebase.storage().ref().child('audio');
    audioRef
      .list()
      .then(async (res) => {
        const tracks: Track[] = [];
        const promises: Promise<any>[] = [];

        res.prefixes.forEach((folder) => {
          promises.push(
            new Promise((resolve, reject) => {
              audioRef
                .child(folder.name)
                .listAll()
                .then(async (res) => {
                  const promises: Promise<void>[] = [];

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
      .then((tracks) => {
        setStorageTracks(tracks);
        setLoaded(true);
      })
      .catch((err) => {
        setError(err);
      });
  }

  function createRoom(event: FormEvent) {
    event.preventDefault();
    let hasError = false;

    if (!roomName.match(/.{1,50}/)) {
      setRoomNameError(true);
      hasError = true;
    }

    if (!roomSize.match(/[0-5]{1}[0-9]?/)) {
      setRoomSizeError(true);
      hasError = true;
    }

    if (
      !roomAdmin.match(
        /[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+/
      )
    ) {
      setRoomAdminError(true);
      hasError = true;
    }

    if (!hasError) {
      const roomID = uuidv1();
      firebase
        .firestore()
        .collection('rooms')
        .doc(roomID)
        .set({
          name: roomName,
          size: roomSize,
          admin: roomAdmin,
          createdAt: Date.now(),
          url: `${process.env.REACT_APP_PUBLIC_URL}/rooms/${roomID}`,
          tracks: selectedTracks,
        })
        .then(() => {
          firebase
            .database()
            .ref(`rooms/${roomID}`)
            .set({
              currentTrack: selectedTracks[0],
              users: {
                ['-' +
                crypto.randomBytes(20).toString('hex').slice(0, 18)]: roomAdmin,
              },
              state: 'pause',
              time: 0,
            })
            .catch((err) => {
              console.error(err);
              setError(err.message);
            });
          history.push(`/rooms/${roomID}?admin=true`, {
            fromCreate: true,
          });
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
        });
    }
  }

  function onToggleTrack(event: React.ChangeEvent<any>) {
    const ref = event.target.value;
    const track = storageTracks.find((t) => t.ref === ref);
    if (track) {
      if (event.target.checked) {
        setSelectedTracks(selectedTracks.concat(track));
      } else {
        setSelectedTracks(selectedTracks.filter((t) => t.ref !== track.ref));
      }
    }
  }

  function clearErrors() {
    setRoomNameError(false);
    setRoomSizeError(false);
    setRoomAdminError(false);
  }

  // wait until tracks are loaded
  if (!loaded) {
    return <div />;
  }

  return (
    <ClickAwayListener onClickAway={clearErrors}>
      <Grid
        container
        direction="column"
        justify="center"
        alignItems="center"
        className={classes.root}
      >
        <Grid item className={classes.item}>
          <Paper
            style={{
              padding: theme.spacing(8),
              transition: 'none',
            }}
            elevation={3}
          >
            <Typography variant="h3" component="h1">
              Créer une salle d'écoute
            </Typography>
            <form
              className={classes.form}
              onSubmit={createRoom}
              onClick={clearErrors}
              noValidate
            >
              <FormControl component="fieldset" fullWidth>
                <TextField
                  className={classes.textfield}
                  id="roomName"
                  label="Nom de la salle"
                  required
                  fullWidth
                  type="text"
                  margin="normal"
                  inputProps={{ maxLength: 50 }}
                  FormHelperTextProps={{ className: classes.helperText }}
                  helperText="Le nom de la salle d'écoute doit contenir entre 6 et 50 caractères (tous les caractères sont autorisés)"
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  error={roomNameError}
                />
                <TextField
                  className={classes.textfield}
                  id="roomSize"
                  label="Nombre de participants"
                  required
                  fullWidth
                  type="number"
                  margin="normal"
                  inputProps={{ maxLength: 2 }}
                  FormHelperTextProps={{ className: classes.helperText }}
                  helperText="Doit contenir entre 2 et 59 participants"
                  value={roomSize}
                  onChange={(event) => setRoomSize(event.target.value)}
                  error={roomSizeError}
                />
                <TextField
                  className={classes.textfield}
                  id="roomAdmin"
                  label="Nom d'utilisateur"
                  required
                  fullWidth
                  type="text"
                  margin="normal"
                  inputProps={{ maxLength: 30 }}
                  FormHelperTextProps={{ className: classes.helperText }}
                  helperText="Doit contenir entre 1 et 30 lettres (caractères numériques non autorisés)"
                  value={roomAdmin}
                  onChange={(event) => setRoomAdmin(event.target.value)}
                  error={roomAdminError}
                />
                <FormControl component="fieldset" className={classes.control}>
                  <FormLabel
                    component="legend"
                    focused={false}
                    style={{ marginBottom: '10px', fontWeight: 600 }}
                  >
                    <Typography variant="h5">
                      Sélectionner les musiques à utiliser :
                    </Typography>
                  </FormLabel>
                  <FormGroup className={classes.list}>
                    {storageTracks
                      .map((track) => {
                        const label = `${track.composer} - ${track.title}`;
                        return {
                          label,
                          title: track.title,
                          ref: track.ref,
                          url: track.url,
                        };
                      })
                      .sort((data1, data2) => {
                        return data1.label < data2.label
                          ? -1
                          : data1.label > data2.label
                          ? 1
                          : 0;
                      })
                      .map((data, i) => (
                        <FormControlLabel
                          key={`track-${i}`}
                          className={classes.track}
                          label={data.label}
                          control={
                            <Checkbox
                              onChange={onToggleTrack}
                              name={data.ref}
                              value={data.ref}
                            />
                          }
                        />
                      ))}
                  </FormGroup>
                </FormControl>
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
          </Paper>
        </Grid>
        <Snackbar
          open={error !== null}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error || ''}
          </Alert>
        </Snackbar>
      </Grid>
    </ClickAwayListener>
  );
}
