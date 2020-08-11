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
      style={{padding: "3px", minWidth: "16px"}}
      {...otherProps}
    >
      {d < 0 ? d : "+" + d}
    </Button>
  )
}

const InputIncremental = props => {
  const {
    label = "",
    increment_small = 0.05,
    increment_large = 0.5,
    incrementValue,
    ...otherProps
  } = props;

  return (
    <div {...otherProps}>
      <ButtonGroup>
        <IncrementButton
          d={increment_large * -1}
          incrementValue={incrementValue}
        />
        <IncrementButton
          d={increment_small * -1}
          incrementValue={incrementValue}
        />
        <Button disabled size="small">
          {label}
        </Button>
        <IncrementButton
          d={increment_small}
          incrementValue={incrementValue}
        />
        <IncrementButton
          d={increment_large}
          incrementValue={incrementValue}
        />
      </ButtonGroup>
      <div
        style={{margin: "0 16px"}}
      >
      </div>
    </div>
  );
}

export default InputIncremental;
