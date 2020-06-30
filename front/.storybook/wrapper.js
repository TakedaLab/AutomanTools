import React from 'react';
import { addDecorator } from '@storybook/react';
import { withStyles, MuiThemeProvider } from '@material-ui/core/styles';

import { theme } from 'automan/assets/theme';
import { mainStyle } from 'automan/assets/main-style';

class Wrapper extends React.Component{
  render(){
    return(
      <MuiThemeProvider theme={theme}>
        {this.props.children}
      </MuiThemeProvider>
    )
  }
}

export default withStyles(mainStyle, {name: 'pageRoute'})(Wrapper)
