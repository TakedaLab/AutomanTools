import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, button } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions'

import BasePCDEditBar from './base_edit_bar'

const SamplePCDEditBar = (props) => {
  const [bbox_params, setBboxParams] = React.useState({
    x: 50, y: 50, z: 50,
    width: 50, height: 50, depth: 50,
    yaw: 50
  });
  return(
    <BasePCDEditBar
      disabled={props.disabled}
      rotateFront={action('button-click')}
      bbox_params={bbox_params}
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
