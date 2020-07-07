import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, button } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions'

import BasePCDEditBar from './base_edit_bar'

const SamplePCDEditBar = (props) => {
  const [bbox_params, setBboxParams] = React.useState({
        pos: {
          x: 111.111111, y: 111.111111, z: 111.11111,
        },
        size: {
          x: 111.111, y: 111.111, z: 111.111111,
        },
        yaw: 111.1111111,
  });
  return(
    <BasePCDEditBar
      disabled={props.disabled}
      rotateFront={action('button-click')}
      box={bbox_params}
      setBboxParams={setBboxParams}
    />
  )
}

storiesOf('pcd_tool/base_edit_bar', module)
  .addDecorator(withKnobs)
  .add('default', () => {
    return(
      <SamplePCDEditBar disabled={boolean("Disabled", false)} />
    )
  })
