import React from 'react';

import {
  Checkbox,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Typography
} from '@material-ui/core';

import { compose } from 'redux';
import { connect } from 'react-redux';

class ViewController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pointColoringRange: [
        this.props.tool.state.pointColoringSettings.minValue,
        this.props.tool.state.pointColoringSettings.maxValue
      ]
    };
  }

  updateMeshMaterialSettings = (settings) => {
    this.props.tool.updateMeshMaterialSettings(settings, ()=>{
      this.forceUpdate();
    });
  }

  updatePointColoringSettings = (settings) => {
    this.props.tool.updatePointColoringSettings(settings, ()=>{
      this.forceUpdate();
    });
  }

  updateCameraHelperSettings = (settings, initCameraHelper=false) => {
    this.props.tool.updateCameraHelperSettings(settings, initCameraHelper, ()=>{
      this.forceUpdate();
    });
  }

  pointColoringControllerMinMax = (axis) => {
    switch (axis) {
      case "x":
        return {
          controllerMinValue: -100,
          controllerMaxValue: 100,
        }
      case "y":
        return {
          controllerMinValue: -10,
          controllerMaxValue: 10,
        }
      case "z":
        return {
          controllerMinValue: -5,
          controllerMaxValue: 10,
        }
      case "distance":
        return {
          controllerMinValue: -100,
          controllerMaxValue: 100,
        }
      default:
        return {
          controllerMinValue: -10,
          controllerMaxValue: 10,
        }
    }
  }

  render() {
    return (
     <div style={{width: "100%", display: "block"}}>
      <div style={{margin: "0 16px"}}>
        <FormControlLabel
          control={
            <Checkbox
              checked={this.props.tool.state.cameraHelperSettings.visible}
              onChange={(event) => {
                this.updateCameraHelperSettings({
                  visible: event.target.checked
                }, true)
              }}
              name="show-camera-helper"
              color="primary"
            />
          }
          label="Show Camera Helper"
        />
        <Typography id="view-controller-camera-helper-distance" gutterBottom>
          Camera Helper - Distance
        </Typography>
        <Slider
          defaultValue={10}
          getAriaValueText={(value) => {return `${value}m`}}
          aria-labelledby="view-controller-camera-helper-distance"
          min={1}
          max={50}
          valueLabelDisplay="auto"
          value={this.props.tool.state.cameraHelperSettings.distance}
          onChange={(event, value) => {
            this.updateCameraHelperSettings({
              distance: value
            }, false)
          }}
          onChangeCommitted={(event, value) => {
            this.updateCameraHelperSettings({
              distance: value
            }, true)
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={this.props.tool.state.visualizeObjectIds}
              onChange={(event) => {
                this.props.tool.setState({
                  visualizeObjectIds: event.target.checked
                }, () => {
                  this.props.tool.pcdBBoxes.forEach((item)=>{item.updateText()});
                  this.props.tool.redrawRequest();
                  this.forceUpdate();
                })
              }}
              name="show-object-ids"
              color="primary"
            />
          }
          label="Show Object-ids"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={this.props.tool.state.visualizeBoxInfo}
              onChange={(event) => {
                this.props.tool.setState({
                  visualizeBoxInfo: event.target.checked
                }, () => {
                  this.props.tool.pcdBBoxes.forEach((item)=>{item.updateBoxInfoTextMesh()});
                  this.props.tool.redrawRequest();
                  this.forceUpdate();
                })
              }}
              name="show-box-info"
              color="primary"
            />
          }
          label="Show Box Info"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={this.props.tool.state.visualizeProjectedRects}
              onChange={(event) => {
                this.props.tool.setState({
                  visualizeProjectedRects: event.target.checked
                }, () => {
                  this.props.tool.pcdBBoxes.forEach((item)=>{item.update2DBox()});
                  this.props.tool.redrawRequest();
                  this.forceUpdate();
                })
              }}
              name="show-projected-rects"
              color="primary"
            />
          }
          label="Show Projected Rects"
        />
        <Typography id="view-controller-point-size" gutterBottom>
          Point-size:
        </Typography>
        <Slider
          defaultValue={0.05}
          getAriaValueText={(value) => {return `${value}`}}
          aria-labelledby="view-controller-point-size"
          step={0.01}
          marks
          min={0.01}
          max={0.5}
          valueLabelDisplay="auto"
          value={this.props.tool.state.meshMaterialSettings.size}
          onChange={(event, value) => {
            this.updateMeshMaterialSettings({
              size: value
            })
          }}
        />
        <InputLabel id="point-coloring-axis-label">Coloring axis:</InputLabel>
        <Select
          labelId="point-coloring-axis-label"
          id="point-coloring-axis"
          value={this.props.tool.state.pointColoringSettings.axis}
          onChange={(event, value) => {
            const axis = event.target.value;
            this.updatePointColoringSettings({
              axis: axis,
              ...this.pointColoringControllerMinMax(axis)
            })
          }}
        >
          <MenuItem value={'none'}>none</MenuItem>
          <MenuItem value={'x'}>x</MenuItem>
          <MenuItem value={'y'}>y</MenuItem>
          <MenuItem value={'z'}>z</MenuItem>
          <MenuItem value={'distance'}>distance</MenuItem>
        </Select>
        {this.props.tool.state.pointColoringSettings.axis !== "none" &&
        <div>
        <Typography id="point-coloring-min-max" gutterBottom>
          Range:
        </Typography>
        <Slider
          getAriaValueText={(value) => {return `${value}m`}}
          aria-labelledby="point-coloring-min-max"
          min={this.props.tool.state.pointColoringSettings.controllerMinValue}
          max={this.props.tool.state.pointColoringSettings.controllerMaxValue}
          valueLabelDisplay="auto"
          value={this.state.pointColoringRange}
          onChange={(event, value) => {
            this.setState({
              pointColoringRange: value
            })
          }}
          onChangeCommitted={() => {
            this.updatePointColoringSettings({
              minValue: this.state.pointColoringRange[0],
              maxValue: this.state.pointColoringRange[1],
            })
          }}
        />
        </div>
        }
      </div>
    </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { candidateId } = ownProps
  const correspondingTools = state.tool.tools.filter((item) => {
    return item.candidateId === candidateId
  });
  if (correspondingTools.length !== 1) {
    throw 'No corresponding tool found';
  }
  return {
    tool: correspondingTools[0],
  }
};
export default compose(
  connect(
    mapStateToProps,
    null
  )
)(ViewController)

