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
  const [value, setValue] = React.useState(30);

  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleInputChange = (event) => {
    setValue(event.target.value === '' ? '' : Number(event.target.value));
  };

  const handleBlur = () => {
    if (value < 0) {
      setValue(0);
    } else if (value > 100) {
      setValue(100);
    }
  };

  const {
    label = "x",
    disabled = false,
  } = props;

  return (
    <div style={{width: "100%", display: "block"}}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Typography style={{width: "64px", display: "block"}} variant="caption">
            {label}
          </Typography>
        </Grid>
        <Grid item xs>
          <Slider
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            disabled={disabled}
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
              step: 10,
              min: 0,
              max: 100,
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
  render() {
    const {
      rotateFront,
      disabled = false,
      moveSelectedCube = () => {},
      bbox_params = {
        x: 0, y: 0, z: 0,
        w: 1, h: 1, d: 1,
        y: 1
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
                <InputSlider
                  label="x"
                  disabled={disabled}
                />
                <InputSlider
                  label="y"
                  disabled={disabled}
                />
                <InputSlider
                  label="z"
                  disabled={disabled}
                />
                <InputSlider
                  label="yaw"
                  disabled={disabled}
                />
              </div>
              <div style={{marginBottom: "32px"}}>
                <Typography component="h4" variant="body1">
                  Size
                </Typography>
                <InputSlider
                  label="depth"
                  disabled={disabled}
                />
                <InputSlider
                  label="width"
                  disabled={disabled}
                />
                <InputSlider
                  label="height"
                  disabled={disabled}
                />
              </div>
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <Grid container>
          <Grid item xs={12}>
            Rotate Front
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => rotateFront(1)}
            >
              <RotateLeft />
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => rotateFront(-1)}
            >
              <RotateRight />
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}
