import React from 'react';
import ReactDOM from 'react-dom';

import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { RotateLeft, RotateRight } from '@material-ui/icons';

import { compose } from 'redux';
import { connect } from 'react-redux';

import BasePCDEditBar from './base_edit_bar'

class PCDEditBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bbox_params: {
        x: 50, y: 50, z: 50,
        width: 50, height: 50, depth: 50,
        yaw: 50
      },
      disabled: false,
    };
  }
  setBboxParams(value){
    this.setState({bbox_params: value})
    setState({disabled: false})
  }
  render() {
    const label = this.props.targetLabel;
    if (label == null) {
      return null;
    }
    const bbox = label.bbox[this.props.candidateId];
    if (bbox == null) {
      return null;
    }
    return (
      <div>
        <Divider />
        <Grid container>
          <Grid item xs={12}>
            Rotate Front
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => bbox.rotateFront(1)}
            >
              <RotateLeft />
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => bbox.rotateFront(-1)}
            >
              <RotateRight />
            </Button>
          </Grid>
        </Grid>
        <BasePCDEditBar
          bbox_params={this.state.bbox_params}
          setBboxParams={this.setBboxParams}
        />
      </div>
    );
  }
}
const mapStateToProps = state => ({
  targetLabel: state.annotation.targetLabel,
});
export default compose(
  connect(
    mapStateToProps,
    null
  )
)(PCDEditBar);

