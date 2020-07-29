import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, button } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions'

import InputSlider from './input_slider'

const SampleInputSlider = (props) => {
  const [value, setValue] = React.useState(0);
  const setParam = (label, value) => {
    setValue(value)
  }
  return(
      <InputSlider
        key={text("x", "x")}
        label={text("x", "x")}
        disabled={boolean()}
        value={value}
        setParam={setParam}
      />
  )
}

storiesOf('pcd_tool/input_slider', module)
  .addDecorator(withKnobs)
  .add('default', () => {
    return(
      <SampleInputSlider />
    )
  })
