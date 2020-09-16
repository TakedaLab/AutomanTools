import React from 'react';
import ReactDOM from 'react-dom';

import Button from '@material-ui/core/Button';
import {compose} from 'redux';
import {connect} from 'react-redux';

import {addTool} from './actions/tool_action';

import BoxFrameObject from './pcd_tool/box_frame_object';
import PCDBBox from './pcd_tool/pcd_bbox';
import EditBar from './pcd_tool/edit_bar';
import ViewController from './pcd_tool/view_controller'

import { execKeyCommand } from './key_control/index';

// 3d eidt arrow
const arrowColors = [0xff0000, 0x00ff00, 0x0000ff],
  AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

const ZERO2 = new THREE.Vector2(0, 0);
const EDIT_OBJ_SIZE = 0.5;

class PCDLabelTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      meshMaterialSettings: {
        size: 0.05,
      },
      pointColoringSettings: {
        axis: "none",
        controllerMinValue: -10,
        controllerMaxValue: 10,
        minValue: -1,
        maxValue: 5
      },
      visualizeObjectIds: false,
      visualizeBoxInfo: true,
      visualizeProjectedRects: true,
      cameraHelperSettings: {
        isUpdating: false,
        visible: true,
        distance: 10,
      }
    };
    this._wrapperElement = React.createRef();
    this._mainElement = React.createRef();
    this._wipeElement = React.createRef();
    props.dispatchAddTool(props.idx, this);
  }

  componentDidMount() {
    this.init();
  }

  getButtons() {
    return (
      <div>
        <Button
          key={0}
          onClick={this.setHeight}
        >
          Set Height
        </Button>
        <div style={{marginTop: '1rem'}}>
          <ViewController candidateId={this.candidateId}/>
        </div>
      </div>
    );
  }

  getEditor() {
    return <EditBar candidateId={this.candidateId}/>
  }

  render() {
    return (
      <div
        ref={this._wrapperElement}
        style={{position: 'relative'}}
      >
        <div ref={this._mainElement}/>
        <div
          ref={this._wipeElement}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            borderTop: 'solid 2px #fff',
            borderRight: 'solid 2px #fff'
          }}
          onClick={() => this.props.controls.previousFrame()}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#fff',
              padding: '0px 7px'
            }}
          >
            Prev
          </div>
        </div>
      </div>
    );
  }

  // private
  _canvasSize = {width: 2, height: 1};
  _wrapper = null;
  _main = null;
  _wipe = null;
  _loaded = true;
  _scene = null;
  _renderer = null;
  _camera = null;
  _cameraControls = null;
  _cameraHelpers = {};
  //cameraExMat = new THREE.Matrix4();
  // PCD objects
  _pcdLoader = null;
  _pointMeshes = [];
  _wipePointMeshes = [];
  _currentWipePointMesh = null;
  _currentPointMesh = null;
  // to mouse position
  _groundPlane = null;
  _zPlane = null;
  // control mode
  _modeMethods = createModeMethods(this);
  _modeStatus = {
    mode: 'edit',
    busy: false,
    nextMode: null
  };
  _redrawFlag = true;
  _isBirdView = true;
  // to mode 'move'
  _editArrowGroup = null;
  _editArrows = null;
  // to mode 'resize'
  _editFaceCube = null;
  // to mode 'edit'
  _creatingBBox = {
    startPos: null,
    endPos: null,
    box: null
  };
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
    this._initEditObj();
    this._initFont();
    this._initCameraHelper();

    this._animate();
  }

  isLoadedFrame(frame) {
    return this._pointMeshes[frame] != null;
  }

  updateMeshMaterialSettings(settings, callback=()=>{}) {
    let newSettings = {
      ...this.state.meshMaterialSettings,
      ...settings
    }
    this.setState({meshMaterialSettings: newSettings}, () => {
      this._currentPointMesh.material.setValues(newSettings);
      if (this._currentWipePointMesh) {
        this._currentWipePointMesh.material.setValues(newSettings);
      }
      this.redrawRequest();
      callback();
    });
  }
  updatePointColoringSettings(settings, callback=()=>{}) {
    let newSettings = {
      ...this.state.pointColoringSettings,
      ...settings
    }
    this.setState({pointColoringSettings: newSettings}, () => {
      this._currentPointMesh.geometry.colors = this.colorPoints(this._currentPointMesh.geometry.vertices);
      this._currentPointMesh.geometry.colorsNeedUpdate = true;
      if (this._currentWipePointMesh) {
        this._currentWipePointMesh.geometry.colors = this.colorPoints(this._currentWipePointMesh.geometry.vertices);
        this._currentWipePointMesh.geometry.colorsNeedUpdate = true;
      }
      this.redrawRequest();
      callback();
    });
  }

  updateCameraHelperSettings(settings, initCameraHelper=false, callback=()=>{}) {
    let newSettings = {
      ...this.state.cameraHelperSettings,
      ...settings
    };
    this.setState({cameraHelperSettings: newSettings}, () => {
      if (initCameraHelper) {
        this._initCameraHelper();
      }
      callback();
    });
  }

  setVisibleTo(mesh, val) {
    if (mesh != null) {
      mesh.visible = val;
    }
  }

  setPointMesh(frame, mesh) {
    this._pointMeshes[frame] = mesh;
    mesh.visible = false;
    this._scene.add(mesh);
    const wipeMesh = mesh.clone();
    this._wipePointMeshes[frame] = wipeMesh;
    this._wipeScene.add(wipeMesh);
    return wipeMesh;
  }

  pcdLoad(frame) {
    if (this.isLoadedFrame(frame)) {
      return Promise.resolve({
        mesh: this._pointMeshes[frame],
        wipeMesh: this._wipePointMeshes[frame]
      });
    }
    const url = this.props.labelTool.getURL('frame_blob', this.candidateId, frame);
    return new Promise((resolve, reject) => {
      this._pcdLoader.load(url, bufferMesh => {
        const p = bufferMesh.geometry.getAttribute('position');
        let geometry = new THREE.Geometry();
        for (let i = 0; i < p.array.length; i += 3) {
          let v = new THREE.Vector3(p.array[i], p.array[i + 1], p.array[i + 2]);
          geometry.vertices.push(v);
        }
        geometry.colors = this.colorPoints(geometry.vertices);
        let material = new THREE.PointsMaterial({vertexColors: THREE.VertexColors});
        let mesh = new THREE.Points(geometry, material);
        const wipeMesh = this.setPointMesh(frame, mesh);
        resolve({
          mesh,
          wipeMesh
        });
      }, () => { // in progress
      }, (e) => { // error
        reject(e);
      });
    });
  }

  colorPoints(points) {
    let colors = [];
    for (let i = 0; i < points.length; i++) {
      switch (this.state.pointColoringSettings.axis) {
        case "x":
          colors.push(this.getColorFromValue(
            (points[i].x - this.state.pointColoringSettings.minValue)
            / (this.state.pointColoringSettings.maxValue - this.state.pointColoringSettings.minValue)
          ));
          break;
        case "y":
          colors.push(this.getColorFromValue(
            (points[i].y - this.state.pointColoringSettings.minValue)
            / (this.state.pointColoringSettings.maxValue - this.state.pointColoringSettings.minValue)
          ));
          break;
        case "z":
          colors.push(this.getColorFromValue(
            (points[i].z - this.state.pointColoringSettings.minValue)
            / (this.state.pointColoringSettings.maxValue - this.state.pointColoringSettings.minValue)
          ));
          break;
        case "distance":
          let distance = Math.sqrt(Math.pow(points[i].x, 2) + Math.pow(points[i].y, 2) + Math.pow(points[i].z, 2));
          colors.push(this.getColorFromValue(
            (distance - this.state.pointColoringSettings.minValue)
            / (this.state.pointColoringSettings.maxValue - this.state.pointColoringSettings.minValue)
          ));
          break;
        default:
          colors.push(new THREE.Color(1, 1, 1));
      }
    }
    return colors
  }

  getColorFromValue(value) {
    const r = value < 0.5 ? Math.max(Math.min(1.0, 1.0 - value * 3), 0) : Math.max(Math.min(1.0, (value - 0.6) * 3), 0);
    const g = value < 0.5 ? Math.max(Math.min(1.0, value * 3), 0) : Math.max(Math.min(1.0, 1.0 - ((value - 0.6) * 3)), 0);
    const b = Math.max(Math.min(1.0, (value - 0.3) * 3), 0);
    return new THREE.Color(r, g, b);
  }

  loadWipe(frame) {
    this.setVisibleTo(this._currentWipePointMesh, false);
    this._currentWipePointMesh = null;
    const wipeFrame = frame - this.props.controls.getFixedSkipFrameCount();
    if (wipeFrame < 0) {
      return Promise.resolve();
    }
    return this.pcdLoad(wipeFrame).then(({wipeMesh}) => {
      this._currentWipePointMesh = wipeMesh;
      wipeMesh.visible = true;
      wipeMesh.material.setValues(this.state.meshMaterialSettings);
    });
  }

  loadMain(frame) {
    this.setVisibleTo(this._currentPointMesh, false);
    return this.pcdLoad(frame).then(({mesh}) => {
      this._currentPointMesh = mesh;
      mesh.visible = true;
      mesh.material.setValues(this.state.meshMaterialSettings);
    });
  }

  load(frame) {
    this._loaded = false;

    return Promise.all([
      this.loadWipe(frame),
      this.loadMain(frame)
    ]).finally(() => {
      if (this._currentWipePointMesh != null) {
        this._wipe.show();
      } else {
        this._wipe.hide();
      }
      this._redrawFlag = true;
      this._loaded = true;
    });
  }

  handles = {
    resize: size => {
      this._canvasSize = size;
      const camera = this._camera;
      if (camera instanceof THREE.OrthographicCamera) {
        const y = camera.right * size.height / size.width;
        camera.top = y;
        camera.bottom = -y;
      } else {
        camera.aspect = size.width / size.height;
      }
      camera.updateProjectionMatrix();
      this._renderer.setSize(size.width, size.height);
      const wipeScale = 0.32;
      this._wipeRenderer.setSize(size.width * wipeScale, size.height * wipeScale);
      this._redrawFlag = true;
    },
    keydown: (e) => {
      if (!this.props.controls.state.isMouseOnTool) {
        return
      }

      execKeyCommand("reset_camera", e.originalEvent, () => {
        // Reset camera potision to when saveState called
        this._cameraControls.reset();
        this.redrawRequest();
      });
      execKeyCommand("rotate_camera_rear", e.originalEvent, () => {
        this._camera.position.set(-1000, 0, 0);
        this._cameraControls.update();
        this.redrawRequest();
      });
      execKeyCommand("rotate_camera_left", e.originalEvent, () => {
        this._camera.position.set(0, 1000, 0);
        this._cameraControls.update();
        this.redrawRequest();
      });
      execKeyCommand("rotate_camera_front", e.originalEvent, () => {
        this._camera.position.set(1000, 0, 0);
        this._cameraControls.update();
        this.redrawRequest();
      });
      execKeyCommand("rotate_camera_right", e.originalEvent, () => {
        this._camera.position.set(0, -1000, 0);
        this._cameraControls.update();
        this.redrawRequest();
      });

      const handleTemplate = (bboxSize) => {
        const tgt = this.props.controls.getTargetLabel();
        if(tgt){
          const bbox = tgt.bbox[this.candidateId];
          bbox.setBboxParams({
            'pos': bbox.box.pos,
            'size': bboxSize,
            'yaw': bbox.box.yaw,
            });
          var changedLabel = bbox.label.createHistory(null)
          changedLabel.addHistory()
        }else{
          const pcdBBox = this.createBBox({
            'x_3d': 0,
            'y_3d': 0,
            'z_3d': 0,
            'width_3d': bboxSize.x,
            'height_3d': bboxSize.y,
            'length_3d': bboxSize.z,
            'rotation_y': 0,
          });
          this.addLabelOfBBox(pcdBBox);
          this.redrawRequest();
        }
      }

      // adding templates
      execKeyCommand("template_add_kcar", e.originalEvent, () => {
        handleTemplate({ 'x': 3.4, 'y': 1.5, 'z': 1.8 })
      });
      execKeyCommand("template_add_sedan", e.originalEvent, () => {
        handleTemplate({ 'x': 4.5, 'y': 1.7, 'z': 1.5 })
      });
      execKeyCommand("template_add_minivan", e.originalEvent, () => {
        handleTemplate({ 'x': 4.8, 'y': 1.8, 'z': 1.8 })
      });
      execKeyCommand("template_add_small_sized_track", e.originalEvent, () => {
        handleTemplate({ 'x': 3.4, 'y': 1.5, 'z': 1.8 })
      });
      execKeyCommand("template_add_middle_sized_track", e.originalEvent, () => {
        handleTemplate({ 'x': 4.5, 'y': 1.7, 'z': 1.8 })
      });
      execKeyCommand("template_add_large_sized_track", e.originalEvent, () => {
        handleTemplate({ 'x': 8.0, 'y': 2.2, 'z': 3.5 })
      });
      execKeyCommand("template_add_mortorcycle", e.originalEvent, () => {
        handleTemplate({ 'x': 2.0, 'y': 0.8, 'z': 1.5 })
      });
      execKeyCommand("template_add_pedestrian", e.originalEvent, () => {
        handleTemplate({ 'x': 0.5, 'y': 0.5, 'z': 1.67 })
      });
      execKeyCommand("bbox_set_height", e.originalEvent, () => {
        this.setHeight();
      })
    },
    keyup: ((e) => {

    }),
  };

  setActive(isActive) {
    if (isActive) {
      this._wrapper.show();
      this._redrawFlag = true;
    } else {
      this._wrapper.hide();
    }
  }

  activeToolUpdated(toolIndex) {
    const activeCandidateId = this.props.controls.getTools()[toolIndex].candidateId;
    for (let [candidateId, cameraHelper] of Object.entries(this._cameraHelpers)) {
      cameraHelper.visible = this.state.cameraHelperSettings.visible ?
        `${candidateId}` === `${activeCandidateId}` : false;
    }
    this.redrawRequest();
  }

  createWipeBBox(content, klass) {
    const box = PCDBBox.fromContentToObj(content);
    const meshFrame = new BoxFrameObject();
    meshFrame.setParam(box.pos, box.size, box.yaw);
    meshFrame.setColor(klass.getColor());
    meshFrame.addTo(this._wipeScene);
    // TODO: add class
    return {
      box: box,
      meshFrame: meshFrame,
      select(flag) {
        this.meshFrame.setStatus(flag, false);
        this.meshFrame.setBold(flag);
        this.meshFrame.setParam(this.box.pos, this.box.size, this.box.yaw);
      }
    };
  }

  createBBox(content) {
    return new PCDBBox(this, content);
  }

  addLabelOfBBox(pcdBBox) {
    const addedLabel = this.props.controls.createLabel(
      this.props.controls.getTargetKlass(),
      {[this.candidateId]: pcdBBox}
    );
    return addedLabel;
  }

  disposeWipeBBox(bbox) {
    bbox.meshFrame.removeFrom(this._wipeScene);
    this.redrawRequest();
  }

  disposeBBox(bbox) {
    bbox.remove();
  }

  updateTarget(prev, next) {
    const id = this.candidateId;
    if (prev != null && prev.has(id)) {
      prev.bbox[id].updateSelected(false);
      this._redrawFlag = true;
    }
    if (next != null && next.has(id)) {
      next.bbox[id].updateSelected(true);
      this._redrawFlag = true;
    }
    this.setArrow(next && next.bbox[id]);
  }

  // button actions
  setHeight = () => {
    let bboxes;
    const tgt = this.props.controls.getTargetLabel();
    if (tgt !== null) {
      bboxes = [tgt.bbox[this.candidateId]];
    } else {
      if ( window.confirm("すべてのボックスの高さを自動修正しますか？") ) {
        bboxes = Array.from(this.pcdBBoxes);
      }else {
        bboxes = []
      }
    }
    const points = this._currentPointMesh.geometry.vertices;
    let changedLabel = null;
    let existIncludePoint = false;
    for (let i = 0; i < bboxes.length; ++i) {
      const bbox = bboxes[i];
      let maxZ = -Infinity, minZ = Infinity;
      const boxx = bbox.box.pos.x,
        boxy = bbox.box.pos.y,
        boxsx = bbox.box.size.x,
        boxsy = bbox.box.size.y,
        yaw = bbox.box.yaw;
      for (let j = 0; j < points.length; j++) {
        const dx = points[j].x - boxx,
          dy = points[j].y - boxy;
        const x = Math.abs(dx * Math.cos(yaw) + dy * Math.sin(yaw)),
          y = Math.abs(-dx * Math.sin(yaw) + dy * Math.cos(yaw));
        if (2 * x < boxsx && 2 * y < boxsy) {
          existIncludePoint = true;
          const z = points[j].z;
          maxZ = Math.max(maxZ, z);
          minZ = Math.min(minZ, z);
        }
      }
      if (!existIncludePoint) {
        continue;
      }

      const zCenter = (maxZ + minZ) / 2,
        zHeight = maxZ - minZ;
      const changeFlag = bbox.box.size.z !== zHeight || bbox.box.pos.z !== zCenter;
      if (changeFlag) {
        changedLabel = bbox.label.createHistory(changedLabel);
        bbox.setZ(zCenter, zHeight);
        bbox.updateCube(true);
      }
    }
    if (changedLabel !== null) {
      changedLabel.addHistory();
      this.redrawRequest();
    }
  };

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
    this.modeChange(modeNames[idx]);
    return modeNames[idx];
  }

  _initThree() {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this._canvasSize.width, this._canvasSize.height);
    this._renderer = renderer;
    this._scene = scene;

    const GRID_SIZE = 100;
    const gridPlane = new THREE.GridHelper(GRID_SIZE, GRID_SIZE / 5);
    gridPlane.rotation.x = Math.PI / 2;
    gridPlane.position.x = 0;
    gridPlane.position.y = 0;
    gridPlane.position.z = -1;
    this._gridPlane = gridPlane;
    this._scene.add(gridPlane);


    const pcdLoader = new THREE.PCDLoader();
    this._pcdLoader = pcdLoader;


    // wipe
    const wipeScene = new THREE.Scene();
    const wipeRenderer = new THREE.WebGLRenderer({antialias: true});
    wipeRenderer.setClearColor(0x000000);
    wipeRenderer.setPixelRatio(window.devicePixelRatio);
    wipeRenderer.setSize(this._canvasSize.width * 0.22, this._canvasSize.height * 0.22);
    this._wipeRenderer = wipeRenderer;
    this._wipeScene = wipeScene;
  }

  _initCamera() {
    // TODO: read YAML and set camera?
    let camera;
    const NEAR = 1, FAR = 2000;
    const aspect = this._canvasSize.width / this._canvasSize.height;
    if (this._isBirdView) {
      const x = 40, y = x / aspect;
      camera = new THREE.OrthographicCamera(-x, x, y, -y, NEAR, FAR);
      camera.position.set(0, 0, 450);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    } else {
      camera = new THREE.PerspectiveCamera(90, aspect, NEAR, FAR);
      camera.position.set(0, 0, 0.5);
    }
    camera.rotation.order = 'ZXY';
    camera.up.set(0, 0, 1);
    this._scene.add(camera);

    const controls = new THREE.OrbitControls(camera, this._renderer.domElement);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.3;
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
    this._cameraControls = controls;
    // Save camera parameters for later reset
    this._cameraControls.saveState();
  }

  _initDom() {
    const wrapper = $(this._wrapperElement.current);
    this._wrapper = wrapper;
    wrapper.hide();

    const main = $(this._mainElement.current);
    main.append(this._renderer.domElement);
    this._main = main;

    const wipe = $(this._wipeElement.current);
    wipe.append(this._wipeRenderer.domElement);
    this._wipe = wipe;
  }

  _initEvent() {
    const modeStatus = this._modeStatus;
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x000000, visible: false
    });
    const groundGeo = new THREE.PlaneGeometry(1e5, 1e5);
    const groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.position.x = 0;
    groundPlane.position.y = 0;
    groundPlane.position.z = -1;
    this._groundPlane = groundPlane;
    const zPlane = new THREE.Mesh(groundGeo, groundMat);
    zPlane.rotation.x = Math.PI / 2;
    zPlane.rotation.order = 'ZXY';
    this._zPlane = zPlane;

    // mouse events
    this._main.contextmenu((e) => {
      e.preventDefault();
    }).mousedown((e) => {
      if (e.button !== 0) {
        return;
      } // not left click
      this.getModeMethod().mouseDown(e);
    }).mouseup((e) => {
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
    }).mousemove((e) => {
      this.getModeMethod().mouseMove(e);
    });

    this.getModeMethod().changeTo();
  }

  _initEditObj() {
    // face edit cube
    const faceCubeGeo = new THREE.CubeGeometry(1, 1, 1);
    const faceCubeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, side: THREE.DoubleSide,
      transparent: true, opacity: 0.5
    });
    const faceCube = new THREE.Mesh(faceCubeGeo, faceCubeMat);
    faceCube.rotation.order = 'ZXY';
    faceCube.visible = false;
    this._editFaceCube = faceCube;
    this._scene.add(faceCube);
  }

  _initArrow() {
    const size = 3,
      head = size / 2,
      headWidth = head / 2;
    this._editArrows = [
      new THREE.ArrowHelper(AXES[0], new THREE.Vector3(0, 0, 0), size, arrowColors[0], head, headWidth),
      //new THREE.ArrowHelper(AXES[1], new THREE.Vector3(0,0,0), size, arrowColors[1], head, headWidth),
      //new THREE.ArrowHelper(AXES[2], new THREE.Vector3(0,0,0), size, arrowColors[2], head, headWidth),
    ];
    const group = new THREE.Group();
    this._editArrows.forEach(arrow => {
      group.add(arrow);
    });
    group.visible = false;
    this._editArrowGroup = group;
    this._scene.add(group);
  }

  _initFont() {
    let promises = [];
    promises.push(
      new Promise((resolve, reject) => {
        $.getJSON('/static/fonts/helvetiker_regular.typeface.json', function (
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

  _initCameraHelper() {
    if (this.state.cameraHelperSettings.isUpdating) return;
    const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
    (async (_this) => {
      // Wait until tools are initialized and calibration files are loaded
      while (!_this.props.labelTool
        || !_this.props.labelTool.candidateCalibrations
        || !_this.props.labelTool.calibrations
        || !_this.props.controls
        ) {
        await sleep(500);
      }
      if (this.state.cameraHelperSettings.isUpdating) return;
      _this.updateCameraHelperSettings({isUpdating: true}, false);
      for (const [key, value] of Object.entries(_this.props.labelTool.candidateCalibrations)) {
        const candidateId = Number(key);
        if (value === null) continue;

        // Remove the existing camera-helper
        if (_this._cameraHelpers[candidateId]) {
          _this._scene.remove(_this._cameraHelpers[candidateId])
          _this._cameraHelpers[candidateId].geometry.dispose();
          _this._cameraHelpers[candidateId].material.dispose();
        }

        // Get the corresponding calibration file
        const calibrationFiles = _this.props.labelTool.calibrations.filter((item) => {
          return item.id === value
        })
        if (calibrationFiles.length !== 1) {
          console.error('Could not find the corresponding calibration file for candidate ' + key);
          continue;
        }
        const cameraMatrixT = calibrationFiles[0].cameraMatrixT;
        const cameraExtrinsicMatrixFlippedT = calibrationFiles[0].cameraExtrinsicMatrixFlippedT;

        // Calculate FOV of the camera
        const imageTool = _this.props.controls.getToolFromCandidateId(candidateId);
        if (imageTool === null) {
          console.error('Could not find the corresponding image-tool for candidate ' + key);
          continue;
        }
        while (!imageTool._imageSize || imageTool._imageSize.width === 0 && imageTool._imageSize.height === 0) {
          await sleep(500);
        }
        const width = imageTool._imageSize.width;
        const height = imageTool._imageSize.height;
        const fx = cameraMatrixT.elements[0];
        const fov = 2 * Math.atan(width / (2 * fx)) / Math.PI * 180;

        // Get active image-tool
        let activeCandidateId = -1;
        let activeTool = _this.props.controls.getTool()
        if (activeTool.dataType === 'IMAGE') {
          activeCandidateId = activeTool.candidateId;
        }else {
          activeTool = _this.props.controls.props.tools.filter((tool) => {
            return tool.state.isWipe
          })
          if (activeTool.length === 1) activeCandidateId = activeTool[0].candidateId;
        }

        // Create a camera-helper
        const distance = _this.state.cameraHelperSettings.distance;
        let camera = new THREE.PerspectiveCamera(fov, width / height, 1, distance);
        camera.matrixWorld.set(...cameraExtrinsicMatrixFlippedT.elements);
        let cameraHelper = new THREE.CameraHelper(camera);
        cameraHelper.visible = _this.state.cameraHelperSettings.visible ?
          candidateId === activeCandidateId : false;
        _this._scene.add(cameraHelper);
        _this._cameraHelpers[candidateId] = cameraHelper;
      }

      _this.redrawRequest();
      _this.updateCameraHelperSettings({isUpdating: false}, false);
    })(this);
  }

  _animate() {
    const id = window.requestAnimationFrame(() => {
      this._animate()
    });
    this.getModeMethod().animate();

    if (this._redrawFlag) {
      try {
        this._renderer.render(
          this._scene,
          this._camera);
        this._wipeRenderer.render(
          this._wipeScene,
          this._camera);
      } catch (e) {
        console.error(e);
        window.cancelAnimationFrame(id);
        return;
      }
      this._redrawFlag = false;
    }
  }

  setArrow(bbox, direction) {
    if (bbox == null) {
      this._editArrowGroup.visible = false;
    } else {
      let pos = bbox, dir = direction;
      if (bbox instanceof PCDBBox) {
        pos = bbox.box.pos;
        dir = bbox.box.yaw;
      }
      this._editArrowGroup.visible = true;
      this._editArrowGroup.position.set(pos.x, pos.y, pos.z);
      this._editArrowGroup.rotation.z = dir;
    }
  }

  setMouseType(name) {
    this._main.css('cursor', name);
  }

  resetMouseType() {
    this._main.css('cursor', 'crosshair');
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
    this._modeMethods[mode].changeFrom();
    nextMethod.changeTo();
    this._modeStatus.mode = nextMode;
    // TODO: maybe change
    //Controls.GUI.update();
  }

  // 3d geo methods
  getMousePos(e) {
    const offset = this._main.offset();
    const size = this._renderer.getSize();
    return new THREE.Vector2(
      (e.clientX - offset.left) / size.width * 2 - 1,
      -(e.clientY - offset.top) / size.height * 2 + 1
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
      ray = new THREE.Raycaster(camera.position, vec.sub(camera.position).normalize());
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

  getZPos(e, p) {
    const ray = this.getRay(e);
    const zPlane = this._zPlane;
    zPlane.rotation.z = this._camera.rotation.z;
    zPlane.position.x = p.x;
    zPlane.position.y = p.y;
    zPlane.position.z = 0;
    zPlane.updateMatrixWorld();
    const intersectPos = ray.intersectObject(zPlane);
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
      dx = sp.x - ep.x,
      dy = sp.y - ep.y;
    let phi = this._camera.rotation.z;
    const rx = Math.cos(phi),
      ry = Math.sin(phi);
    let w = dx * rx + dy * ry,
      h = dx * ry - dy * rx;
    if (Math.abs(w) > Math.abs(h)) {
      h = Math.abs(h);
      if (w < 0) {
        phi = (phi + Math.PI) % (Math.PI * 2);
        w = -w;
      }
    } else {
      w = Math.abs(w);
      if (h < 0) {
        phi = (phi + Math.PI / 2) % (Math.PI * 2);
        h = -h;
      } else {
        phi = (phi + Math.PI * 3 / 2) % (Math.PI * 2);
      }
      [w, h] = [h, w];
    }
    const pos = new THREE.Vector3(cx, cy, -0.5),
      size = new THREE.Vector3(w, h, 1.0);
    data.box.setParam(pos, size, phi);
    this.setArrow(pos, phi);
  }

};


const modeNames = [
  'edit', 'view'
];

// TODO: move select methods to one place
function createModeMethods(pcdTool) {
  const modeMethods = {
    'edit': {
      prevHover: null,
      mode: null,
      startParam: null,
      animate: function () {
        if (pcdTool._cameraControls.enabled) {
          pcdTool.redrawRequest();
          pcdTool._cameraControls.update();
        }
      },
      mouseDown: function (e) {
        // Enable orbit control
        pcdTool._cameraControls.enabled = true;

        let pos = pcdTool.getIntersectPos(e);
        if (this.prevHover !== null && this.prevHover.type === 'top') {
          pos = pcdTool.getZPos(e, this.prevHover.bbox.box.pos);
        }

        // Move the selected box
        if (pos != null && this.prevHover !== null) {
          // Disable orbit control
          pcdTool._cameraControls.enabled = false;

          this.mode = 'move';
          const startParam = {
            size: this.prevHover.bbox.box.size.clone(),
            pos: this.prevHover.bbox.box.pos.clone(),
            yaw: this.prevHover.bbox.box.yaw,
            mouse: pos.clone()
          };
          if (this.prevHover.type === 'edge') {
            pcdTool.setMouseType('grabbing');
            const p = startParam.pos,
              s = startParam.size;
            const sign = new THREE.Vector2(
              ...[
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1]
              ][this.prevHover.idx]
            );
            const diag = new THREE.Vector2(s.x, s.y)
              .multiply(sign)
              .rotateAround(ZERO2, startParam.yaw);
            startParam.fix = new THREE.Vector2(
              p.x - diag.x / 2,
              p.y - diag.y / 2
            );
            startParam.diag = diag;
            startParam.diagYaw = Math.atan2(diag.y, diag.x);
          }
          this.startParam = startParam;
          pcdTool._modeStatus.busy = true;
          pcdTool.props.controls.selectLabel(this.prevHover.bbox.label);
          this.prevHover.bbox.label.createHistory();
          return;
        }

        // Select a box or create a new box
        if (pos != null) {
          if (pcdTool.props.controls.state.isCreationKeyPressed) {
            // Disable orbit control
            pcdTool._cameraControls.enabled = false;

            pcdTool._creatingBBox.startPos = pos;
            pcdTool._modeStatus.busy = true;
            this.mode = 'create';
          }
          pcdTool.props.controls.selectLabel(null);
          return;
        }
        this.mode = null;
      },
      resetHoverObj: function () {
        pcdTool._editFaceCube.visible = false;
      },
      setHoverObjZ: function (bbox, normal) {
        const cube = pcdTool._editFaceCube;
        const yaw = bbox.box.yaw;
        const size = bbox.box.size;
        const w = EDIT_OBJ_SIZE;
        cube.rotation.set(0, 0, yaw);
        const p = bbox.box.pos;
        cube.position.set(
          p.x,
          p.y,
          p.z + normal.z * (bbox.box.size.z + w) / 2
        );
        cube.scale.set(size.x, size.y, w);
        cube.visible = true;
        pcdTool.redrawRequest();
      },
      setHoverObj: function (bbox, normal) {
        const cube = pcdTool._editFaceCube;
        const yaw = bbox.box.yaw;
        const size = bbox.box.size;
        // set rotation
        cube.rotation.set(
          0, //normal.y*Math.PI/2,
          0, //normal.x*Math.PI/2,
          yaw
        );
        const w = EDIT_OBJ_SIZE;
        const cubeOffset = new THREE.Vector3(
          normal.x * w / 2,
          normal.y * w / 2,
          0
        );
        const cubeSize = new THREE.Vector3(
          normal.x ? w : size.x,
          normal.y ? w : size.y,
          size.z
        );
        // set pos
        const p = bbox.box.pos.clone()
          .add(
            bbox.box.size.clone()
              .multiply(normal)
              .divideScalar(2)
              .add(cubeOffset)
              .applyAxisAngle(AXES[2], yaw)
          );
        cube.position.set(p.x, p.y, p.z);
        // set pos
        /*
        const nn = normal.clone().multiply(normal);
        const width = (new THREE.Vector3(size.z, size.x, size.x))
                      .dot(nn),
              height= (new THREE.Vector3(size.y, size.z, size.y))
                      .dot(nn);
        plane.scale.set(width, height, 1);
        */
        cube.scale.set(
          cubeSize.x,
          cubeSize.y,
          cubeSize.z
        );
        // set status
        cube.visible = true;
        pcdTool.redrawRequest();
      },
      resetHover: function () {
        this.resetHoverObj();
        if (this.prevHover == null) {
          return;
        }
        const bbox = this.prevHover.bbox;
        bbox.hover(false);
        pcdTool.redrawRequest();
        this.prevHover = null;
      },
      EDGE_NORMALS: [
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(-1, 1, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(-1, -1, 0),
      ],
      mouseMoveEdgeIntersectCheck: function (ray) {
        const bboxes = Array.from(pcdTool.pcdBBoxes);
        for (let i = 0; i < bboxes.length; ++i) {
          const bbox = bboxes[i];
          for (let j = 0; j < 4; ++j) {
            const edge = bbox.cube.edges[j];
            const intersectPos = ray.intersectObject(edge);
            if (intersectPos.length > 0) {
              if (this.prevHover &&
                this.prevHover.type === 'edge' &&
                this.prevHover.bbox === bbox &&
                this.prevHover.idx === j) {
                return true;
              }
              this.resetHover();
              pcdTool.setMouseType('grab');
              const normal = this.EDGE_NORMALS[j];
              this.setHoverObj(bbox, normal);
              this.prevHover = {
                type: 'edge',
                bbox: bbox,
                idx: j
              };
              pcdTool.redrawRequest();
              return true;
            }
          }
        }
        return false;
      },
      CORNER_NORMALS: [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, -1, 0),
      ],
      TOP_NORMALS: [
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
      ],
      mouseMoveCornerIntersectCheck: function (ray) {
        const bboxes = Array.from(pcdTool.pcdBBoxes);
        for (let i = 0; i < bboxes.length; ++i) {
          const bbox = bboxes[i];
          for (let j = 0; j < 4; ++j) {
            const corner = bbox.cube.corners[j];
            const intersectPos = ray.intersectObject(corner);
            if (intersectPos.length > 0) {
              if (this.prevHover &&
                this.prevHover.type === 'corner' &&
                this.prevHover.bbox === bbox &&
                this.prevHover.idx === j) {
                return true;
              }
              this.resetHover();
              pcdTool.setMouseType('ew-resize');
              const normal = this.CORNER_NORMALS[j];
              this.setHoverObj(bbox, normal);
              this.prevHover = {
                type: 'corner',
                bbox: bbox,
                idx: j
              };
              pcdTool.redrawRequest();
              return true;
            }
          }
        }
        return false;
      },
      mouseMoveTopIntersectCheck: function (ray) {
        const bboxes = Array.from(pcdTool.pcdBBoxes);
        for (let i = 0; i < bboxes.length; ++i) {
          const bbox = bboxes[i];
          for (let j = 0; j < 2; ++j) {
            const corner = bbox.cube.zFace[j];
            const intersectPos = ray.intersectObject(corner);
            if (intersectPos.length > 0) {
              if (this.prevHover &&
                this.prevHover.type === 'top' &&
                this.prevHover.bbox === bbox &&
                this.prevHover.idx === j) {
                return true;
              }
              this.resetHover();
              pcdTool.setMouseType('ns-resize');
              const normal = this.TOP_NORMALS[j];
              this.setHoverObjZ(bbox, normal);
              this.prevHover = {
                type: 'top',
                bbox: bbox,
                idx: j
              };
              pcdTool.redrawRequest();
              return true;
            }
          }
        }
        return false;
      },
      mouseMoveIntersectCheck: function (ray) {
        const bboxes = Array.from(pcdTool.pcdBBoxes);
        for (let i = 0; i < bboxes.length; ++i) {
          const bbox = bboxes[i];
          const intersectPos = ray.intersectObject(bbox.cube.mesh);
          if (intersectPos.length > 0) {
            if (this.prevHover &&
              this.prevHover.type === 'box' &&
              this.prevHover.bbox === bbox) {
              return true;
            }
            this.resetHover();
            bbox.hover(true);
            pcdTool.setMouseType('all-scroll');
            this.prevHover = {
              type: 'box',
              bbox: bbox
            };
            pcdTool.redrawRequest();
            return true;
          }
        }
        return false;
      },
      // resize and rotate
      mouseMoveRotateResize: function (bbox, prev, dx, dy) {
        const dp = new THREE.Vector2(dx, dy).add(prev.diag);
        const yaw = Math.atan2(dp.y, dp.x) - prev.diagYaw + prev.yaw;
        let size = dp.clone().rotateAround(ZERO2, -yaw);
        size.x = Math.abs(size.x);
        size.y = Math.abs(size.y);
        size = bbox.setSize2(size.x, size.y);
        const dpLen = dp.length();
        const pos = dp.multiplyScalar(size.length())
          .divideScalar(dpLen * 2).add(prev.fix);
        bbox.box.pos.set(pos.x, pos.y, bbox.box.pos.z);
        bbox.box.yaw = yaw;
      },
      // resize one side size
      mouseMoveResizeXP: function (bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x + dx, prevSize.y)
          .divideScalar(2);
        bbox.box.pos.add(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      mouseMoveResizeXN: function (bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x - dx, prevSize.y)
          .divideScalar(2);
        bbox.box.pos.sub(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      mouseMoveResizeYP: function (bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x, prevSize.y + dy)
          .divideScalar(2);
        bbox.box.pos.add(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      mouseMoveResizeYN: function (bbox, prev, dx, dy) {
        const prevSize = prev.size;
        const dsize = bbox.setSize2d(prevSize.x, prevSize.y - dy)
          .divideScalar(2);
        bbox.box.pos.sub(new THREE.Vector3(dsize.x, dsize.y, 0));
      },
      // resize z size
      mouseMoveResizeZP: function (bbox, prev, dz) {
        const prevSize = prev.size;
        const dsize = bbox.setSizeZ(prevSize.z + dz) / 2;
        bbox.box.pos.add(new THREE.Vector3(0, 0, dsize));
      },
      mouseMoveResizeZN: function (bbox, prev, dz) {
        const prevSize = prev.size;
        const dsize = bbox.setSizeZ(prevSize.z - dz) / 2;
        bbox.box.pos.sub(new THREE.Vector3(0, 0, dsize));
      },
      mouseMove: function (e) {
        if (this.mode === 'move') {
          const bbox = this.prevHover.bbox;
          const prev = this.startParam;

          const pos = this.prevHover.type !== 'top'
            ? pcdTool.getIntersectPos(e)
            : pcdTool.getZPos(e, prev.pos);
          if (pos == null) {
            return;
          }
          const dx = pos.x - prev.mouse.x;
          const dy = pos.y - prev.mouse.y;
          const dz = pos.z - prev.mouse.z;

          if (this.prevHover.type === 'box') {
            bbox.box.pos.set(prev.pos.x + dx, prev.pos.y + dy, prev.pos.z);
          } else if (this.prevHover.type === 'edge') {
            this.mouseMoveRotateResize(bbox, prev, dx, dy);

            const idx = this.prevHover.idx;
            const normal = this.EDGE_NORMALS[idx];
            this.setHoverObj(bbox, normal);
          } else if (this.prevHover.type === 'corner') {
            const yaw = bbox.box.yaw;
            let dp = new THREE.Vector2(dx, dy);
            dp = dp.rotateAround(ZERO2, -yaw);
            const idx = this.prevHover.idx;
            [
              this.mouseMoveResizeXP,
              this.mouseMoveResizeYP,
              this.mouseMoveResizeXN,
              this.mouseMoveResizeYN
            ][idx](bbox, prev, dp.x, dp.y);

            const normal = this.CORNER_NORMALS[idx];
            this.setHoverObj(bbox, normal);
          } else if (this.prevHover.type === 'top') {
            const idx = this.prevHover.idx;
            [
              this.mouseMoveResizeZP,
              this.mouseMoveResizeZN
            ][idx](bbox, prev, dz);

            const normal = this.TOP_NORMALS[idx];
            this.setHoverObjZ(bbox, normal);
          }
          bbox.updateCube(true);
          pcdTool.redrawRequest();
          return;
        }

        if (pcdTool._creatingBBox.startPos != null) {
          this.resetHover();
          const pos = pcdTool.getIntersectPos(e);
          if (pos == null) {
            return;
          }
          const bbox = pcdTool._creatingBBox;
          bbox.endPos = pos;
          const dist = bbox.endPos.distanceTo(bbox.startPos);
          if (bbox.box == null && dist > 0.01) {
            bbox.box = new BoxFrameObject();
            bbox.box.addTo(pcdTool._scene);
            bbox.box.setColor('#fff');
          }
          if (bbox.box != null) {
            pcdTool.creatingBoxUpdate();
            pcdTool.redrawRequest();
          }
          return;
        }

        const ray = pcdTool.getRay(e);
        if (this.mouseMoveIntersectCheck(ray)) {
          return;
        }
        if (pcdTool._camera.rotation.x < Math.PI / 180 * 45) {
          if (this.mouseMoveCornerIntersectCheck(ray)) {
            return;
          }
        } else {
          if (this.mouseMoveTopIntersectCheck(ray)) {
            return;
          }
        }
        if (this.mouseMoveEdgeIntersectCheck(ray)) {
          return;
        }
        this.resetHover();
        pcdTool.resetMouseType();
      },
      mouseUp: function (e) {
        const mode = this.mode;
        this.mode = null;

        // Enable orbit control
        pcdTool._cameraControls.enabled = true;

        if (mode === 'move') {
          const box = this.prevHover.bbox.box;
          if (!this.startParam.size.equals(box.size) ||
            !this.startParam.pos.equals(box.pos) ||
            this.startParam.yaw !== box.yaw) {
            this.prevHover.bbox.label.addHistory();
          }
        }
        if (mode === 'create') {
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
          const boxPos = bbox.box.getPos();
          const boxSize = bbox.box.getSize();
          const boxYaw = bbox.box.getYaw();
          const pcdBBox = new PCDBBox(pcdTool, {
            'x_3d': boxPos.x,
            'y_3d': boxPos.y,
            'z_3d': -0.5,
            'width_3d': boxSize.x,
            'height_3d': boxSize.y,
            'length_3d': boxSize.z,
            'rotation_y': boxYaw,
          });
          // TODO: add branch use selecting label
          const label = pcdTool.props.controls.createLabel(
            pcdTool.props.controls.getTargetKlass(),
            {[pcdTool.candidateId]: pcdBBox}
          );
          bbox.box.removeFrom(pcdTool._scene);
          pcdTool.redrawRequest();
          bbox.startPos = null;
          bbox.endPos = null;
          bbox.box = null;
        }
      },
      changeFrom: function () {
        pcdTool._cameraControls.enabled = false;
      },
      changeTo: function () {
        pcdTool._cameraControls.enabled = true;
        //pcdTool._main.css('cursor', 'crosshair');
      },
    },
    'view': {
      animate: function () {
        pcdTool.redrawRequest();
        pcdTool._cameraControls.update();
      },
      mouseDown: function (e) {
        pcdTool._modeStatus.busy = true;
      },
      mouseMove: function (e) {
      },
      mouseUp: function (e) {
      },
      changeFrom: function () {
        pcdTool._cameraControls.enabled = false;
      },
      changeTo: function () {
        pcdTool._cameraControls.enabled = true;
        //pcdTool._main.css('cursor', 'all-scroll');
      },
    },
  };
  return modeMethods;
}

const mapStateToProps = state => ({
  controls: state.tool.controls,
  labelTool: state.tool.labelTool
});
const mapDispatchToProps = dispatch => ({
  dispatchAddTool: (idx, target) => dispatch(addTool(idx, target))
});
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(PCDLabelTool);


