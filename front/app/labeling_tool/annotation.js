import RequestClient from 'automan/services/request-client';

export default class Annotation {
  _labels = null;
  _deleted = null;
  _targetLabel = null;
  // DOM
  _bboxTable = null;
  // status
  _loaded = true;
  _nextId = -1;
  _labelTool = null;
  // History
  _frameNumber = null;
  _history = {index: -1, snapshots: []};
  // Copy
  _clipboard = null;

  constructor(labelTool) {
    this._labelTool = labelTool;
  }
  init() {
    return new Promise((resolve, reject) => {
      this._bboxTable = $('#bbox-table');

      resolve();
    });
  }
  isLoaded() {
    return this._loaded;
  }
  load(frameNumber) {
    this._removeAll();
    if (this._frameNumber !== frameNumber) {
      this._history = {index: -1, snapshots: []};
    }
    this._nextId = -1;
    return new Promise((resolve, reject) => {
      this._labels = new Map();
      this._deleted = [];

      RequestClient.get(
        this._labelTool.getURL('frame_labels'),
        null,
        res => {
          res.records.forEach(obj => {
            this.addLabel(obj);
          });
        },
        err => {
          reject(err);
        }
      );

      resolve();
      this._frameNumber = frameNumber;
      this._loaded = true;
    });
  }
  isChanged() {
    if (this._labels == null) {
      return false;
    }
    if (this._deleted.length > 0) {
      return true;
    }
    let changedFlag = false;
    this._labels.forEach(label => {
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
    this._labels.forEach(label => {
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
        this._labelTool.getURL('frame_labels'),
        data,
        () => {
          resolve();
        },
        e => {
          reject('Annotation save error: ' + e);
        }
      );
    });
  }

  addLabel(obj) {
    let klass = this._labelTool.getKlass(obj.name);
    let bboxes = {};
    this._labelTool.getTools().forEach(tool => {
      const id = tool.candidateId;
      if (obj.content[id] != null) {
        bboxes[id] = tool.createBBox(obj.content[id]);
        tool._redrawFlag = true;
      }
    });
    let label = new Label(this, obj.object_id, klass, bboxes);
    return label;
  }

  takeSnapshot(force=false) {
    if (this.isChanged() || force) {
      const labels = [];
      const changedFlags = [];
      this._labels.forEach(label => {
        let obj = label.toObject();
        if (!('object_id' in obj)) {
          obj['object_id'] = label.id;
        }
        labels.push(obj);
        changedFlags.push(label.isChanged);
      });

      if (this._history.index < (this._history.snapshots.length - 1)) {
        this._history.snapshots = this._history.snapshots.slice(0, this._history.index + 1);
      }
      this._history.snapshots.push({'labels': labels, 'changedFlags': changedFlags});
      this._history.index += 1;

      console.log(this._history);
    }

    // assertion
    if (this._history.index !== (this._history.snapshots.length - 1)) {
      console.error('Assertion error (wrong history length)');
      return;
    }

    // limit history
    let limit = 100;
    if (this._history.snapshots.length > limit) {
      this._history.snapshots = this._history.snapshots.slice(
        this._history.snapshots.length - limit, this._history.snapshots.length
      );
      this._history.index = limit - 1;
    }
  }

  restoreFromSnapshot(snapshot) {
    this._removeAll();
    this._loaded = false;
    this._nextId = -1;
    this._labels = new Map();
    this._deleted = [];

    const labels = snapshot.labels;
    const changedFlags = snapshot.changedFlags;
    for (var i=0; i<labels.length; i++) {
      const label = this.addLabel(labels[i]);
      label.isChanged = changedFlags[i];
    }

    this._loaded = true;
  }

  undo() {
    if (this._history.index > 0) {
      let previousIndex = this._history.index - 1;
      let snapshot = this._history.snapshots[previousIndex];
      this.restoreFromSnapshot(snapshot);
      this._history.index = previousIndex;
    }
  }

  redo() {
    if (this._history.index < (this._history.snapshots.length - 1)) {
      let nextIndex = this._history.index + 1;
      let snapshot = this._history.snapshots[nextIndex];
      this.restoreFromSnapshot(snapshot);
      this._history.index = nextIndex;
    }
  }

  clip() {
    let targetLabel = this.getTarget();
    if (targetLabel != null) {
      this._clipboard = targetLabel.toObject();
    }
  }

  paste() {
    if (this._clipboard != null) {
      this._clipboard.object_id = this._nextId--;
      return this.addLabel(this._clipboard);
    }
  }

  getTarget() {
    return this._targetLabel;
  }
  setTarget(tgt) {
    let next = this._getLabel(tgt),
      prev = this._targetLabel;
    if (prev != null && next != null && next.id === prev.id) {
      return prev;
    }
    this._targetLabel = next;
    // table dom events
    this._labelTool.getTools().forEach(tool => {
      tool.updateTarget(prev, next);
    });
    return next;
  }
  create(klass, bbox) {
    if (klass == null) {
      let txt = 'Label create error: Error Class "' + klass + '"';
      this._labelTool.controls.error(txt);
      return null;
    }
    const label = new Label(this, this._nextId--, klass, bbox);
    this.takeSnapshot();
    return label;
  }
  changeKlass(id, klass) {
    let label = this._getLabel(id);
    if (label == null) {
      let txt = 'Label change Class error: Error selector "' + id + '"';
      this._labelTool.controls.error(txt);
      return;
    }
    if (klass == null) {
      let txt = 'Label change Class error: Error Class "' + klass + '"';
      this._labelTool.controls.error(txt);
      return;
    }
    label.klass = klass;
    label.updateKlass();
    this._labelTool.getTools().forEach(tool => {
      tool.updateBBox(label);
    });
  }
  attachBBox(id, candidateId, bbox) {
    let label = this._getLabel(id);
    if (label == null) {
      let txt = 'Label add BBox error: Error selector "' + id + '"';
      this._labelTool.controls.error(txt);
      return;
    }
    if (label.has(candidateId)) {
      let txt = `Label add BBox error: this BBox is already attached in "${id}"`;
      this._labelTool.controls.error(txt);
      return;
    }
    label.bbox[candidateId] = bbox;
    //label.tableItem.addClass('has-image-bbox');
  }
  removeBBox(id, candidateId) {
    let label = this._getLabel(id);
    if (label == null) {
      let txt = 'Label remove BBox error: Error selector "' + id + '"';
      this._labelTool.controls.error(txt);
      return;
    }
    if (label.has(candidateId)) {
      const tool = this._labelTool.getToolFromCandidateId(candidateId);
      tool.disposeBBox(label.bbox[candidateId]);
      label.bbox[candidateId] = null;
      //label.tableItem.addClass('has-image-bbox');
    }
  }
  remove(id) {
    let label = this._getLabel(id);
    if (label == null) {
      let txt = 'Label remove error: Error selector "' + id + '"';
      this._labelTool.controls.error(txt);
      return;
    }
    this._labelTool.getTools().forEach(tool => {
      if (label.bbox[tool.candidateId] != null) {
        tool.disposeBBox(label.bbox[tool.candidateId]);
      }
    });
    const tgt = this._targetLabel;
    if (tgt != null && label.id === tgt.id) {
      this._targetLabel = null;
      this._labelTool.getTools().forEach(tool => {
        tool.updateTarget(tgt, null);
      });
    }
    if (label.id >= 0) {
      this._deleted.push(label.id);
    }
    this._labels.delete(label.id);
    label.dispose();
    this.takeSnapshot(true);
  }

  // private
  _getLabel(label) {
    if (label instanceof Label) {
      return label;
    } else if (typeof label === 'number') {
      return this._labels.get(label) || null;
    }
    return null;
  }
  _removeAll() {
    this._labelTool.selectLabel(null);
    if (this._labels == null) {
      return;
    }
    this._loaded = false;

    this._labels.forEach(label => {
      this._labelTool.getTools().forEach(tool => {
        const id = tool.candidateId;
        if (label.bbox[id] != null) {
          tool.disposeBBox(label.bbox[id]);
        }
      });
      label.dispose();
    });
    this._labels.clear();
    this._labels = null;
    this._targetLabel = null;
  }
}

class Label {
  _annotationTool = null;

  constructor(annotationTool, id, klass, bbox) {
    this._annotationTool = annotationTool;
    this.id = id;
    this.isChanged = this.id < 0;
    this.klass = klass;
    this.minSize = klass.getMinSize();
    this.bbox = {};

    this.tableItem = $('<li class="jpeg-label-sidebar-item">');
    this.tableItem.click(() => {
      this._annotationTool._labelTool.selectLabel(this);
    });
    this.tableItem.css({ background: this.klass.color });
    this.tableItem.append(
      $('<span class="list-image-bbox">').text(this.toIDString())
    );

    this._annotationTool._bboxTable.append(this.tableItem);
    this._annotationTool._labels.set(this.id, this);

    this._annotationTool._labelTool.getTools().forEach(tool => {
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
    const ret = $('<span class="list-image-bbox">').text(name);
    this.tableItem.append(ret);
    return ret;
  }
  dispose() {
    this.tableItem.remove();
  }
  updateKlass() {
    this.isChanged = true;
    this.tableItem.css({ background: this.klass.color });
    this.minSize = this.klass.getMinSize();
    Object.keys(this.bbox).forEach(id => {
      const bbox = this.bbox[id];
      if (bbox == null) {
        return;
      }
      bbox.updateKlass();
    });
  }
  toIDString() {
    if (this.id < 0) {
      return '#___';
    }
    return `#${this.id}`;
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
    this._annotationTool._labelTool.getTools().forEach(tool => {
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
}
