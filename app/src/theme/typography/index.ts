import { fontFamily, fontWeights } from './default';
import palette from '../palette';

const typography: any = {
  fontFamily,
  h1: {
    fontSize: 36,
    fontWeight: fontWeights.fontWeightBold,
    color: palette.text.primary,
  },
  h2: {
    fontSize: 30,
    fontWeight: fontWeights.fontWeightBold,
    color: palette.text.primary,
  },
  h3: {
    fontSize: 26,
    fontWeight: fontWeights.fontWeightBold,
    color: palette.text.primary,
  },
  h4: {
    fontSize: 22,
    fontWeight: fontWeights.fontWeightMedium,
    color: palette.text.primary,
  },
  h5: {
    fontSize: 20,
    fontWeight: fontWeights.fontWeightMedium,
    color: palette.text.primary,
  },
  h6: {
    fontSize: 18,
    fontWeight: fontWeights.fontWeightMedium,
    color: palette.text.primary,
  },
  subtitle1: {
    fontSize: 16,
    lineHeight: 'normal',
    fontWeight: fontWeights.fontWeightRegular,
    color: palette.text.primary,
  },
  subtitle2: {
    fontSize: 15,
    lineHeight: 'normal',
    fontWeight: fontWeights.fontWeightRegular,
    color: palette.text.primary,
  },
  body1: {
    fontSize: 15,
    lineHeight: 'normal',
    fontWeight: fontWeights.fontWeightRegular,
    color: palette.text.primary,
  },
  body2: {
    fontSize: 13,
    lineHeight: 'normal',
    fontWeight: fontWeights.fontWeightRegular,
    color: palette.text.primary,
  },
  button: {
    fontSize: 18,
    lineHeight: 'normal',
    fontWeight: fontWeights.fontWeightMedium,
    textTransform: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    color: palette.common.white,
  },
  caption: {
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: fontWeights.fontWeightRegular,
    color: palette.text.primary,
  },
  overline: {
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: fontWeights.fontWeightRegular,
    textTransform: 'none',
    textDecoration: 'none',
    color: palette.text.primary,
  },
};

export default typography;
