import LabelTool from './base_label_tool';

Set.prototype.difference = function(setB) {
  if (setB === null) {
    return this;
  }

  let difference = new Set(this);
  for (let elem of setB) {
    difference.delete(elem);
  }
  return difference;
};

const toolStatus = {};

// 3d eidt arrow
const arrowColors = [0xff0000, 0x00ff00, 0x0000ff],
  hoverColors = [0xffaaaa, 0xaaffaa, 0xaaaaff],
  AXES = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1)
  ];

export default class PCDLabelTool {
  // private
  _labelTool = null;
  _wrapper = null;
  _loaded = true;
  _scene = null;
  _renderer = null;
  _camera = null;
  _camera_scale = 50;
  _controls = null;
  //cameraExMat = new THREE.Matrix4();
  // PCD objects
  _pcdLoader = null;
  _pointMeshes = [];
  // to mouse position
  _groundPlane = null;
  // control mode
  _modeMethods = createModeMethods(this);
  _modeStatus = {
    mode: 'move',
    busy: false,
    nextMode: null,
    previousMode: 'move'
  };
  _globalKeyMethods = createGlobalKeyMethods(this);
  _redrawFlag = true;
  _isBirdView = true;
  // to mode 'move'
  _editArrowGroup = null;
  _editArrows = null;
  // to mode 'resize'
  _editFacePlane = null;
  // to mode 'create'
  _creatingBBox = {
    startPos: null,
    endPos: null,
    box: null
  };
  _updatingBBoxes = [];
  _hoveringBBox = null;
  _keymap_arr = [];
  _boxTemplates = [];
  _font = null;

  // public
  name = 'PCD';
  dataType = 'PCD';
  candidateId = -1;
  pcdBBoxes = new Set();

  isLoaded() {
    return this._loaded;
  }
  isTargetCandidate(id) {
    return this.candidateId == id;
  }
  constructor(labelTool) {
    this._labelTool = labelTool;
  }
  init() {
    if (!Detector.webgl) {
      Detector.addGetWebGLMessage();
      throw 'WebGL error'; // TODO: be Error()
      return;
    }
    this._initThree();
    this._initCamera();
    this._initDom();
    this._initEvent();
    this._initArrow();
    this._initFacePlane();
    this._initKeyMap();
    this._initBoxTemplates();
    this._initFont();

    this._animate();
  }
  load() {
    this._loaded = false;
    const frame = this._labelTool.getFrameNumber();
    const url = this._labelTool.getURL('frame_blob', this.candidateId);
    this._pointMeshes.forEach(mesh => {
      mesh.visible = false;
    });
    // use preloaded pcd mesh
    if (this._pointMeshes[frame] != null) {
      this._pointMeshes[frame].visible = true;
      this._redrawFlag = true;
      this._loaded = true;
      return Promise.resolve();
    }
    // load new pcd file
    return new Promise((resolve, reject) => {
      this._pcdLoader.load(
        url,
        mesh => {
          this._pointMeshes[frame] = mesh;
          this._scene.add(mesh);
          this._redrawFlag = true;
          this._loaded = true;
          resolve();
        },
        () => {
          // in progress
        },
        e => {
          // error
          this._loaded = true;
          reject(e);
        }
      );
    });
  }
  handles = {
    resize: () => {
      /*
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
      */
      const width = window.innerWidth;
      const height = window.innerHeight;

      // fix camera aspect
      if (this._camera.inPerspectiveMode) {
        this._camera.aspect = width / height;
      } else {
        this._camera.left = -width / this._camera_scale;
        this._camera.right = width / this._camera_scale;
        this._camera.top = height / this._camera_scale;
        this._camera.bottom = -height / this._camera_scale;
      }
      this._camera.updateProjectionMatrix();

      // re-set render size
      this._renderer.setPixelRatio(window.devicePixelRatio);
      this._renderer.setSize(width, height);

      this._redrawFlag = true;
    },
    keydown: e => {
      this.handleMappedKey(e, 'keydown');
    },
    keyup: e => {
      this.handleMappedKey(e, 'keyup');
    }
  };
  setActive(isActive) {
    if (isActive) {
      this._wrapper.show();
    } else {
      this._wrapper.hide();
    }
  }
  createBBox(content) {
    return new PCDBBox(this, content);
  }
  disposeBBox(bbox) {
    bbox.remove();
  }
  updateBBox(label) {}
  updateTarget(prev, next) {
    const id = this.candidateId;

    // reset arrow
    this.setArrow(null);

    [...prev.difference(next)]
      .filter(obj => {
        return obj.bbox[id] !== null;
      })
      .forEach(obj => {
        obj.bbox[id].deselect();
      });
    if (next !== null) {
      [...next]
        .filter(label => {
          return label.bbox[id] !== null;
        })
        .forEach(obj => {
          obj.bbox[id].select();
        });

      this.setArrow(
        [...next]
          .filter(label => {
            return label.bbox[id] !== null;
          })
          .map(label => {
            return label.bbox[id];
          })
      );
    }
    this.redrawRequest();
    // TODO: set arrow
  }
  // to controls
  redrawRequest() {
    this._redrawFlag = true;
  }
  getMode() {
    return this._modeStatus.mode;
  }
  changeMode() {
    let idx = modeNames.indexOf(this._modeStatus.mode);
    if (idx < 0) {
      return;
    }
    idx = (idx + 1) % modeNames.length;
    this.modeChangeRequest(modeNames[idx]);
    return modeNames[idx];
  }
  _initThree() {
    const scene = new THREE.Scene();
    /*
    const axisHelper = new THREE.AxisHelper(0.1);
    axisHelper.position.set(0, 0, 0);
    scene.add(axisHelper);
    */

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer = renderer;
    this._scene = scene;

    const pcdLoader = new THREE.PCDLoader();
    this._pcdLoader = pcdLoader;
  }
  _initCamera() {
    // TODO: read YAML and set camera?
    let camera;
    if (this._isBirdView) {
      camera = new THREE.OrthographicCamera(
        -window.innerWidth / this._camera_scale,
        window.innerWidth / this._camera_scale,
        window.innerHeight / this._camera_scale,
        -window.innerHeight / this._camera_scale,
        10,
        2000
      );
      camera.position.set(0, 0, 450);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    } else {
      camera = new THREE.PerspectiveCamera(
        90,
        window.innerWidth / window.innerHeight,
        0.01,
        10000
      );
      camera.position.set(0, 0, 0.5);
    }
    camera.up.set(0, 0, 1);
    this._scene.add(camera);

    const controls = new THREE.OrbitControls(camera, this._renderer.domElement);
    // controls.mouseButtons = {
    //   ORBIT: THREE.MOUSE.RIGHT,
    //   ZOOM: THREE.MOUSE.MIDDLE,
    //   PAN: THREE.MOUSE.LEFT,
    // };
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 0.2;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableDamping = false;
    controls.dampingFactor = 0.3;
    controls.minDistance = 0.3;
    controls.maxDistance = 0.3 * 100;
    controls.noKey = true;
    controls.enabled = false;
    controls.target.set(1, 0, 0);
    controls.update();

    this._camera = camera;
    this._controls = controls;
  }
  _initDom() {
    const wrapper = $('#canvas3d'); // change dom id
    wrapper.append(this._renderer.domElement);
    this._wrapper = wrapper;
    wrapper.hide();
  }
  _initEvent() {
    const modeStatus = this._modeStatus;
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: false,
      transparent: true,
      opacity: 0.0
    });
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.position.x = 0;
    groundPlane.position.y = 0;
    groundPlane.position.z = -1;
    this._groundPlane = groundPlane;

    // mouse events
    this._wrapper
      .contextmenu(e => {
        e.preventDefault();
      })
      .mousedown(e => {
        if (e.button !== 0) {
          return;
        } // not left click
        this.getModeMethod().mouseDown(e);
      })
      .mouseup(e => {
        if (e.button !== 0) {
          return;
        } // not left click
        if (!modeStatus.busy) {
          return;
        }
        this.getModeMethod().mouseUp(e);
        modeStatus.busy = false;
        if (modeStatus.nextMode != null) {
          setTimeout(() => {
            this.modeChange(modeStatus.nextMode);
            modeStatus.nextMode = null;
          }, 0);
        }
      })
      .mousemove(e => {
        this.getModeMethod().mouseMove(e);
      });

    this.getModeMethod().changeTo();
  }
  _initFacePlane() {
    // face edit plane
    const facePlaneGeo = new THREE.PlaneGeometry(1, 1);
    const facePlaneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const facePlane = new THREE.Mesh(facePlaneGeo, facePlaneMat);
    facePlane.rotation.order = 'ZXY';
    facePlane.visible = false;
    this._editFacePlane = facePlane;
    this._scene.add(facePlane);
  }
  _initArrow() {
    const size = 3,
      head = size / 2,
      headWidth = head / 2;
    this._editArrows = [
      new THREE.ArrowHelper(
        AXES[0],
        new THREE.Vector3(0, 0, 0),
        size,
        arrowColors[0],
        head,
        headWidth
      ),
      new THREE.ArrowHelper(
        AXES[1],
        new THREE.Vector3(0, 0, 0),
        size,
        arrowColors[1],
        head,
        headWidth
      ),
      new THREE.ArrowHelper(
        AXES[2],
        new THREE.Vector3(0, 0, 0),
        size,
        arrowColors[2],
        head,
        headWidth
      )
    ];
    const group = new THREE.Group();
    this._editArrows.forEach(arrow => {
      group.add(arrow);
    });
    group.visible = false;
    this._editArrowGroup = group;
    this._scene.add(group);
  }
  _initKeyMap() {
    let promises = [];
    promises.push(
      new Promise((resolve, reject) => {
        $.getJSON('/static/js/labeling_tool/keymap.json', function(data) {
          resolve(data);
        });
      }).then(data => {
        this._keymap_arr = data;
      })
    );
    return promises;
  }
  _initBoxTemplates() {
    let promises = [];
    promises.push(
      new Promise((resolve, reject) => {
        $.getJSON('/static/js/labeling_tool/pcd_box_templates.json', function(data) {
          resolve(data);
        });
      }).then(data => {
        this._boxTemplates = data;
      })
    );
    return promises;
  }
  _initFont() {
    let promises = [];
    promises.push(
      new Promise((resolve, reject) => {
        $.getJSON('/static/fonts/helvetiker_regular.typeface.json', function(
          data
        ) {
          resolve(data);
        });
      }).then(data => {
        let font_loader = new THREE.FontLoader();
        this._font = font_loader.parse(data);
      })
    );
    return promises;
  }
  _animate() {
    const id = window.requestAnimationFrame(() => {
      this._animate();
    });
    this.getModeMethod().animate();

    if (this._redrawFlag) {
      try {
        this._renderer.render(this._scene, this._camera);
      } catch (e) {
        console.error(e);
        window.cancelAnimationFrame(id);
        return;
      }
      this._redrawFlag = false;
    }
  }
  setArrow(bbox) {
    if (bbox == null) {
      this._editArrowGroup.visible = false;
    } else {
      let pos = new THREE.Vector3();
      if (Array.isArray(bbox)) {
        bbox.forEach(box => {
          pos.add(box.box.pos);
        });
        pos.divideScalar(bbox.length);
      } else {
        pos = bbox.box.pos;
      }
      this._editArrowGroup.visible = true;
      this._editArrowGroup.position.set(pos.x, pos.y, pos.z);
    }
  }

  // mode methods
  getModeMethod() {
    return this._modeMethods[this._modeStatus.mode];
  }
  modeChangeRequest(nextMode) {
    if (this._modeStatus.busy) {
      this._modeStatus.nextMode = nextMode;
    } else {
      this.modeChange(nextMode);
    }
  }
  modeChange(nextMode) {
    const mode = this._modeStatus.mode;
    if (mode === nextMode) {
      return;
    }
    const nextMethod = this._modeMethods[nextMode];
    if (nextMethod == null) {
      // TODO: show internal error
      throw 'Mode error';
    }
    if (!['command', 'create'].includes(this._modeStatus.mode)) {
      this._modeStatus.previousMode = this._modeStatus.mode;
    }
    this._modeMethods[mode].changeFrom();
    nextMethod.changeTo();
    this._modeStatus.mode = nextMode;
    // TODO: maybe change
    //Controls.GUI.update();
    this._labelTool.controls.update();
  }

  // 3d geo methods
  getMousePos(e) {
    const offset = this._wrapper.offset();
    const size = this._renderer.getSize();
    return new THREE.Vector2(
      ((e.clientX - offset.left) / size.width) * 2 - 1,
      (-(e.clientY - offset.top) / size.height) * 2 + 1
    );
  }
  getRay(e) {
    const pos = this.getMousePos(e);
    const camera = this._camera;
    let ray;
    if (this._isBirdView) {
      ray = new THREE.Raycaster();
      ray.setFromCamera(pos, camera);
    } else {
      const vec = new THREE.Vector3(pos.x, pos.y, 1);
      vec.unproject(camera);
      ray = new THREE.Raycaster(
        camera.position,
        vec.sub(camera.position).normalize()
      );
    }
    return ray;
  }
  getIntersectPos(e) {
    const ray = this.getRay(e);
    const intersectPos = ray.intersectObject(this._groundPlane);
    if (intersectPos.length > 0) {
      return intersectPos[0].point;
    }
    return null;
  }

  creatingBoxUpdate() {
    const data = this._creatingBBox;
    const sp = data.startPos,
      ep = data.endPos;
    const cx = (sp.x + ep.x) / 2,
      cy = (sp.y + ep.y) / 2,
      w = sp.x - ep.x,
      h = sp.y - ep.y;
    const phi = this._camera.rotation.z + Math.PI / 2.0,
      rx = Math.cos(phi),
      ry = Math.sin(phi);
    data.box.position.set(cx, cy, -0.5);
    data.box.rotation.z = phi;
    data.box.scale.set(
      Math.abs(w * rx + h * ry),
      Math.abs(w * ry - h * rx),
      1.0
    );
    data.box.object_id = 0;
  }

  handleMappedKey(e, type) {
    //----------------------------------------------------------------------------
    // Keyboard Shortcuts
    //----------------------------------------------------------------------------
    this._keymap_arr
      .filter(function(keymap_val) {
        return e.key === keymap_val.key;
      })
      .forEach(function(keymap_val) {
        e.preventDefault();
        if (keymap_val['mode']) {
          // Execute mode specific key method
          if (keymap_val['mode'] === this._modeStatus.mode) {
            if (
              keymap_val.command in this.getModeMethod() &&
              type in this.getModeMethod()[keymap_val.command]
            ) {
              this.getModeMethod()[keymap_val.command][type](keymap_val.args);
            }
          }
        } else {
          // Execute global key method
          if (
            keymap_val.command in this._globalKeyMethods &&
            type in this._globalKeyMethods[keymap_val.command]
          ) {
            this._globalKeyMethods[keymap_val.command][type](keymap_val.args);
          }
        }
      }, this);
  }
}

const BBoxParams = {
  geometry: new THREE.CubeGeometry(1.0, 1.0, 1.0),
  material: new THREE.MeshBasicMaterial({
    color: 0x008866,
    wireframe: true
  }),
  selectingMaterial: new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  }),
  hoverMaterial: new THREE.MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true
  })
};
class PCDBBox {
  constructor(pcdTool, content, addToTool = true) {
    this.pcdTool = pcdTool;
    this.label = null;
    this.selected = false;
    this.box = {
      pos: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(0, 0, 0),
      yaw: 0,
      object_id: 0
    };
    if (content != null) {
      // init parameters
      this.box.pos.x = +content['x_3d'];
      this.box.pos.y = +content['y_3d'];
      this.box.pos.z = +content['z_3d'];
      this.box.size.x = +content['width_3d'];
      this.box.size.y = +content['height_3d'];
      this.box.size.z = +content['length_3d'];
      this.box.yaw = +content['rotation_y'];
      this.box.object_id = +content['object_id'];
    }
    if (addToTool) {
      this.initCube();
      this.pcdTool.pcdBBoxes.add(this);
      this.initText();
      this._redrawFlag = true;
    }
  }
  setLabel(label) {
    if (this.label != null) {
      // TODO: control error
      throw 'Label already set';
    }
    this.label = label;
    this.labelItem = label.addBBox('PCD');

    // update text
    this.updateText();
  }
  updateKlass() {}
  remove() {
    // TODO: remove meshes
    this.labelItem.remove();
    const mesh = this.cube.mesh;
    this.pcdTool._scene.remove(mesh);
    this.pcdTool._redrawFlag = true;
    this.pcdTool.pcdBBoxes.delete(this);
  }
  toContent(obj) {
    // make object values by parameters
    obj['x_3d'] = this.box.pos.x;
    obj['y_3d'] = this.box.pos.y;
    obj['z_3d'] = this.box.pos.z;
    obj['width_3d'] = this.box.size.x;
    obj['height_3d'] = this.box.size.y;
    obj['length_3d'] = this.box.size.z;
    obj['rotation_y'] = this.box.yaw;
    obj['object_id'] = this.box.object_id;
  }
  initCube() {
    const mesh = new THREE.Mesh(BBoxParams.geometry, BBoxParams.material);
    const box = this.box;
    mesh.position.set(box.pos.x, box.pos.y, box.pos.z);
    mesh.scale.set(box.size.x, box.size.y, box.size.z);
    mesh.rotation.z = box.yaw;
    this.pcdTool._scene.add(mesh);
    this.cube = {
      mesh: mesh
    };
  }
  initText() {
    if ('mesh' in this.cube === false) {
      return;
    }

    // object id label
    let color = "#FF3366";
    if (this.label != null) {
      color = this.label.klass.color;
    }
    let matDark = new THREE.LineBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    let matDarkBackSide = new THREE.LineBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    matDarkBackSide.color.offsetHSL(0, 0, 0.4);
    let message = this.box.object_id;
    let shapes = this.pcdTool._font.generateShapes(message, 1.5);
    let geometry = new THREE.ShapeBufferGeometry(shapes);
    geometry.computeBoundingBox();
    let xMid = -0.6 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    let yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
    geometry.translate(xMid, yMid, 1.0);
    let text = new THREE.Mesh(geometry, matDark);
    text.visible = true;
    let text_backside = new THREE.Mesh(geometry, matDarkBackSide);
    text_backside.translateX(0.1);
    text_backside.translateY(-0.12);
    text_backside.translateZ(-0.01);
    text.add(text_backside);
    text.rotation.z = -1.57;
    this.cube.mesh.add(text);
    text.scale.set(
      1.0 / text.parent.scale.y,
      1.0 / text.parent.scale.x,
      1.0 / text.parent.scale.z
    );
  }
  updateCube(changed) {
    const mesh = this.cube.mesh;
    const box = this.box;
    // TODO: check change flag
    // TODO: clamp() all
    mesh.position.set(box.pos.x, box.pos.y, box.pos.z);
    mesh.scale.set(box.size.x, box.size.y, box.size.z);
    mesh.rotation.z = box.yaw;
    if (changed) {
      this.label.isChanged = true;
    }
    // if (this.selected) {
    //   this.pcdTool.setArrow(this);
    // }
    this.updateText();
  }
  updateText() {
    if ('mesh' in this.cube && this.cube.mesh.children.length > 0) {
      this.cube.mesh.children.pop();
      this.initText();
    }
  }
  clone(addToTool = false) {
    const content = {};
    this.toContent(content);
    return new PCDBBox(this.pcdTool, content, addToTool);
  }
  isEqualTo(pcdBBox) {
    if (pcdBBox === null) {
      return false;
    }

    let pos_bool = this.box.pos.distanceTo(pcdBBox.box.pos) === 0;
    let size_bool = this.box.size.distanceTo(pcdBBox.box.size) === 0;
    let yaw_bool = this.box.yaw === pcdBBox.box.yaw;
    let id_bool = this.box.object_id === pcdBBox.box.object_id;

    return pos_bool && size_bool && yaw_bool && id_bool;
  }
  select() {
    this.selected = true;
    this.cube.mesh.material = BBoxParams.selectingMaterial;
  }
  deselect() {
    this.selected = false;
    this.cube.mesh.material = BBoxParams.material;
  }
}

const modeNames = ['command', 'create', 'view', 'move', 'resize', 'rotate'];
// TODO: move select methods to one place
function createModeMethods(pcdTool) {
  const getUpdatingBBoxes = function() {
    return pcdTool._updatingBBoxes;
  };

  const setUpdatingBBoxes = function(e) {
    pcdTool._labelTool
      .getTargetLabels()
      .map(label => {
        return label.bbox[pcdTool.candidateId];
      })
      .forEach(pcdBox => {
        const updatingBBox = {
          mouse: pcdTool.getMousePos(e),
          startPos: pcdTool.getIntersectPos(e),
          endPos: null,
          pcdBox: pcdBox,
          originalPCDBox: pcdBox.clone(false)
        };
        pcdTool._updatingBBoxes.push(updatingBBox);
      });
  };

  const resetUpdatingBBoxes = function() {
    pcdTool._updatingBBoxes = [];
  };

  const storeUpdateHistory = function() {
    // take a shapshot if the box is updated
    let updatingBBoxes = getUpdatingBBoxes();
    if (updatingBBoxes.length === 0) {
      return;
    }

    let storeFlag = updatingBBoxes
      .map(bbox => {
        return !bbox.pcdBox.isEqualTo(bbox.originalPCDBox);
      })
      .some(flag => {
        return flag;
      });
    if (storeFlag) {
      pcdTool._labelTool.takeSnapshot();
    }
  };

  const transformSelectedBBoxes = function({
    dpx = 0,
    dpy = 0,
    dpz = 0,
    dsx = 0,
    dsy = 0,
    dsz = 0,
    drx = 0,
    dry = 0,
    drz = 0
  } = {}) {
    pcdTool._labelTool
      .getTargetLabels()
      .filter(label => {
        return label.bbox[pcdTool.candidateId] != null;
      })
      .forEach(label => {
        transformBBox({
          bbox: label.bbox[pcdTool.candidateId],
          dpx: dpx,
          dpy: dpy,
          dpz: dpz,
          dsx: dsx,
          dsy: dsy,
          dsz: dsz,
          drx: drx,
          dry: dry,
          drz: drz
        });
      });
  };

  const transformBBox = function({
    bbox = null,
    dpx = 0,
    dpy = 0,
    dpz = 0,
    dsx = 0,
    dsy = 0,
    dsz = 0,
    drx = 0,
    dry = 0,
    drz = 0
  } = {}) {
    if (bbox == null) {
      return;
    }
    const move = new THREE.Vector3(dpx, dpy, dpz);
    const resize = new THREE.Vector3(dsx, dsy, dsz);
    const rotate = drz;
    bbox.box.pos.add(move);
    bbox.box.size.add(resize);
    bbox.box.yaw += rotate;
    bbox.updateCube(true);
    pcdTool._redrawFlag = true;
  };

  const resizeBBox = function({ bbox = null, length = 0, width = 0, height = 0 } = {}) {
    if (bbox == null) {
      return;
    }
    bbox.box.size = new THREE.Vector3(length, width, height);
    bbox.updateCube(true);
    pcdTool._redrawFlag = true;
  };

  const handleMouseMoveForBboxInResizeMode = function(e, bbox) {
    const normal = this.selectFace.normal.clone();
    if (normal.z === 1 || normal.z === -1) {
      // TODO: determine the distance to move based on the intersection point of mouse and vertical plane
      const pos = pcdTool.getMousePos(e);
      const diff = (pos.x - bbox.mouse.x + (pos.y - bbox.mouse.y)) * 20;
      bbox.pcdBox.box.size.z += diff;
      bbox.mouse = pos;
    } else {
      const pos = pcdTool.getIntersectPos(e);
      if (pos != null) {
        bbox.endPos = pos;
        const dist = bbox.endPos.distanceTo(bbox.startPos);
        if (dist > 0.01) {
          if (this.selectFace != null) {
            const move = new THREE.Vector3(
              (bbox.endPos.x - bbox.startPos.x) * 2.0,
              (bbox.endPos.y - bbox.startPos.y) * 2.0,
              0
            ).multiply(normal);
            bbox.pcdBox.box.size = bbox.originalPCDBox.box.size.clone();
            bbox.pcdBox.box.size.add(move);
          }
        }
      } else {
        // TODO: determine the distance to move based on the intersection point of mouse and vertical plane
        const pos = pcdTool.getMousePos(e);
        const diff = (pos.x - bbox.mouse.x + (pos.y - bbox.mouse.y)) * 20;
        const move = new THREE.Vector3(diff * 2.0, diff * 2.0, 0).multiply(
          normal
        );
        bbox.pcdBox.box.size.add(move);
        bbox.mouse = pos;
      }
    }
    bbox.pcdBox.updateCube(true);
    pcdTool._redrawFlag = true;
  };

  const handleMouseMoveForBBoxInRotateMode = function(e, bbox) {
    const mouse = pcdTool.getMousePos(e);
    const diff =
      (mouse.x - bbox.mouse.x + (mouse.y - bbox.mouse.y)) * Math.PI * 1;
    bbox.pcdBox.box.yaw += diff;
    bbox.pcdBox.updateCube(diff != 0);
    bbox.mouse = mouse;
    pcdTool._redrawFlag = true;
  };

  const handleMouseMoveForBBoxInMoveMode = function(e, bbox) {
    if (this.arrowMoving == null) {
      // When none of the arrows are selected
      const pos = pcdTool.getIntersectPos(e);
      if (pos != null) {
        bbox.endPos = pos;
        const dist = bbox.endPos.distanceTo(bbox.startPos);
        if (dist > 0.01) {
          bbox.pcdBox.box.pos.x =
            bbox.originalPCDBox.box.pos.x + (bbox.endPos.x - bbox.startPos.x);
          bbox.pcdBox.box.pos.y =
            bbox.originalPCDBox.box.pos.y + (bbox.endPos.y - bbox.startPos.y);
        }
      }
    } else if (this.arrowMoving.arrow === 2) {
      // When the arrow of Z-axis is selected
      // TODO: determine the distance to move based on the intersection point of mouse and vertical plane
      const pos = pcdTool.getMousePos(e);
      const diff = (pos.x - bbox.mouse.x + (pos.y - bbox.mouse.y)) * 20;
      bbox.pcdBox.box.pos.z += diff;
      bbox.mouse = pos;
    } else {
      // When the arrow of X-axis or Y-axis is selected
      const pos = pcdTool.getIntersectPos(e);
      if (pos != null) {
        bbox.endPos = pos;
        const dist = bbox.endPos.distanceTo(bbox.startPos);
        if (dist > 0.01) {
          if (this.arrowMoving.arrow === 0) {
            bbox.pcdBox.box.pos.x =
              bbox.originalPCDBox.box.pos.x + (bbox.endPos.x - bbox.startPos.x);
          } else if (this.arrowMoving.arrow === 1) {
            bbox.pcdBox.box.pos.y =
              bbox.originalPCDBox.box.pos.y + (bbox.endPos.y - bbox.startPos.y);
          } else {
            console.error('unknown arrow');
          }
        }
      } else {
        // TODO: determine the distance to move based on the intersection point of mouse and vertical plane
        const pos = pcdTool.getMousePos(e);
        const diff = (pos.x - bbox.mouse.x + (pos.y - bbox.mouse.y)) * 20;
        if (this.arrowMoving.arrow === 0) {
          bbox.pcdBox.box.pos.x -= diff;
        } else if (this.arrowMoving.arrow === 1) {
          bbox.pcdBox.box.pos.y -= diff;
        }
        bbox.mouse = pos;
      }
    }
    bbox.pcdBox.updateCube(true);
    pcdTool._redrawFlag = true;
  };

  const handleBoxHover = function(e) {
    const ray = pcdTool.getRay(e);
    const bboxes = Array.from(pcdTool.pcdBBoxes);
    for (let i = 0; i < bboxes.length; ++i) {
      const bbox = bboxes[i];
      const intersectPos = ray.intersectObject(bbox.cube.mesh);
      if (intersectPos.length > 0) {
        if (pcdTool._hoveringBBox === bbox) {
          return bbox;
        }
        resetBoxHover();
        bbox.cube.mesh.material = BBoxParams.hoverMaterial;
        pcdTool._hoveringBBox = bbox;
        pcdTool._redrawFlag = true;
        return bbox;
      }
    }
    return null;
  };

  const resetBoxHover = function() {
    if (pcdTool._hoveringBBox != null) {
      if (pcdTool._hoveringBBox.selected) {
        pcdTool._hoveringBBox.cube.mesh.material = BBoxParams.selectingMaterial;
      } else {
        pcdTool._hoveringBBox.cube.mesh.material = BBoxParams.material;
      }
      pcdTool._redrawFlag = true;
      pcdTool._hoveringBBox = null;
    }
  };

  const modeMethods = {
    resize: {
      prevHover: null,
      hoverFace: null,
      selectFace: null,
      mouse: null,
      animate: function() {},
      mouseDown: function(e) {
        if (this.selectFace == null && this.hoverFace != null) {
          this.selectFace = this.hoverFace;
          this.mouse = pcdTool.getMousePos(e);
          pcdTool._modeStatus.busy = true;
        } else if (this.prevHover != null) {
          pcdTool._labelTool.selectLabel(this.prevHover.label);
        } else {
          pcdTool._labelTool.selectLabel(null);
        }

        setUpdatingBBoxes(e);
        pcdTool._modeStatus.busy = true;
      },
      resetHover: function() {
        if (this.prevHover != null) {
          if (this.prevHover.selected) {
            this.prevHover.cube.mesh.material = BBoxParams.selectingMaterial;
          } else {
            this.prevHover.cube.mesh.material = BBoxParams.material;
          }
          pcdTool._redrawFlag = true;
          this.prevHover = null;
        }
      },
      resetHoverPlane: function() {
        pcdTool._editFacePlane.visible = false;
      },
      setHoverPlane: function(bbox, face) {
        const plane = pcdTool._editFacePlane;
        const normal = face.normal;
        const yaw = bbox.box.yaw;
        const size = bbox.box.size;
        // set rotation
        plane.rotation.set(
          (normal.y * Math.PI) / 2,
          (normal.x * Math.PI) / 2,
          yaw
        );
        // set pos
        const p = bbox.box.pos.clone().add(
          bbox.box.size
            .clone()
            .multiply(normal)
            .divideScalar(2)
            .applyAxisAngle(AXES[2], yaw)
        );
        plane.position.set(p.x, p.y, p.z);
        // set pos
        const nn = normal.clone().multiply(normal);
        const width = new THREE.Vector3(size.z, size.x, size.x).dot(nn),
          height = new THREE.Vector3(size.y, size.z, size.y).dot(nn);
        plane.scale.set(width, height, 1);
        // set status
        plane.visible = true;
        pcdTool._redrawFlag = true;
      },
      mouseMove: function(e) {
        const bboxes = getUpdatingBBoxes();
        if (bboxes.length !== 0) {
          bboxes.forEach(bbox => {
            handleMouseMoveForBboxInResizeMode.bind(this)(e, bbox);
          }, this);
        } else {
          const ray = pcdTool.getRay(e);
          pcdTool._labelTool.getTargetLabels().forEach(label => {
            // select face
            const prevHoverFace = this.hoverFace;
            this.hoverFace = null;
            if (label != null) {
              const bbox = label.bbox[pcdTool.candidateId];
              const intersectPos = ray.intersectObject(bbox.cube.mesh);
              if (intersectPos.length > 0) {
                this.hoverFace = intersectPos[0].face;
              }
              if (prevHoverFace != this.hoverFace) {
                if (this.hoverFace == null) {
                  this.resetHoverPlane();
                } else {
                  this.setHoverPlane(bbox, this.hoverFace);
                }
              }
            }
            // select edit
            const bboxes = Array.from(pcdTool.pcdBBoxes);
            for (let i = 0; i < bboxes.length; ++i) {
              const bbox = bboxes[i];
              const intersectPos = ray.intersectObject(bbox.cube.mesh);
              if (intersectPos.length > 0) {
                if (this.prevHover == bbox) {
                  return;
                }
                this.resetHover();
                bbox.cube.mesh.material = BBoxParams.hoverMaterial;
                this.prevHover = bbox;
                pcdTool._redrawFlag = true;
                return;
              }
            }
          }, this);
          this.resetHover();
        }
      },
      mouseUp: function(e) {
        if (this.selectFace != null) {
          this.selectFace = null;
        }

        storeUpdateHistory();
        resetUpdatingBBoxes();
        pcdTool._modeStatus.busy = false;
      },
      changeFrom: function() {
        this.resetHover();
        if (this.selectFace != null) {
          this.selectFace = null;
        }
        pcdTool._editFacePlane.visible = false;
        pcdTool._redrawFlag = true;
      },
      changeTo: function() {
        pcdTool._wrapper.css('cursor', 'nwse-resize');
      },
      keyboardCommand: {
        keydown: function(args) {
          if (!args) {
            console.log('`args` is undefined.');
            return false;
          }
          if (args['direction'] && args['action'] && args['step']) {
            let direction = JSON.parse(JSON.stringify(args['direction']));
            let step = JSON.parse(JSON.stringify(args['step']));
            let dx, dy;
            switch (direction) {
              case 'left':
                dy = -1 * step;
                break;
              case 'right':
                dy = 1 * step;
                break;
              case 'up':
                dx = 1 * step;
                break;
              case 'down':
                dx = -1 * step;
                break;
              default:
                break;
            }
            transformSelectedBBoxes({ dsx: dx, dsy: dy });
            pcdTool._labelTool.takeSnapshot();
          }
        }
      }
    },
    rotate: {
      mouse: null,
      animate: function() {},
      mouseDown: function(e) {
        setUpdatingBBoxes(e);
        this.mouse = pcdTool.getMousePos(e);
        pcdTool._modeStatus.busy = true;
      },
      mouseMove: function(e) {
        if (this.mouse != null) {
          const bboxes = getUpdatingBBoxes();
          if (bboxes.length !== 0) {
            bboxes.forEach(bbox => {
              handleMouseMoveForBBoxInRotateMode.bind(this)(e, bbox);
            }, this);
          }
        }
      },
      mouseUp: function(e) {
        if (this.mouse != null) {
          this.mouse = null;
        }

        storeUpdateHistory();
        resetUpdatingBBoxes();
        pcdTool._modeStatus.busy = false;
      },
      changeFrom: function() {
        this.mouse = null;
        pcdTool._redrawFlag = true;
      },
      changeTo: function() {
        pcdTool._wrapper.css('cursor', 'default');
      },
      keyboardCommand: {
        keydown: function(args) {
          if (!args) {
            console.log('`args` is undefined.');
            return false;
          }
          if (args['direction'] && args['action'] && args['step']) {
            let direction = JSON.parse(JSON.stringify(args['direction']));
            let step = JSON.parse(JSON.stringify(args['step']));
            let dz;
            switch (direction) {
              case 'left':
                dz = 1 * step;
                break;
              case 'right':
                dz = -1 * step;
                break;
              case 'up':
                dz = -1 * step;
                break;
              case 'down':
                dz = 1 * step;
                break;
              default:
                break;
            }
            transformSelectedBBoxes({ drz: dz });
            pcdTool._labelTool.takeSnapshot();
          }
        }
      }
    },
    move: {
      prevHover: null,
      arrowHover: -1,
      arrowMoving: null,
      animate: function() {},
      mouseDown: function(e) {
        const hoveringBox = handleBoxHover(e);
        if (this.arrowHover !== -1) {
          this.arrowMoving = {
            arrow: this.arrowHover,
            mouse: pcdTool.getMousePos(e)
          };
          pcdTool._modeStatus.busy = true;
        } else if (hoveringBox != null) {
          if (
            pcdTool._labelTool.getTargetLabels().filter(label => {
              return label === hoveringBox.label;
            }).length === 0
          ) {
            pcdTool._labelTool.selectLabel(hoveringBox.label);
          }
        } else {
          pcdTool._labelTool.selectLabel(null);
        }

        setUpdatingBBoxes(e);
        pcdTool._modeStatus.busy = true;
      },
      resetHover: function() {
        resetBoxHover();
      },
      mouseMove: function(e) {
        const bboxes = getUpdatingBBoxes();
        if (bboxes.length !== 0) {
          bboxes.forEach(bbox => {
            handleMouseMoveForBBoxInMoveMode.bind(this)(e, bbox);
          }, this);
          pcdTool.setArrow(
            bboxes.map(bbox => {
              return bbox.pcdBox;
            })
          );
        }

        const ray = pcdTool.getRay(e);

        // arrow edit
        const prevArrowHover = this.arrowHover;
        this.arrowHover = -1;
        for (let i = 0; i < 3; ++i) {
          const arrowIntersect = ray.intersectObject(
            pcdTool._editArrows[i].cone
          );
          if (arrowIntersect.length > 0) {
            if (this.arrowHover != i) {
              pcdTool._editArrows[i].setColor(new THREE.Color(hoverColors[i]));
              this.arrowHover = i;
              pcdTool._redrawFlag = true;
              break;
            }
          }
        }
        if (prevArrowHover != -1 && prevArrowHover != this.arrowHover) {
          // arrow color change
          const arrow = pcdTool._editArrows[prevArrowHover];
          arrow.setColor(new THREE.Color(arrowColors[prevArrowHover]));
          pcdTool._redrawFlag = true;
        }

        // select edit
        if (this.arrowHover == -1) {
          if (handleBoxHover(e) == null) {
            resetBoxHover();
          }
        }
      },
      mouseUp: function(e) {
        if (this.arrowMoving != null) {
          this.arrowMoving = null;
        }

        storeUpdateHistory();
        resetUpdatingBBoxes();
        pcdTool._modeStatus.busy = false;
      },
      changeFrom: function() {
        this.resetHover();
        if (this.arrowHover != -1) {
          const arrow = pcdTool._editArrows[this.arrowHover];
          arrow.setColor(new THREE.Color(arrowColors[this.arrowHover]));
          pcdTool._redrawFlag = true;
          this.arrowHover = -1;
        }
        if (this.arrowMoving != null) {
          this.arrowMoving = null;
        }
      },
      changeTo: function() {
        this.prevHover = null;
        pcdTool._wrapper.css('cursor', 'move');
      },
      keyboardCommand: {
        keydown: function(args) {
          if (!args) {
            console.log('`args` is undefined.');
            return false;
          }
          if (args['direction'] && args['action'] && args['step']) {
            let direction = JSON.parse(JSON.stringify(args['direction']));
            let step = JSON.parse(JSON.stringify(args['step']));
            let dx, dy;
            switch (direction) {
              case 'left':
                dy = 1 * step;
                break;
              case 'right':
                dy = -1 * step;
                break;
              case 'up':
                dx = 1 * step;
                break;
              case 'down':
                dx = -1 * step;
                break;
              default:
                break;
            }
            transformSelectedBBoxes({ dpx: dx, dpy: dy });
            pcdTool._labelTool.takeSnapshot();
          }
        }
      }
    },
    create: {
      animate: function() {},
      mouseDown: function(e) {
        const selectedLabels = pcdTool._labelTool
          .getTargetLabels()
          .filter(label => {
            return label.bbox[pcdTool.candidateId] !== null;
          });
        const hoveredLabel = handleBoxHover(e);
        let flag = selectedLabels
          .map(label => {
            return label.bbox[pcdTool.candidateId] === hoveredLabel;
          })
          .some(flag => {
            return flag;
          });
        if (selectedLabels.length !== 0 && flag) {
          // For duplicating the selected labels
          pcdTool._labelTool.duplicateLabels(selectedLabels);
          setUpdatingBBoxes(e);
          pcdTool.modeChangeRequest('move');
          pcdTool._modeStatus.busy = true;
        } else {
          // For creating a new label
          const pos = pcdTool.getIntersectPos(e);
          if (pos != null) {
            pcdTool._creatingBBox.startPos = pos;
            pcdTool._modeStatus.busy = true;
          }
        }
      },
      mouseMove: function(e) {
        if (pcdTool._creatingBBox.startPos == null) {
          return;
        }
        const pos = pcdTool.getIntersectPos(e);
        if (pos != null) {
          const bbox = pcdTool._creatingBBox;
          bbox.endPos = pos;
          const dist = bbox.endPos.distanceTo(bbox.startPos);
          if (bbox.box == null && dist > 0.01) {
            bbox.box = new THREE.Mesh(BBoxParams.geometry, BBoxParams.material);
            pcdTool._scene.add(bbox.box);
          }
          if (bbox.box != null) {
            pcdTool.creatingBoxUpdate();
            pcdTool._redrawFlag = true;
          }
        }
      },
      mouseUp: function(e) {
        const bbox = pcdTool._creatingBBox;
        if (bbox.box == null) {
          if (bbox.startPos != null) {
            bbox.startPos = null;
            bbox.endPos = null;
          }
          return;
        }
        const pos = pcdTool.getIntersectPos(e);
        if (pos != null) {
          bbox.endPos = pos;
        }
        pcdTool.creatingBoxUpdate();
        const pcdBBox = new PCDBBox(pcdTool, {
          x_3d: bbox.box.position.x,
          y_3d: bbox.box.position.y,
          z_3d: -0.5,
          width_3d: bbox.box.scale.x,
          height_3d: bbox.box.scale.y,
          length_3d: bbox.box.scale.z,
          rotation_y: bbox.box.rotation.z,
          object_id: bbox.box.object_id
        });
        // TODO: add branch use selecting label
        const label = pcdTool._labelTool.createLabel(
          pcdTool._labelTool.getTargetKlass(),
          { [pcdTool.candidateId]: pcdBBox }
        );
        pcdTool._scene.remove(bbox.box);
        pcdTool._redrawFlag = true;
        bbox.startPos = null;
        bbox.endPos = null;
        bbox.box = null;
        storeUpdateHistory();
      },
      changeFrom: function() {},
      changeTo: function() {
        pcdTool._wrapper.css('cursor', 'crosshair');
      },
      adjustToTemplate: {
        keydown: function(args) {
          if (
            !args['templateName'] ||
            !(args.templateName in pcdTool._boxTemplates)
          ) {
            return;
          }
          const template = pcdTool._boxTemplates[args.templateName];
          if (
            !('length' in template) ||
            !('width' in template) ||
            !('height' in template)
          ) {
            return;
          }
          pcdTool._labelTool
            .getTargetLabels()
            .filter(label => {
              return label.bbox[pcdTool.candidateId] != null;
            })
            .forEach(label => {
              resizeBBox({
                bbox: label.bbox[pcdTool.candidateId],
                length: template.length,
                width: template.width,
                height: template.height
              });
            });
        }
      }
    },
    view: {
      animate: function() {
        pcdTool._redrawFlag = true;
        pcdTool._controls.update();
      },
      mouseDown: function(e) {
        const hoveringBox = handleBoxHover(e);
        if (hoveringBox !== null) {
          pcdTool._labelTool.selectLabel(hoveringBox.label, true);
          setUpdatingBBoxes(e);
        }
        pcdTool._modeStatus.busy = true;
      },
      mouseMove: function(e) {
        // select edit
        if (handleBoxHover(e) == null) {
          resetBoxHover();
        }
      },
      mouseUp: function(e) {
        resetUpdatingBBoxes();
        pcdTool._modeStatus.busy = false;
      },
      changeFrom: function() {
        pcdTool._controls.enabled = false;
      },
      changeTo: function() {
        pcdTool._controls.enabled = true;
        pcdTool._wrapper.css('cursor', 'default');
      },
      undo: {
        keydown: function() {
          pcdTool._labelTool.undo();
        }
      },
      redo: {
        keydown: function() {
          pcdTool._labelTool.redo();
        }
      }
    },
    command: {
      animate: function() {},
      mouseDown: function(e) {
        const hoveringBox = handleBoxHover(e);
        if (hoveringBox !== null) {
          pcdTool._labelTool.selectLabel(hoveringBox.label, true);
          setUpdatingBBoxes(e);
        }
        pcdTool._modeStatus.busy = true;
      },
      mouseMove: function(e) {
        // select edit
        if (handleBoxHover(e) == null) {
          resetBoxHover();
        }
      },
      mouseUp: function(e) {
        resetUpdatingBBoxes();
        pcdTool._modeStatus.busy = false;
      },
      changeFrom: function() {
        pcdTool._controls.enabled = false;
      },
      changeTo: function() {
        pcdTool._controls.enabled = false;
        pcdTool._wrapper.css('cursor', 'default');
      },
      save: {
        keydown: function() {
          pcdTool._labelTool.saveFrame();
        }
      },
      undo: {
        keydown: function() {
          pcdTool._labelTool.undo();
        }
      },
      redo: {
        keydown: function() {
          pcdTool._labelTool.redo();
        }
      },
      clip: {
        keydown: function() {
          pcdTool._labelTool.clip();
        }
      },
      paste: {
        keydown: function() {
          pcdTool._labelTool.selectLabel(null);
          pcdTool._labelTool.paste().forEach(label => {
            pcdTool._labelTool.selectLabel(label, true);
          });
        }
      }
    }
  };
  return modeMethods;
}

function createGlobalKeyMethods(pcdTool) {
  const methods = {
    //----------------------------------------------------------------------------
    // mode
    selectMode: {
      keydown: function(args) {
        if (args['target'] && modeNames.indexOf(args['target']) >= 0) {
          if (args['target'] !== pcdTool.getMode()) {
            pcdTool.modeChangeRequest(args['target']);
          }
        }
      }
    },
    temporarySelectMode: {
      keydown: function(args) {
        if (pcdTool._modeStatus.busy) {
          return;
        }
        if (args['target'] && modeNames.indexOf(args['target']) >= 0) {
          if (args['target'] !== pcdTool.getMode()) {
            pcdTool.modeChangeRequest(args['target']);
          }
        }
      },
      keyup: function(args) {
        pcdTool.modeChangeRequest(pcdTool._modeStatus.previousMode);
      }
    },
    toggleMode: {
      keydown: function(args) {
        let candidates = args['candidates'] ? args['candidates'] : modeNames;
        let currentMode = pcdTool.getMode();
        let currentModeIndex = candidates.indexOf(currentMode);
        if (currentModeIndex >= 0) {
          if (currentModeIndex >= candidates.length - 1) {
            pcdTool.modeChangeRequest(candidates[0]);
          } else {
            pcdTool.modeChangeRequest(candidates[currentModeIndex + 1]);
          }
        } else {
          pcdTool.modeChangeRequest(candidates[0]);
        }
      },
      keyup: function(args) {
        // do nothing
      }
    },
    setCameraBirdView: {
      keydown: function(args) {
        pcdTool._initCamera();
        pcdTool.redrawRequest();
      }
    },
    setCameraHorizon: {
      keydown: function(args) {
        let camera = pcdTool._camera;
        let p1 = new THREE.Vector3(-29, 0, 0);
        let p2 = new THREE.Vector3(0, 29, 0);
        let p3 = new THREE.Vector3(29, 0, 0);
        let p4 = new THREE.Vector3(0, -29, 0);
        let targetAngle = null;
        if (camera.position.distanceTo(p1) < 1) {
          targetAngle = p2;
        } else if (camera.position.distanceTo(p2) < 1) {
          targetAngle = p3;
        } else if (camera.position.distanceTo(p3) < 1) {
          targetAngle = p4;
        } else {
          targetAngle = p1;
        }
        pcdTool._initCamera();
        let newCamera = pcdTool._camera;
        newCamera.position.set(targetAngle.x, targetAngle.y, targetAngle.z);
        pcdTool._controls.update();
        pcdTool.redrawRequest();
      }
    },
    deleteBbox: {
      keydown: function(args) {
        pcdTool._labelTool.getTargetLabels().forEach(label => {
          pcdTool._labelTool.removeLabel(label);
        });
      }
    }
  };

  return methods;
}
