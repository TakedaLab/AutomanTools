import React from 'react';

import {
  Button,
  Divider,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Input,
  Grid,
  Slider,
  Typography
} from '@material-ui/core';

import { RotateLeft, RotateRight, ExpandMore } from '@material-ui/icons';
import InputSlider from './input_slider'
import InputIncremental from './input_incremental'

export default class BasePCDEditBar extends React.Component {
  setPos = (label, value) => {
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.pos[label] = value
    setBboxParams(box_new)
  }
  setSize = (label, value) => {
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.size[label] = value
    setBboxParams(box_new)
  }
  setYaw= (label, value) => {
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.yaw = value
    setBboxParams(box_new)
  }
  incrementPos = (label, d) => {
    console.log(label, d)
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.pos[label] += d
    setBboxParams(box_new)
  }
  incrementSize = (label, d) => {
    console.log(label, d)
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.size[label] += d
    setBboxParams(box_new)
  }
  incrementYaw= (d) => {
    console.log("yaw", d)
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.yaw += d
    setBboxParams(box_new)
  }

  render() {
    const {
      rotateFront,
      disabled = false,
      moveSelectedCube = () => {},
      box = {
        pos: {
          x: 0, y: 0, z: 0,
        },
        size: {
          x: 0, y: 0, z: 0,
        },
        yaw: 0,
      }
    } = this.props;
    return (
      <div>
        <ExpansionPanel defaultExpanded={true}>
          <ExpansionPanelSummary
            expandIcon={<ExpandMore />}
          >
            <Typography component="h3" variant="body1">
              Bounding Box
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <div style={{width: "100%"}}>
              <div style={{marginBottom: "32px"}}>
                <Typography component="h4" variant="body1">
                  Position
                </Typography>
                {["x", "y", "z"].map((item) => 
                  <InputIncremental
                    label={item}
                    incrementValue={(d) => this.incrementPos(item, d)}
                  />
                )}
              </div>
              <div style={{marginBottom: "32px"}}>
                <Typography component="h4" variant="body1">
                  Size
                </Typography>
                {["x", "y", "z"].map((item) => 
                  <InputIncremental
                    label={item}
                    incrementValue={(d) => this.incrementSize(item, d)}
                  />
                )}
              </div>
              <div style={{marginBottom: "32px"}}>
                <Typography component="h4" variant="body1">
                  Yaw
                </Typography>
                {["yaw"].map((item) => 
                  <InputIncremental
                    label={item}
                    incrementValue={(d) => this.incrementYaw(d)}
                  />
                )}
              </div>
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}
