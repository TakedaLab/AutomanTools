import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, button } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions'

import InputSlider from './input_slider'
import InputIncremental from './input_incremental'

const SampleInputIncremental = (props) => {
  const [value, setValue] = React.useState(0);
  const incrementValue = (d) => {
    setValue(value + d)
  }
  return(
    <div>
      <InputIncremental
        label={text("x", "x")}
        incrementValue={incrementValue}
      />
      value: {value}
    </div>
  )
}

storiesOf('pcd_tool/InputIncremental', module)
  .addDecorator(withKnobs)
  .add('default', () => {
    return(
      <SampleInputIncremental />
    )
  })
