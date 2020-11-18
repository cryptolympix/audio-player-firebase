import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';

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
        <Typography variant="h2" component="h1">
          Partage ta musique en toute simplicité
        </Typography>
      </Grid>
      <Grid
        container
        direction="column"
        justify="center"
        style={{ marginTop: '40px' }}
        spacing={5}
      >
        <Grid item>
          <Typography variant="h4" component="h3">
            Comment ça fonctionne ?
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1" component="p">
            Créer une salle d'écoute en te rendant sur la page{' '}
            <Link href="/create">ici</Link>. Après avoir complété et validé le
            formulaire, ta salle est disponible et prête à l'emploi. Pour
            inviter d'autres utilisateurs à te rejoindre, rien de plus simple,
            clique sur le bouton pour copier le lien de partage et envoie le.
            Lorsque les autres utilisateurs cliqueront sur le lien, ils seront
            redirigé vers ta salle d'écoute. Une fois arrivé, ils devront
            choisir un nom d'utilisateur pour pour qu'il soit identifiable dans
            la salle. Puis pour être synchronisé, il devront ensuite activé le
            synchronisation en cliquant sur le bouton. Une fois cette étape
            terminée, il ne reste plus qu'à lancer la musique !
          </Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" href="/create">
            <Typography variant="button">
              Créer ma première salle d'écoute
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
}
