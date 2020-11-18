import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import Container from '@material-ui/core/Container';

const Home = React.lazy(() => import('../pages/Home'));
const Create = React.lazy(() => import('../pages/Create'));
const Join = React.lazy(() => import('../pages/Join'));
const Room = React.lazy(() => import('../pages/Room'));
const About = React.lazy(() => import('../pages/About'));

function Content() {
  return (
    <Container
      style={{ padding: '5vh 5vw', marginBottom: '-60px' }}
      maxWidth={'lg'}
      disableGutters
    >
      <Router>
        <Switch>
          <Route path="/" exact>
            <Home />
          </Route>
          <Route path="/create" exact>
            <Create />
          </Route>
          <Route path="/rooms" exact>
            <Join />
          </Route>
          <Route path="/rooms/:roomId" exact>
            <Room />
          </Route>
          <Route path="/about" exact>
            <About />
          </Route>
          <Route path="/">
            <Redirect to="/" />
          </Route>
        </Switch>
      </Router>
    </Container>
  );
}

export default Content;
