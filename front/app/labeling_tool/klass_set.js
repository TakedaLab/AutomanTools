import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';

import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import classNames from 'classnames';

import { setKlassSet } from './actions/tool_action';

class KlassSet extends React.Component {
  // data
  _klasses = new Map();
  _klassList = [];
  // DOM
  _nextId = 0;

  constructor(props) {
    super(props);
    this.state = {
      targetKlass: null,
      targetIndex: '',
    };
    props.dispatchSetKlassSet(this);
  }
  init() {
    return new Promise((resolve, reject) => {
      let klassset = this.props.labelTool.getProjectInfo().klassset;

      klassset.records.forEach((klass) => {
        let config = JSON.parse(klass.config);
        let klassObj = new Klass(
          this,
          this._nextId++,
          klass.name,
          config.color,
          new THREE.Vector2(config.minSize.x, config.minSize.y)
        );
        this._klasses.set(klass.name, klassObj);
        this._klassList[klassObj.id] = klassObj;
      });
      // select default target class

      this.setState({
        /*
        targetKlass: this._klasses.get(
          klassset.records[0].name
        )
        */
        targetIndex: 0
      });
      resolve();
    });
  }
  getByName(name) {
    if (typeof name != 'string') {
      Controls.error(
        'KlassSet get by name error: name is not string "' + name + '"'
      );
      return;
    }
    return this._klasses.get(name);
  }
  getTarget() {
    //return this.state.targetKlass;
    return this._klassList[this.state.targetIndex];
  }
  setTarget(tgt) {
    let next = this._getKlass(tgt),
        prev = this.getTarget();
    if (next.id === prev.id) {
      return prev;
    }
    //this.setState({targetKlass: next});
    this.setState({targetIndex: next.id});
    // DOM change
    return next;
  }
  _getKlass(kls) {
    if (kls instanceof Klass) {
      return kls;
    } else if (typeof(kls) === 'string') {
      return this._klasses.get(kls) || null;
    }
    return null;
  }
  renderItems(classes) {
    let list = [];
    for (let klass of this._klassList) {
      list.push(
        <MenuItem key={klass.id} value={klass.id}>
          <div
            className={classes.colorIcon}
            style={{ backgroundColor: klass.color }}
          />
          {klass.name}
        </MenuItem>
      );
    }
    return list;
  }
  handleSelectChange = e => {
    const newVal = e.target.value;
    this.props.controls.selectKlass(this._klassList[newVal]);
    this.setState({ targetIndex: newVal });
  };
  render() {
    const classes = this.props.classes;
    return (
      <FormControl>
        <Select
          className={classes.ClassSelect}
          value={this.state.targetIndex}
          onChange={this.handleSelectChange}
          onClose={
            () => setTimeout(() => { document.activeElement.blur() }, 0)
          }
        >
          {this.renderItems(classes)}
        </Select>
      </FormControl>
    );
  }
};
const mapStateToProps = state => ({
  labelTool: state.tool.labelTool,
  controls: state.tool.controls,
});
const mapDispatchToProps = dispatch => ({
  dispatchSetKlassSet: target => dispatch(setKlassSet(target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(KlassSet);

class Klass {
  constructor(klassSet, id, name, color, size) {
    this.klassSet = klassSet;
    this.id = id;
    this.name = name;
    this.color = color;
    this.minSize = size;
  }
  getName() {
    return this.name;
  }
  getColor() {
    return this.color;
  }
  getMinSize() {
    return this.minSize;
  }
}
