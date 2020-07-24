import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, button } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions'

import { default_key_map as key_map } from './key_map/default'
import { addKeyCommand, execKeyCommand } from './index'


class KeySandbox extends React.Component{
  state = {
    undo: 0,
    redo: 0,
  }
  componentDidMount(){
    addKeyCommand("history_undo", () => this.setState({undo: this.state.undo + 1}))
    document.addEventListener("keydown", (e) => {
      execKeyCommand("history_redo", e, () => this.setState({redo: this.state.redo + 1}))
    })
  }

  render(){
    const {
      undo, redo
    } = this.state
    return(
      <div>
        <p>
          undo: {undo}
        </p>
        <p>
          redo: {redo}
        </p>
      </div>
    )
  }
}

storiesOf('pcd_tool/key_control/KeySandbox', module)
  .addDecorator(withKnobs)
  .add('default', () => {
    return(
      <KeySandbox />
    )
  })
