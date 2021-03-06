import React from 'react';
import ReactDOM from 'react-dom';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
  IconButton
} from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';

import { compose } from 'redux';
import { connect } from 'react-redux';

import classNames from 'classnames';

import RequestClient from 'automan/services/request-client';
import { setTargetLabel } from './actions/annotation_action';
import { setAnnotation } from './actions/tool_action';


class Annotation extends React.Component {
  // data
  _deleted = null;
  // status
  _loaded = true;
  _nextId = -1;

  constructor(props) {
    super(props);
    this.state = {
      prevInstanceIds: null,
      instanceIds: null,
      labels: null,
      anchorEl: null,
      menuIndex: 'Bounding Box'
    };
    props.dispatchSetAnnotation(this);
  }
  init() {
    return Promise.resolve();
  }
  getTools() {
    return this.props.controls.getTools();
  }
  isLoaded() {
    return this._loaded;
  }
  loadPrevFrame(frameNumber) {
    if (frameNumber == 0) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      RequestClient.get(
        this.props.labelTool.getURL('frame_labels', frameNumber - this.props.controls.getFixedSkipFrameCount()),
        {try_lock: false},
        res => {
          const instanceIds = new Map();
          res.records.forEach(obj => {
            if (obj.instance_id == null) {
              return;
            }
            let klass = this.props.klassSet.getByName(obj.name);
            let bboxes = {};
            this.getTools().forEach(tool => {
              const id = tool.candidateId;
              if (obj.content[id] != null && tool.createWipeBBox) {
                bboxes[id] = tool.createWipeBBox(obj.content[id], klass);
              }
            });
            // TODO: add class
            let label = {
              //obj.object_id,
              instanceId: obj.instance_id,
              klass: klass,
              bbox: bboxes,
              select(flag) {
                for(let id in this.bbox) {
                  this.bbox[id].select(flag);
                }
              }
            };
            instanceIds.set(label.instanceId, label);
          });
          this.setState({ prevInstanceIds: instanceIds }, () => {
            resolve();
          });
        },
        err => {
          reject(err);
        }
      );
    });
  }
  load(frameNumber) {
    if (!this._loaded) {
      return Promise.reject();
    }
    this._removeAll();
    this._nextId = -1;
    this.props.history.resetHistory();
    return this.loadPrevFrame(frameNumber)
      .then(() => new Promise((resolve, reject) => {
        this._deleted = [];

        RequestClient.get(
          this.props.labelTool.getURL('frame_labels', frameNumber),
          {try_lock: true},
          res => {
            const labels = new Map(), instanceIds = new Map();
            const isLocked = res.is_locked,
                  expiresAt = res.expires_at;
            res.records.forEach(obj => {
              let klass = this.props.klassSet.getByName(obj.name);
              let bboxes = {};
              this.getTools().forEach(tool => {
                const id = tool.candidateId;
                if (obj.content[id] != null) {
                  bboxes[id] = tool.createBBox(obj.content[id]);
                }
              });
              let label = new Label(this, obj.object_id, obj.instance_id, klass, bboxes);
              labels.set(label.id, label);
              if (label.instanceId != null) {
                instanceIds.set(label.instanceId, label);
              }
            });
            this.setState({ labels, instanceIds }, () => {
              this._loaded = true;
              resolve();
            });

            if (!isLocked) {
              window.alert('This frame is locked.');
            }
          },
          err => {
            reject(err);
          }
        );

      }));
  }
  isChanged() {
    if (this.state.labels == null) {
      return false;
    }
    if (this._deleted.length > 0) {
      return true;
    }
    if (!this.props.history.hasUndo()) {
      // check by history
      return false;
    }
    let changedFlag = false;
    this.state.labels.forEach(label => {
      changedFlag = changedFlag || label.isChanged;
    });
    return changedFlag;
  }
  save() {
    if (!this.isChanged()) {
      return Promise.resolve();
    }
    const created = [];
    const edited = [];
    const deleted = this._deleted;
    this._deleted = [];
    this.state.labels.forEach(label => {
      if (label.id < 0) {
        created.push(label.toObject());
      } else if (label.isChanged) {
        edited.push(label.toObject());
      }
    });
    return new Promise((resolve, reject) => {
      const data = {
        created: created,
        edited: edited,
        deleted: deleted
      };
      RequestClient.post(
        this.props.labelTool.getURL('frame_labels', this.props.controls.getFrameNumber()),
        data,
        () => {
          resolve();
        },
        e => {
          console.error('Annotation save error: ', e);
          reject('Annotation save error: ' + e);
        }
      );
    });
  }
  getTarget() {
    return this.props.targetLabel;
  }
  getNthTarget(n){
    const labels = new Map(this.state.labels)
    const targetLabel = this.props.targetLabel
    const idList = Array.from(labels.keys())
    if(idList.length < 1){
      return(null)
    }
    if(n > 0){
      var nextLabelIndex = (idList.length + n - 1) % idList.length
    }else{
      var nextLabelIndex = (idList.length + n) % idList.length
    }
    if(targetLabel){
      const curLabelIndex = idList.findIndex(x => x === targetLabel.id)
      nextLabelIndex = (idList.length + curLabelIndex + n) % (idList.length)
    }
    return labels.get(idList[nextLabelIndex])
  }
  getPrevTarget() {
    const prevTarget = this.getNthTarget(-1)
    this.setTarget(prevTarget)
  }
  getNextTarget() {
    const nextTarget = this.getNthTarget(1)
    this.setTarget(nextTarget)
  }
  setTarget(tgt) { /** Label */
    let next = this.getLabel(tgt),
      prev = this.props.targetLabel;
    if (prev != null && next != null && next.id === prev.id) {
      return prev;
    }
    if (prev != null) {
      prev.setTarget(false);
    }
    if (next != null) {
      next.setTarget(true);
    }
    this.props.dispatchSetTargetLabel(next);
    // table dom events
    this.getTools().forEach(tool => {
      tool.updateTarget(prev, next);
    });
    return next;
  }
  create(klass, bbox) {
    if (klass == null) {
      let txt = 'Label create error: Error Class "' + klass + '"';
      this.props.controls.error(txt);
      return null;
    }
    const label = new Label(this, this._nextId--, null, klass, bbox);
    this.props.history.addHistory([label], 'create');
    this.setState(state => {
      const labels = new Map(state.labels);
      labels.set(label.id, label);
      return { labels };
    });
    return label;
  }
  changeKlass(id, klass) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label change Class error: Error selector "' + id + '"';
      this.props.controls.error(txt);
      return;
    }
    if (klass == null) {
      let txt = 'Label change Class error: Error Class "' + klass + '"';
      this.props.controls.error(txt);
      return;
    }
    this.props.history.addHistory([label], 'change');
    label.setKlass(klass);
  }
  attachBBox(id, candidateId, bbox) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label add BBox error: Error selector "' + id + '"';
      this.props.controls.error(txt);
      return;
    }
    if (label.has(candidateId)) {
      let txt = `Label add BBox error: this BBox is already attached in "${id}"`;
      this.props.controls.error(txt);
      return;
    }
    label.bbox[candidateId] = bbox;
    //label.tableItem.addClass('has-image-bbox');
  }
  removeBBox(id, candidateId) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label remove BBox error: Error selector "' + id + '"';
      this.props.controls.error(txt);
      return;
    }
    if (label.has(candidateId)) {
      const tool = this.props.controls.getToolFromCandidateId(candidateId);
      tool.disposeBBox(label.bbox[candidateId]);
      label.bbox[candidateId] = null;
      //label.tableItem.addClass('has-image-bbox');
    }
  }
  remove(id) {
    let label = this.getLabel(id);
    if (label == null) {
      let txt = 'Label remove error: Error selector "' + id + '"';
      this.props.controls.error(txt);
      return;
    }

    this.props.history.addHistory([label], 'delete');

    this.getTools().forEach(tool => {
      if (label.bbox[tool.candidateId] != null) {
        tool.disposeBBox(label.bbox[tool.candidateId]);
      }
    });
    const tgt = this.props.targetLabel;
    if (tgt != null && label.id === tgt.id) {
      this.props.dispatchSetTargetLabel(null);
      tgt.setTarget(false);
      this.getTools().forEach(tool => {
        tool.updateTarget(tgt, null);
      });
    }
    if (label.id >= 0) {
      this._deleted.push(label.id);
    }

    const labelId = label.id;
    const instanceId = label.instanceId;
    this.setState(state => {
      const labels = new Map(state.labels);
      const instanceIds = new Map(state.instanceIds);
      labels.delete(labelId);
      if (instanceId != null) {
        instanceIds.delete(instanceId);
      }
      return { labels, instanceIds };
    });
    label.dispose();
  }
  getLabel(label) {
    if (label instanceof Label) {
      return label;
    } else if (typeof label === 'number') {
      return this.state.labels.get(label) || null;
    }
    return null;
  }
  // methods to history
  createHistory(label, hist = null) {
    return this.props.history.createHistory([label], 'change', hist);
  }
  addHistory() {
    this.props.history.addHistory(null);
  }
  createFromHistory(objects) {
    let labelList = [];
    for (let obj of  objects) {
      if (obj.instanceId !== null && this.state.instanceIds.has(obj.instanceId)) {
        console.error('create error');
        continue;
      }
      let bboxes = {};
      this.getTools().forEach(tool => {
        const id = tool.candidateId;
        if (obj.content[id] != null) {
          bboxes[id] = tool.createBBox(obj.content[id]);
        }
      });
      let label = new Label(this, obj.id, obj.instanceId, obj.klass, bboxes);
      if (label.id >= 0) {
        this._deleted = this._deleted.filter(id => id != label.id);
      }
      labelList.push(label);
    }
    this.setState(state => {
      const labels = new Map(state.labels);
      const instanceIds = new Map(state.instanceIds);
      for (let label of labelList) {
        labels.set(label.id, label);
        if (label.instanceId != null) {
          instanceIds.set(label.instanceId, label);
        }
      }
      return { labels, instanceIds };
    });
    return labelList.slice();
  }
  removeFromHistory(objects) {
    const tools = this.getTools();
    const tgt = this.props.targetLabel;
    const removeIds = [], removeInstanceIds = [];
    for (let obj of objects) {
      let label = this.getLabel(obj.id);

      tools.forEach(tool => {
        if (label.bbox[tool.candidateId] != null) {
          tool.disposeBBox(label.bbox[tool.candidateId]);
        }
      });
      if (tgt != null && label.id === tgt.id) {
        this.props.dispatchSetTargetLabel(null);
        tgt.setTarget(false);
        this.getTools().forEach(tool => {
          tool.updateTarget(tgt, null);
        });
      }
      if (label.id >= 0) {
        this._deleted.push(label.id);
      }

      removeIds.push(label.id);
      if (label.instanceId !== null) {
        removeInstanceIds.push(label.instanceId);
      }
      label.dispose();
    }
    this.setState(state => {
      const labels = new Map(state.labels);
      const instanceIds = new Map(state.instanceIds);
      for (let id of removeIds) {
        labels.delete(id);
      }
      for (let id of removeInstanceIds) {
        instanceIds.delete(id);
      }
      return { labels, instanceIds };
    });
  }
  // methods to clipboard
  copyLabels(isAll) {
    let target = [];
    if (isAll) {
      target = Array.from(this.state.labels.values());
    } else if (this.props.targetLabel != null) {
      target = [this.props.targetLabel];
    }
    return target.map(label => label.toObject());
  }
  pasteLabels(data, inPlace = false) {
    const pastePosition = inPlace
      ? { x: 0, y: 0, z: 0 }
      : { x: -1, y: -1, z: 0 };

    const labels = new Map(this.state.labels);
    let pastedLabels = [];

    data.forEach(obj => {
      let instanceId = obj.instanceId;
      if (instanceId !== null && this.state.instanceIds.has(instanceId)) {
        instanceId = null;
      }
      let klass = this.props.klassSet.getByName(obj.name);
      let bboxes = {};
      this.getTools().forEach(tool => {
        const id = tool.candidateId;
        if (obj.content[id] != null) {
          var objCandidateContent = obj.content[id];

          // Check the existence of boxes with the same content in the frame
          let existingContents = [];
          for (var key of labels.keys()) {
            var label = labels.get(key).toObject();
            if (Object.keys(label.content)[0] === String(id)) {
              existingContents.push(Object.values(label.content)[0]);
            }
          }
          let isContentExists = existingContents.some((candidateContent) => {
            return JSON.stringify(candidateContent) === JSON.stringify(objCandidateContent)
          });

          // Add offsets if the box is overlapped
          if (isContentExists) {
            objCandidateContent.x_3d += pastePosition.x;
            objCandidateContent.y_3d += pastePosition.y;
            objCandidateContent.z_3d += pastePosition.z;
          }

          // Register the box
          bboxes[id] = tool.createBBox(objCandidateContent);
        }
      });
      let label = new Label(this, this._nextId--, instanceId, klass, bboxes);
      labels.set(label.id, label);
      pastedLabels.push(label);
    });

    // Select the label
    if (pastedLabels.length > 0) {
      this.props.controls.selectLabel(pastedLabels.slice(-1)[0]);
    }

    this.props.history.addHistory(pastedLabels, 'create');
    this.setState(state => {
      const labels = new Map(state.labels);
      const instanceIds = new Map(state.instanceIds);
      for (let label of pastedLabels) {
        labels.set(label.id, label);
        if (label.instanceId != null) {
          instanceIds.set(label.instanceId);
        }
      }
      return { labels, instanceIds };
    });
  }

  // private
  _removeAll() {
    this.props.controls.selectLabel(null);
    if (this.state.labels == null) {
      return;
    }
    this._loaded = false;

    this.state.labels.forEach(label => {
      this.getTools().forEach(tool => {
        const id = tool.candidateId;
        if (label.bbox[id] != null) {
          tool.disposeBBox(label.bbox[id]);
        }
      });
      label.dispose();
    });
    if (this.state.prevInstanceIds != null) {
      this.state.prevInstanceIds.forEach(label => {
        this.getTools().forEach(tool => {
          const id = tool.candidateId;
          if (label.bbox[id] != null) {
            tool.disposeWipeBBox(label.bbox[id]);
          }
        });
      });
    }
    this.props.dispatchSetTargetLabel(null);
    this.setState({
      labels: null,
      instanceIds: null,
      prevInstanceIds: null
    });
  }
  renderList(classes) {
    if (this.state.labels === null) {
      return [];
    }
    let list = [];
    for (let [_, label] of this.state.labels) {
      list.push(
        <LabelItem
          key={label.id}
          classes={classes}
          controls={this.props.controls}
          label={label}
        />
      );
    }
    if (list.length > 0) {
      return list;
    } else {
      return <ListItem>No bounding boxes in this frame</ListItem>;
    }
  }
  renderLabelCount(classes) {
    if (this.state.labels === null) {
      return [];
    }
    let klassCount = {};
    for (let [_, label] of this.state.labels) {
      let labelKlass = label.klass.name;
      // console.log(labelKlass, Object.keys(klassCount))
      if (klassCount.hasOwnProperty(labelKlass)) {
        klassCount[labelKlass] = klassCount[labelKlass] + 1;
      } else {
        klassCount[labelKlass] = 1;
      }
    }
    if (Object.keys(klassCount).length > 0) {
      return (
        <React.Fragment>
          {Object.keys(klassCount).map((v, k) => (
            <ListItem key={k} className={classes.listItem}>
              <ListItemText>
                {v}: {klassCount[v]}
              </ListItemText>
            </ListItem>
          ))}
        </React.Fragment>
      );
    } else {
      return <ListItem>No bounding boxes in this frame</ListItem>;
    }
  }

  handleClickListHeader = e => {
    this.setState({ anchorEl: e.currentTarget });
  };

  handleMenuItemClick = (e, index) => {
    this.setState({
      anchorEl: null,
      menuIndex: index
    });
  };

  render() {
    const classes = this.props.classes;
    return (
      <React.Fragment>
        <List
          className={classes.list}
          subheader={
            <ListSubheader className={classes.listHead}>
              {this.state.menuIndex}
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={this.handleClickListHeader}
                >
                  <MoreVertIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListSubheader>
          }
        >
          {this.state.menuIndex === 'Bounding Box' && this.renderList(classes)}
          {this.state.menuIndex === 'Label Count' &&
            this.renderLabelCount(classes)}
        </List>
        <Menu
          anchorEl={this.state.anchorEl}
          open={Boolean(this.state.anchorEl)}
        >
          <MenuItem onClick={e => this.handleMenuItemClick(e, 'Bounding Box')}>
            Bounding Box
          </MenuItem>
          <MenuItem onClick={e => this.handleMenuItemClick(e, 'Label Count')}>
            Label Count
          </MenuItem>
        </Menu>
      </React.Fragment>
    );
  }
}
const mapStateToProps = state => ({
  targetLabel: state.annotation.targetLabel,
  labelTool: state.tool.labelTool,
  controls: state.tool.controls,
  klassSet: state.tool.klassSet,
  history: state.tool.history
});
const mapDispatchToProps = dispatch => ({
  dispatchSetTargetLabel: target => dispatch(setTargetLabel(target)),
  dispatchSetAnnotation: target => dispatch(setAnnotation(target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Annotation);

class LabelItem extends React.Component {
  constructor(props) {
    super(props);
    this.classes = props.classes;
    this.controls = props.controls;
    const label = props.label;
    label.setLabelItem(this);
    this.state = {
      color: label.getColor(),
      isTarget: label.isTarget
    };
    this.label = label;
  }
  updateKlass() {
    this.setState({ color: this.label.getColor() });
  }
  updateTarget() {
    this.setState({ isTarget: this.label.isTarget });
  }
  render() {
    const classes = this.props.classes;
    const label = this.label;
    return (
      <ListItem
        key={label.id}
        className={classNames(classes.listItem, this.state.isTarget && classes.selectedListItem)}
        onClick={() => this.controls.selectLabel(label)}
        button
      >
        <div
          className={classes.colorPane}
          style={{ backgroundColor: this.state.color }}
        />
        <ListItemText primary={label.toString()} className={classes.listItemText} />
      </ListItem>
    );
  }
}
class Label {
  _annotationTool = null;
  _listItem = null;
  id = 0;
  isChanged = false;
  isTarget = false;
  klass = null;
  minSize = null;
  bbox = null;

  constructor(annotationTool, id, instanceId, klass, bbox) {
    this._annotationTool = annotationTool;
    this.id = id;
    this.instanceId = instanceId;
    if (this.instanceId && annotationTool.state.prevInstanceIds) {
      this.prevLabel =
        annotationTool.state.prevInstanceIds.get(this.instanceId)
    }
    this.isChanged = this.id < 0;
    this.isTarget = false;
    this.klass = klass;
    this.minSize = klass.getMinSize();
    this.bbox = {};

    this._annotationTool.getTools().forEach(tool => {
      const id = tool.candidateId;
      if (bbox[id] == null) {
        this.bbox[id] = null;
      } else {
        this.bbox[id] = bbox[id];
        this.bbox[id].setLabel(this);
      }
    });
  }
  addBBox(name) {
    // how to change state?
  }
  dispose() {
  }
  setLabelItem(labelItem) {
    this.labelItem = labelItem;
  }
  createHistory(hist) {
    return this._annotationTool.createHistory(this, hist);
  }
  addHistory() {
    this._annotationTool.addHistory();
  }

  setKlass(klass) {
    this.klass = klass;
    this.isChanged = true;
    this.minSize = this.klass.getMinSize();
    Object.keys(this.bbox).forEach(id => {
      const bbox = this.bbox[id];
      if (bbox == null) {
        return;
      }
      bbox.updateKlass();
    });
    if (this.labelItem != null) {
      this.labelItem.updateKlass();
    }
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
  toIDString() {
    return `#${this.id < 0 ? '___' : this.id}`;
  }
  toString() {
    return this.toIDString() + ` ${this.getKlassName()}`;
  }
  has(candidateId) {
    return this.bbox[candidateId] != null;
  }
  getColor() {
    return this.klass.getColor();
  }
  getKlassName() {
    return this.klass.getName();
  }
  getMinSize() {
    return this.minSize;
  }
  toObject() {
    const ret = {
      name: this.klass.getName(),
      content: {}
    };
    if (this.id >= 0) {
      ret.object_id = this.id;
    }
    ret.use_instance = true;
    if (this.instanceId != null) {
      ret.instanceId = this.instanceId;
    }
    this._annotationTool.getTools().forEach(tool => {
      const id = tool.candidateId;
      if (!this.has(id)) {
        return;
      }
      const content = {};
      this.bbox[id].toContent(content);
      ret.content[id] = content;
    });
    return ret;
  }
  toHistory() {
    const ret = {
      id: this.id,
      instanceId: this.instanceId,
      klass: this.klass,
      content: {}
    };
    this._annotationTool.getTools().forEach(tool => {
      const id = tool.candidateId;
      if (!this.has(id)) {
        return;
      }
      const content = {};
      this.bbox[id].toContent(content);
      ret.content[id] = content;
    });
    return ret;
  }
  fromHistory(obj) {
    if (this.id !== obj.id) {
      throw new Error('history id error');
    }
    if (this.klass !== obj.klass) {
      this.setKlass(obj.klass);
    }
    this.instanceId = obj.instanceId;
    this._annotationTool.getTools().forEach(tool => {
      const id = tool.candidateId;
      const content = obj.content[id];
      if (content == null) {
        return;
      }
      this.bbox[id].fromContent(content);
      this.bbox[id].updateParam();
    });
  }
}
