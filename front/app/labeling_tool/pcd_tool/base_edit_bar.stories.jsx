import React from 'react';
import { storiesOf } from '@storybook/react';

import BasePCDEditBar from './base_edit_bar'

storiesOf('pcd_tool/base_edit_bar', module)
  .add('default', () =>
    <div>
      <BasePCDEditBar />
    </div>
  )
