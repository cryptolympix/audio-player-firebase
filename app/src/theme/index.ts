import { createMuiTheme } from '@material-ui/core/styles';
import palette from './palette';
import typography from './typography';

// Default light theme
let theme = createMuiTheme({
  palette: {
    ...palette,
  },
  typography: {
    ...typography,
  },
  spacing: 5,
});

export default theme;
