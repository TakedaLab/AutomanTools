import React from 'react';
import { addDecorator } from '@storybook/react';
import { withStyles, MuiThemeProvider } from '@material-ui/core/styles';

import { theme } from 'automan/assets/theme';
import { mainStyle } from 'automan/assets/main-style';

import Wrapper from './wrapper'

addDecorator(storyFn =>
  <Wrapper>
    {storyFn()}
  </Wrapper>
);
