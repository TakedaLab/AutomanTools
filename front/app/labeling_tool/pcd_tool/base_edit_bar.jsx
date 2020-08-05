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
  TextField,
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
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.pos[label] += d
    setBboxParams(box_new)
  }
  incrementSize = (label, d) => {
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.size[label] += d
    setBboxParams(box_new)
  }
  incrementYaw = (d) => {
    const { box, setBboxParams } = this.props;
    var box_new = {...box}
    box_new.yaw += d
    setBboxParams(box_new)
  }

  render() {
    const {
      setObjectId,
      objectId
    } = this.props;
    return (
      <div>
        <Typography component="h3" variant="body1">
          Bounding Box
        </Typography>
        <div style={{width: "100%"}}>
          <div style={{marginBottom: "32px"}}>
            <Typography component="h4" variant="body2">
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
            <Typography component="h4" variant="body2">
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
            <Typography component="h4" variant="body2">
              Yaw
            </Typography>
            <InputIncremental
              label={"D"}
              incrementValue={(d) => this.incrementYaw(d)}
            />
          </div>
          <div style={{marginBottom: "32px"}}>
            <Typography component="h4" variant="body2">
              Object ID
            </Typography>
            <TextField
              onChange={(e) => setObjectId(e.target.value)}
              label="Number"
              type="number"
              variant="outlined"
              size="small"
              value={objectId}
            />

          </div>
        </div>
      </div>
    );
  }
}
