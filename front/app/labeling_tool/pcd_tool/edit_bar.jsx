import React from 'react';
import ReactDOM from 'react-dom';

import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { RotateLeft, RotateRight } from '@material-ui/icons';

import { compose } from 'redux';
import { connect } from 'react-redux';

import BasePCDEditBar from './base_edit_bar'

import { setAnnotation } from '../actions/tool_action';

class PCDEditBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      disabled: false,
    };
    props.dispatchSetAnnotation(this);
  }
  setBboxParams = (box_new) => {
    console.log("controls", this.props.controls)
    const bbox = this.props.bbox;
    bbox.setBboxParams(box_new)
    bbox.updateSelected(true)
  }
  getTarget() {
    return this.props.targetLabel;
  }
  setTarget(val) {
    this.isTarget = val;
    if (this.labelItem != null) {
      this.labelItem.updateTarget();
    }
    if (this.prevLabel) {
      this.prevLabel.select(val);
    }
  }
  render() {
    console.log("this.props.annotation", this.props.annotation)
    console.log("this.props.labelTool", this.props.labelTool)
    console.log("this.props.controls", this.props.controls)
    const bbox = this.props.bbox;
    if(bbox == null){
      return null
    }
    console.log("bbox", bbox)
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
          box={bbox.box}
          setBboxParams={this.setBboxParams}
        />
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { targetLabel } = state.tool.annotation
  const { candidateId } = ownProps
  if(targetLabel == null){
    return {
      bbox: null,
      labelTool: state.tool.labelTool,
      controls: state.tool.controls,
      annotation: state.tool.annotation,
    }
  }
  const bbox = targetLabel.bbox[candidateId];
  if(bbox == null){
    return {
      bbox: null,
      labelTool: state.tool.labelTool,
      controls: state.tool.controls,
      annotation: state.tool.annotation,
    }
  }
  return {
    bbox: bbox,
    labelTool: state.tool.labelTool,
    controls: state.tool.controls,
    annotation: state.tool.annotation,
  }
};
const mapDispatchToProps = dispatch => ({
  dispatchSetAnnotation: target => dispatch(setAnnotation(target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(PCDEditBar);
