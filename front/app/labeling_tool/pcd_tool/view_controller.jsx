import React from 'react';

import {
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

