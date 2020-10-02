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
    };
  }
  setBboxParams = (box_new) => {
    const bbox = this.props.bbox;
    bbox.setBboxParams(box_new)
    bbox.updateSelected(true)
    var changedLabel = bbox.label.createHistory(null)
    changedLabel.addHistory()
  }
  setObjectId = (id) => {
    const bbox = this.props.bbox;
    bbox.setObjectId(id)
    bbox.updateSelected(true)
    var changedLabel = bbox.label.createHistory(null)
    changedLabel.addHistory()
    this.forceUpdate() // necessary to update input value
  }
  rotateFront = (direction) => {  // Rotate left if direction = 1, or right if direction = -1
    const bbox = this.props.bbox;
    bbox.rotateFront(direction)
    bbox.updateSelected(true)
    var changedLabel = bbox.label.createHistory(null)
    changedLabel.addHistory()
  }
  render() {
    const bbox = this.props.bbox;
    if(bbox == null){
      return null
    }
    return (
      <div>
        <Divider />
        <BasePCDEditBar
          box={bbox.box}
          setBboxParams={this.setBboxParams}
          setObjectId={this.setObjectId}
          rotateFront={this.rotateFront}
          objectId={bbox.box.objectId}
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
      bbox: null,
    }
  }
  const bbox = targetLabel.bbox[candidateId];
  if(bbox == null){
    return {
      bbox: null,
    }
  }
  return {
    bbox: bbox,
  }
};
export default compose(
  connect(
    mapStateToProps,
    null
  )
)(PCDEditBar);
