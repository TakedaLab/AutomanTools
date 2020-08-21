import React from 'react';
import PropTypes from 'prop-types';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {withStyles} from '@material-ui/core/styles';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import {mainStyle} from 'automan/assets/main-style';

class CandidateSelect2D3D extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      available_calibrations: [],
      calibrations: {},
      candidates: [],
      candidates_2d: [],
      candidates_3d: [],
      original: {name: null}
    };
  }

  componentDidMount() {
    const original_id = this.props.original_id;
    this.props.handleSetJobConfig({original_id: this.props.original_id});
    const candidates = this.props.handleGetJobConfig('candidates');
    this.setState({candidates: candidates});
    let urlBase =
      `/projects/${this.props.currentProject.id}/originals/${original_id}`;
    let imgUrl = urlBase + '/candidates/?data_type=IMAGE';
    let pcdUrl = urlBase + '/candidates/?data_type=PCD';
    let calibrationUrl = `/projects/${this.props.currentProject.id}/calibrations/`
    RequestClient.get(
      imgUrl,
      null,
      data => {
        this.setState({candidates_2d: data.records});
      },
      () => {
      }
    );
    RequestClient.get(
      pcdUrl,
      null,
      data => {
        this.setState({candidates_3d: data.records});
      },
      () => {
      }
    );
    RequestClient.get(
      calibrationUrl,
      null,
      data => {
        this.setState({available_calibrations: data.records});
      },
      () => {
      }
    );
  }

  handleChangeCalibration = (e, candidate_id) => {
    let calibrations = this.props.handleGetJobConfig('calibrations');
    // candidates.push(Number(e.target.value));
    if (e.target.value === null) {
      if (calibrations[candidate_id]) {
        delete calibrations[candidate_id]
      }
    } else {
      calibrations[candidate_id] = e.target.value;
    }
    this.setState({calibrations: calibrations});
    this.props.handleSetJobConfig('calibrations', calibrations);
  };
  handleChangeCandidate = e => {
    let candidates = this.props.handleGetJobConfig('candidates');
    if (e.target.checked == true) {
      candidates.push(Number(e.target.value));
    } else {
      candidates = candidates.filter(n => n !== Number(e.target.value));
    }
    this.setState({candidates: candidates});
    this.props.handleSetJobConfig('candidates', candidates);

    let is_2d_selected = this.state.candidates_2d.some(
      x => candidates.includes(x.candidate_id));
    let is_3d_selected = this.state.candidates_3d.some(
      x => candidates.includes(x.candidate_id));
    this.props.handleSelect(is_2d_selected && is_3d_selected);
  };

  render() {
    const {classes} = this.props;
    return (
      <div className={classes.root}>
        <FormControl component="fieldset" className={classes.formControl}>
          <FormLabel component="legend">2D Candidates</FormLabel>
          <FormGroup>
            {this.state.candidates_2d.map((x, index) => {
              return (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      onChange={this.handleChangeCandidate}
                      value={x.candidate_id.toString()}
                      checked={this.state.candidates.includes(x.candidate_id)}
                    />
                  }
                  label={JSON.parse(x.analyzed_info).topic_name}
                />
              );
            })}
          </FormGroup>
        </FormControl>
        <FormControl component="fieldset" className={classes.formControl}>
          <FormLabel component="legend">3D Candidates</FormLabel>
          <FormGroup>
            {this.state.candidates_3d.map((x, index) => {
              return (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      onChange={this.handleChangeCandidate}
                      value={x.candidate_id.toString()}
                      checked={this.state.candidates.includes(x.candidate_id)}
                    />
                  }
                  label={JSON.parse(x.analyzed_info).topic_name}
                />
              );
            })}
          </FormGroup>
        </FormControl>

        <FormLabel component="legend">Calibrations</FormLabel>
        <List>
        {this.state.candidates_2d.map((x, index) => {
          return (
            <ListItem key={index}>
              <ListItemText>{JSON.parse(x.analyzed_info).topic_name}</ListItemText>
              <Select
                labelId="Calibration"
                id="calibration"
                value={this.state.calibrations[x.candidate_id] || ''}
                onChange={(e) => {
                  this.handleChangeCalibration(e, x.candidate_id)
                }}
              >
                <MenuItem key='-1' value={null}> </MenuItem>
                {this.state.available_calibrations.map((item, idx) => {
                  return <MenuItem key={idx} value={item.id}>{item.name}</MenuItem>
                })}
              </Select>
            </ListItem>
          );
        })}
        </List>
      </div>
    );
  }
}

CandidateSelect2D3D.propTypes = {
  classes: PropTypes.object.isRequired
};
const mapStateToProps = state => {
  return {
    currentProject: state.projectReducer.currentProject
  };
};

export default compose(
  withStyles(mainStyle, {name: 'CandidateSelect2D3D'}),
  connect(
    mapStateToProps,
    null
  )
)(CandidateSelect2D3D);
