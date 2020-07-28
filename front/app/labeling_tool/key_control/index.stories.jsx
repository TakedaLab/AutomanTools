import React, { useEffect, useState } from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, button } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions'

import { keymap_default } from './key_map/default'
import { keymap_vimlike } from './key_map/vimlike'
import { addKeyCommand, execKeyCommand } from './index'

import {
  Button,
  ButtonGroup,
  Chip,
  Grid,
  Table,
  TableRow,
  TableCell,
  Typography,
  SnackbarContent,
} from '@material-ui/core';


class Example extends React.Component{
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
            <th>edit_mode</th>
            <td>shift</td>
            <td>{edit_mode}</td>
          </tr>
        </table>
      </div>
    )
  }
}

const Sandbox = (props) => {
  const [commandHistory, setCommandHistory] = useState([])
  const {
    keymap = []
  } = props
  useEffect(() => {
    keymap.map(item => {
      ["keydown", "keyup"].map(event => {
        document.addEventListener(event, (e) => {
          execKeyCommand(item.command, e, () => {
            setCommandHistory(old => [{"event": event, "command": item.command}, ...old.slice(0, 8)])
          })
        })
      })
    })
  }, [])
  return(
    <div>
      <Grid container spacing={4}>
        <Grid item xs={4}>
          {commandHistory.map((item, key) => 
            <SnackbarContent
              key={key}
              message={item.command}
              action={item.event}
              style={{marginBottom: "8px"}}
            />
          )}
        </Grid>
        <Grid item xs={8}>
          <Table size="small">
          {keymap.map((item, ikey) => 
            <TableRow key={ikey}>
              <TableCell>
                {item.keys.map((bind, bkey) => 
                <Chip
                  size="small"
                  label={bind}
                />
                )}
              </TableCell>
              <TableCell>
                {item.command}
              </TableCell>
            </TableRow>
          )}
          </Table>
        </Grid>
      </Grid>
    </div>
  )
}

storiesOf('pcd_tool/key_control', module)
  .addDecorator(withKnobs)
  .add('example', () => {
    return(
      <Example />
    )
  })
  .add('default bind', () => {
    return(
      <Sandbox keymap={keymap_default} />
    )
  })
  .add('vim-like bind', () => {
    return(
      <Sandbox keymap={keymap_vimlike} />
    )
  })
