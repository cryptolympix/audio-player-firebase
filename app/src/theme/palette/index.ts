import * as colors from '@material-ui/core/colors';

const palette: any = {
  type: 'light',
  primary: {
    light: '#576ab3',
    main: '#576ab3',
    dark: '#576ab3',
    contrastText: '#000',
  },
  secondary: {
    light: '#ed553b',
    main: '#ed553b',
    dark: '#ed553b',
    contrastText: '#000',
  },
  info: {
    light: colors.blue[50],
    main: colors.blue[500],
    dark: colors.blue[700],
    contrastText: '#fff',
  },
  warning: {
    light: colors.orange[300],
    main: colors.orange[500],
    dark: colors.orange[700],
    contrastText: '#fff',
  },
  error: {
    light: colors.red[300],
    main: colors.red[500],
    dark: colors.red[700],
    contrastText: '#fff',
  },
  success: {
    light: colors.green[300],
    main: colors.green[500],
    dark: colors.green[700],
    contrastText: '#fff',
  },
  background: {
    default: '#fff',
    paper: 'rgb(250,250,250)',
  },
  text: {
    primary: colors.common.black,
    secondary: colors.common.black,
    disabled: colors.grey[600],
  },
  common: {
    black: colors.common.black,
    white: colors.common.white,
  },
  divider: colors.common.black,
};

export default palette;
