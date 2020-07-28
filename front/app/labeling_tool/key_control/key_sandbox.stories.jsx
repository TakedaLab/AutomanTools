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
    edit_mode: "edit"
  }
  componentDidMount(){
    addKeyCommand("history_undo", () => this.setState({undo: this.state.undo + 1}))
    document.addEventListener("keydown", (e) => {
      execKeyCommand("history_redo", e, () => this.setState({redo: this.state.redo + 1}))
      execKeyCommand("change_edit_mode", e, () => this.setState({edit_mode: "view"}))
    })
    document.addEventListener("keyup", (e) => {
      console.log(e)
      execKeyCommand("change_edit_mode", e, () => {
        this.setState({edit_mode: "edit"})
        })
    })
  }

  render(){
    const {
      undo, redo, edit_mode
    } = this.state
    return(
      <div>
        <table>
          <tr>
            <th>undo</th>
            <td>ctrl+z | command+z</td>
            <td>{undo}</td>
          </tr>
          <tr>
            <th>redo</th>
            <td>shift+ctrl+z | shift+command+z</td>
            <td>{redo}</td>
          </tr>
          <tr>
            <th>eidt_mode</th>
            <td>shift</td>
            <td>{edit_mode}</td>
          </tr>
        </table>
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
