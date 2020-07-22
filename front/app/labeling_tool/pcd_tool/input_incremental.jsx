import React from 'react';

import {
  Button,
  ButtonGroup,
  Grid,
  Typography
} from '@material-ui/core';

import { Add } from '@material-ui/icons';

const IncrementButton = props => {
  const {
    d,
    incrementValue,
    size,
    color,
    ...otherProps
  } = props;
  return(
    <Button
      size="small"
      color="primary"
      onClick={() => incrementValue(d)}
      {...otherProps}
    >
      {d < 0 ? d : "+" + d}
    </Button>
  )
}

const InputIncremental = props => {
  const {
    label = "",
    increment_small = 0.1,
    increment_large = 1,
    incrementValue,
    ...otherProps
  } = props;

  return (
    <div {...otherProps}>
      <Grid container spacing={0} alignItems="center">
        <Grid item>
          <ButtonGroup>
            <IncrementButton
              d={increment_large * -1}
              incrementValue={incrementValue}
            />
            <IncrementButton
              d={increment_small * -1}
              incrementValue={incrementValue}
            />
            />
          </ButtonGroup>
        </Grid>
        <Grid item>
          <Button disabled size="small">
            {label}
          </Button>
        </Grid>
        <Grid item>
          <ButtonGroup>
            <IncrementButton
              d={increment_small}
              incrementValue={incrementValue}
            />
            />
            <IncrementButton
              d={increment_large}
              incrementValue={incrementValue}
            />
            />
          </ButtonGroup>
        </Grid>
      </Grid>
      <div
        style={{margin: "0 16px"}}
      >
      </div>
    </div>
  );
}

export default InputIncremental;
