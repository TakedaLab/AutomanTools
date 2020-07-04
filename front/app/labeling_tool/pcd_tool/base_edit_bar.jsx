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


const InputSlider = props => {
  const {
    label,
    value,
    disabled = false,
    setParam
  } = props;

  // const [value, setParam] = React.useState(30);
  const [inputMin, setInputMin] = React.useState(-100);
  const [inputMax, setInputMax] = React.useState(100);

  const handleSliderChange = (event, newValue) => {
    setParam(label, newValue);
  };

  const handleInputChange = (event) => {
    setParam(label, event.target.value === '' ? '' : Number(event.target.value));
    resetRange()
  };

  const handleBlur = () => {
    // if (value < 0) {
    //   setParam(0);
    // } else if (value > 100) {
    //   setParam(100);
    // }
  };

  React.useEffect(() => {
    resetRange()
  }, []);

  const resetRange = () => {
    setInputMin(value - 50)
    setInputMax(value + 50)
  }

  return (
    <div style={{width: "100%", display: "block"}}>
      <Grid container spacing={4} alignItems="center">
        <Grid item>
          <Typography style={{width: "64px", display: "block"}} variant="caption">
            {label}
          </Typography>
        </Grid>
        <Grid item xs
        >
          <Slider
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            onChangeCommitted={resetRange}
            aria-labelledby="input-slider"
            disabled={disabled}
            min={inputMin}
            max={inputMax}
            track={false}
            marks={[
              {value: inputMin, label: inputMin},
              {value: inputMax, label: inputMax},
              {value: value, label: value},
            ]}
          />
        </Grid>
        <Grid item>
          <Input
            disabled={disabled}
            style={{width: "64px"}}
            value={value}
            margin="dense"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: 1,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default class BasePCDEditBar extends React.Component {
  setParam = (label, value) => {
    const { bbox_params, setBboxParams } = this.props;
    var bbox_params_new = {...bbox_params}
    bbox_params_new[label] = value
    setBboxParams(bbox_params_new)
  }
  render() {
    const {
      rotateFront,
      disabled = false,
      moveSelectedCube = () => {},
      bbox_params = {
        x: 1, y: 0, z: 0,
        w: 1, h: 1, d: 1,
        yaw: 1
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
                {["x", "y", "z", "yaw"].map((item) => 
                  <InputSlider
                    label={item}
                    disabled={disabled}
                    value={bbox_params[item]}
                    setParam={this.setParam}
                  />
                )}
              </div>
              <div style={{marginBottom: "32px"}}>
                <Typography component="h4" variant="body1">
                  Size
                </Typography>
                {["depth", "width", "height"].map((item) => 
                  <InputSlider
                    label={item}
                    disabled={disabled}
                    value={bbox_params[item]}
                    setParam={this.setParam}
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
