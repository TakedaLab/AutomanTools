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
    setInputMin(orgRound(value - 50, 0.1))
    setInputMax(orgRound(value + 50, 0.1))
  }

  const orgRound = (value, base) => {
    return Math.round(value * base) / base;
  }

  return (
    <div style={{width: "100%", display: "block"}}>
      <Grid container spacing={4} alignItems="center">
        <Grid item>
          <Typography style={{marginRight: "16px"}} variant="caption">
            {label}
          </Typography>
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
      <div
        style={{margin: "0 16px"}}
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
            {value: value, label: orgRound(value, 10)},
          ]}
        />
      </div>
    </div>
  );
}

export default InputSlider;
