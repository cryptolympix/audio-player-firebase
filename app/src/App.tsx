import React, { useEffect } from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import firebase from './firebase';

import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';

const Navigation = React.lazy(() => import('./components/Navigation'));
const Content = React.lazy(() => import('./components/Content'));
// const Footer = React.lazy(() => import('./components/structure/Footer'));

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100vw',
      minHeight: '100vh',
      textAlign: 'center',
    },
  })
);

function App() {
  const classes = useStyles();

  useEffect(() => {
    firebase.auth().signInAnonymously().catch(console.error);

    return () => {
      firebase.auth().signOut().catch(console.error);
    };
  }, []);

  return (
    <Container disableGutters maxWidth={false} className={classes.root}>
      <CssBaseline />
      <Navigation />
      <Content />
    </Container>
  );
}

export default App;
