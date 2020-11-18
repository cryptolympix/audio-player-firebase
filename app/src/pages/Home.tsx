import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
  })
);

export default function Home() {
  const classes = useStyles();
  return (
    <Grid
      container
      className={classes.root}
      direction="column"
      justify="center"
      alignItems="center"
    >
      <Grid item>
        <Typography variant="h1" component="h1">
          Partage ta musique en temps réel
        </Typography>
      </Grid>
      <Grid container direction="column" justify="center">
        <Grid item>
          <Typography
            variant="body1"
            component="p"
            style={{ marginTop: '5vh' }}
          >
            Créer une salle d'écoute et invite tes amis à te rejoindre pour
            partager en temps réel un fichier audio tout en gardant une qualité
            originale.
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
