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
      disabled: false,
      bbox_busy: false,
    };
  }
  bbox_timer = null
  setBboxParams = (box_new) => {
    // const label = this.props.targetLabel;
    // if (label == null) {
    //   return null;
    // }
    // const bbox = label.bbox[this.props.candidateId];
    // if (bbox == null) {
    //   return null;
    // }
    const bbox = this.props.bbox;
    bbox.setBboxParams(box_new)
    bbox.updateSelected(true)
    var changedLabel = bbox.label.createHistory(null)

    this.setState({
      bbox_busy: true,
    }, () => {
      clearTimeout(this.bbox_timer)
      this.bbox_timer = setTimeout(() => {
        changedLabel.addHistory()
      }, 500)
    })

  }
  render() {
    // const label = this.props.targetLabel;
    // if (label == null) {
    //   return null;
    // }
    // const bbox = label.bbox[this.props.candidateId];
    // if (bbox == null) {
    //   return null;
    // }
    // console.log("label", label)
    // console.log("bbox", bbox)
    // console.log("props.bbox", this.props.bbox)
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
  const { targetLabel } = state.annotation
  const { candidateId } = ownProps
  if(targetLabel == null){
    return {
      targetLabel: targetLabel,
      bbox: null,
    }
  }
  const bbox = targetLabel.bbox[candidateId];
  if(bbox == null){
    return {
      targetLabel: targetLabel,
      bbox: null,
    }
  }
  return {
    targetLabel: targetLabel,
    bbox: bbox,
  }
};
export default compose(
  connect(
    mapStateToProps,
    null
  )
)(PCDEditBar);
