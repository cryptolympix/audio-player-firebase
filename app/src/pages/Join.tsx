import React, { useState, useEffect } from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import firebase from '../firebase';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';

interface Room {
  id: string;
  name: string;
  admin: string;
  url: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: {
      backgroundColor: '#efefef',
      width: '300px',
      maxWidth: '90vw',
      marginRight: 'auto',
      marginLeft: 'auto',
      '&:not(:first-child)': {
        marginTop: '40px',
      },
    },
  })
);

export default function Join() {
  const classes = useStyles();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listAllRooms();
  }, []);

  async function listAllRooms() {
    const snapshot = await firebase.firestore().collection('rooms').get();
    const rooms: Room[] = [];

    await snapshot.forEach((doc) => {
      const roomId = doc.id;
      const data = doc.data();
      rooms.push({
        id: roomId,
        name: data.name,
        admin: data.admin,
        url: data.url,
      });
    });

    setRooms(rooms.filter((room) => room.id !== 'test'));
    setLoaded(true);
  }

  const roomList = () =>
    rooms.map((room, i) => (
      <Card key={`room-${i}`} className={classes.card}>
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {room.name}
          </Typography>
          <Typography variant="body1">
            créée par <b>{room.admin}</b>
          </Typography>
        </CardContent>
        <CardActions style={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="contained" color="primary" href={room.url}>
            <Typography variant="button">Rejoindre</Typography>
          </Button>
        </CardActions>
      </Card>
    ));

  if (!loaded) {
    return <div />;
  }

  return (
    <Grid container direction="column" justify="center">
      <Grid item>
        <Typography variant="h3" component="h1">
          Rejoindre une salle d'écoute
        </Typography>
      </Grid>
      <Grid
        container
        direction="column"
        justify="center"
        style={{ marginTop: '50px' }}
      >
        {rooms.length === 0 ? (
          <Typography variant="body1">Aucune salle d'écoute trouvée</Typography>
        ) : (
          roomList()
        )}
      </Grid>
    </Grid>
  );
}
