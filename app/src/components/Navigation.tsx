import React from 'react';
import {
  makeStyles,
  createStyles,
  useTheme,
  Theme,
} from '@material-ui/core/styles';

import HomeIcon from '@material-ui/icons/Home';
import SpeakerIcon from '@material-ui/icons/Speaker';
import AddIcon from '@material-ui/icons/Add';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Hidden from '@material-ui/core/Hidden';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    topNavigation: {
      position: 'relative',
      width: '100%',
      backgroundColor: theme.palette.primary.dark,
      zIndex: 20,
    },
    bottomNavigation: {
      position: 'fixed',
      bottom: 0,
      width: '100%',
      height: '60px',
      backgroundColor: theme.palette.primary.dark,
      zIndex: 20,
    },
  })
);

function MobileNavigation() {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <>
      <Hidden xsDown>
        <AppBar className={classes.topNavigation}>
          <Toolbar>
            <Grid container justify="flex-start" spacing={5}>
              <Grid item>
                <Link href="/">
                  <HomeIcon htmlColor={theme.palette.common.white} />
                </Link>
              </Grid>
              <Grid item>
                <Link href="/create" underline="none">
                  <Typography variant="button">Créer</Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link href="/rooms" underline="none">
                  <Typography variant="button">Rejoindre</Typography>
                </Link>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
      </Hidden>
      <Hidden smUp>
        <BottomNavigation
          className={classes.bottomNavigation}
          showLabels={false}
        >
          <BottomNavigationAction
            label="Home"
            href="/"
            icon={<HomeIcon htmlColor={theme.palette.common.white} />}
          />
          <BottomNavigationAction
            label="Create"
            href="/create"
            icon={<AddIcon htmlColor={theme.palette.common.white} />}
          />
          <BottomNavigationAction
            label="Join"
            href="/rooms"
            icon={<SpeakerIcon htmlColor={theme.palette.common.white} />}
          />
        </BottomNavigation>
      </Hidden>
    </>
  );
}

export default React.memo(MobileNavigation);
