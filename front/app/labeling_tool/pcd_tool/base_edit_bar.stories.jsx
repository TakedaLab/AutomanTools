import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, number } from "@storybook/addon-knobs";
import { action } from '@storybook/addon-actions'

import BasePCDEditBar from './base_edit_bar'

storiesOf('pcd_tool/base_edit_bar', module)
  .addDecorator(withKnobs)
  .add('default', () =>
    <div>
      <BasePCDEditBar
        disabled={boolean("Disabled", false)}
        rotateFront={action('button-click')}
      />
    </div>
  )
