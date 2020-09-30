import BoxFrameObject from './box_frame_object';
import projectBBox from './bbox_projector';

const BBoxParams = {
  geometry: new THREE.CubeGeometry(1.0, 1.0, 1.0),
  material: new THREE.MeshBasicMaterial({
    color: 0x008866,
  }),
  // attrs: {
  //   rect: {
  //     'stroke': 'red',
  //     'stroke-width': 10,
  //     'fill': '#fff',
  //     'fill-opacity': 0,
  //     'cursor': 'all-scroll'
  //   }
  // }
  attrs: {
    rect: {
      selected: {
        'stroke': 'red',
        'stroke-width': 6,
        'fill': '#fff',
        'fill-opacity': 0,
        'cursor': 'all-scroll'
      },
      normal: {
        'stroke': '#086',
        'stroke-width': 6,
        'fill': '#fff',
        'fill-opacity': 0,
        'cursor': 'all-scroll'
      },
    }
  }
};
const ZERO2 = new THREE.Vector2(0, 0);
const EDIT_OBJ_SIZE = 0.5;

export default class PCDBBox {
  constructor(pcdTool, content) {
    this.pcdTool = pcdTool;
    this.label = null;
    this.selected = false;
    this.box = {
      pos: new THREE.Vector3(0,0,0),
      size: new THREE.Vector3(0,0,0),
      yaw: 0,
      objectId: 0,
    };
    this.projectedRects = {};
    if (content != null) {
      // init parameters
      this.fromContent(content);
    }
    this.initCube();
    this.pcdTool.pcdBBoxes.add(this);
    this.pcdTool.redrawRequest();
  }
  setSize2(x, y) {
    const res = this.setSize(x, y, this.box.size.z);
    return new THREE.Vector2(res.x, res.y);
  }
  setSize2d(x, y) {
    const prev = this.box.size.clone();
    const res = this.setSize(x, y, this.box.size.z);
    const ret = new THREE.Vector2(res.x-prev.x, res.y-prev.y)
      .rotateAround(ZERO2, this.box.yaw);
    return ret;
  }
  setSizeZ(z) {
    const prev = this.box.size.clone();
    const res = this.setSize(prev.x, prev.y, z);
    return res.z - prev.z;
  }
  setSize(x, y, z) {
    const minSize = new THREE.Vector3(0.1, 0.1, 0.1);
    this.box.size.set(x, y, z).max(minSize);
    return this.box.size.clone();
  }
  setZ(center, height) {
    const h = Math.max(height, 0.1); // use min size
    this.box.size.z = h;
    this.box.pos.z = center;
  }
  setLabel(label) {
    if (this.label != null) {
      // TODO: control error
      throw "Label already set";
    }
    this.label = label;
    this.cube.meshFrame.setColor(label.getColor());
    this.updateText();
    this.pcdTool.redrawRequest();
  }
  updateSelected(selected) {
    this.selected = selected;
    this.cube.meshFrame.setStatus(selected, false);
    // this.cube.meshFrame.setBold(selected);
    const box = this.box;
    this.cube.meshFrame.setParam(box.pos, box.size, box.yaw);
    // Update mesh
    this.updateBoxInfoTextMesh();

    // Update projected rects
    Object.values(this.projectedRects).forEach((rect) => {
      if (selected) {
        rect.attr(BBoxParams.attrs.rect.selected);
      }else {
        rect.attr(BBoxParams.attrs.rect.normal);
      }
    });
  }
  hover(isInto) {
    this.cube.meshFrame.setStatus(this.selected, isInto);
  }
  updateKlass() {
    this.cube.meshFrame.setColor(this.label.getColor());
    this.updateText();
    this.pcdTool.redrawRequest();
  }
  updateParam() {
    this.updateCube(true);
    this.pcdTool.redrawRequest();
  }
  remove() {
    // TODO: remove meshes
    this.cube.meshFrame.removeFrom(this.pcdTool._scene);
    const group = this.cube.editGroup;
    this.pcdTool._scene.remove(group);
    this.removeText();
    this.removeProjectedRects();
    this.pcdTool.redrawRequest();
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
    obj['object_id'] = this.box.objectId;
  }
  static fromContentToObj(content) {
    const ret = {
      pos: new THREE.Vector3(),
      size: new THREE.Vector3(),
      yaw: 0
    };
    ret.pos.x  = +content['x_3d'];
    ret.pos.y  = +content['y_3d'];
    ret.pos.z  = +content['z_3d'];
    ret.size.x = +content['width_3d'];
    ret.size.y = +content['height_3d'];
    ret.size.z = +content['length_3d'];
    ret.yaw    = +content['rotation_y'];
    if(content['object_id']){
      ret.objectId    = +content['object_id'];
    }
    return ret;
  }
  fromContent(content) {
    this.box.pos.x  = +content['x_3d'];
    this.box.pos.y  = +content['y_3d'];
    this.box.pos.z  = +content['z_3d'];
    this.box.size.x = +content['width_3d'];
    this.box.size.y = +content['height_3d'];
    this.box.size.z = +content['length_3d'];
    this.box.yaw    = +content['rotation_y'];
    if(content['object_id']){
      this.box.objectId    = +content['object_id'];
    }
  }
  initCube() {
    const mesh = new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material);

    const meshFrame = new BoxFrameObject();
    meshFrame.addTo(this.pcdTool._scene);

    const group = new THREE.Group();
    const corners = [
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
    ];
    corners.forEach(m => group.add(m));
    const edges = [
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
    ];
    edges.forEach(m => group.add(m));
    const zFace = [
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
      new THREE.Mesh(
        BBoxParams.geometry, BBoxParams.material),
    ];
    zFace.forEach(m => group.add(m));
    group.visible = false;
    this.pcdTool._scene.add(group);
    const text = this.generateTextMesh();
    this.pcdTool._scene.add(text);
    const boxInfoText = this.generateBoxInfoTextMesh();
    this.pcdTool._scene.add(boxInfoText);

    this.cube = {
      mesh: mesh,
      meshFrame: meshFrame,
      corners: corners,
      edges: edges,
      zFace: zFace,
      editGroup: group,
      text: text,
      boxInfoText: boxInfoText,
    };
    this.updateCube(false);
  }
  generateTextMesh() {
    // Generate THREE.Mesh from this.box.objectId
    let color = "#FFFFFF";
    if (this.label != null) {
      color = this.label.klass.color;
    }
    let matDark = new THREE.LineBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    let matDarkBackSide = new THREE.LineBasicMaterial({
      color: "#FFFFFF",
      side: THREE.DoubleSide
    });
    matDarkBackSide.color.offsetHSL(0, 0, 0.4);
    let message = this.box.objectId;
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
    text.scale.set(1, 1, 1);
    return text;
  }
  generateBoxInfoTextMesh () {
    const color = "#FFFFFF";
    const matDark = new THREE.LineBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
    });
    const message = `pos_x: ${this.box.pos.x.toFixed(2)}\n`
      + `pos_y: ${this.box.pos.y.toFixed(2)}\n`
      + `pos_z: ${this.box.pos.z.toFixed(2)}\n`
      + `size_x: ${this.box.size.x.toFixed(2)}\n`
      + `size_y: ${this.box.size.y.toFixed(2)}\n`
      + `size_z: ${this.box.size.z.toFixed(2)}`;
    const shapes = this.pcdTool._font.generateShapes(message, 0.7);
    const geometry = new THREE.ShapeBufferGeometry(shapes);
    geometry.computeBoundingBox();
    geometry.translate(0, 0, 1.0);
    let text = new THREE.Mesh(geometry, matDark);
    text.visible = true;
    text.scale.set(1, 1, 1);
    return text;
  }
  updateCube(changed) {
    const box = this.box;
    const mesh = this.cube.mesh;
    // TODO: check change flag
    // TODO: clamp() all
    mesh.position.set(box.pos.x, box.pos.y, box.pos.z);
    mesh.scale.set(box.size.x, box.size.y, box.size.z);
    mesh.rotation.z = box.yaw;
    mesh.updateMatrixWorld();
    const meshFrame = this.cube.meshFrame;
    meshFrame.setParam(box.pos, box.size, box.yaw);
    const group = this.cube.editGroup;
    group.position.set(box.pos.x, box.pos.y, box.pos.z);
    group.rotation.z = box.yaw;
    const w = EDIT_OBJ_SIZE;
    const corners = this.cube.corners;
    corners[0].position.set(box.size.x/2+w/2, 0, 0);
    corners[0].scale.set(w, box.size.y, box.size.z+w);
    corners[1].position.set(0, box.size.y/2+w/2, 0);
    corners[1].scale.set(box.size.x, w, box.size.z+w);
    corners[2].position.set(-box.size.x/2-w/2, 0, 0);
    corners[2].scale.set(w, box.size.y, box.size.z+w);
    corners[3].position.set(0, -box.size.y/2-w/2, 0);
    corners[3].scale.set(box.size.x, w, box.size.z+w);
    const edges = this.cube.edges;
    edges[0].position.set(box.size.x/2+w/2, box.size.y/2+w/2, 0);
    edges[0].scale.set(w, w, box.size.z+w);
    edges[1].position.set(-box.size.x/2-w/2, box.size.y/2+w/2, 0);
    edges[1].scale.set(w, w, box.size.z+w);
    edges[2].position.set(box.size.x/2+w/2, -box.size.y/2-w/2, 0);
    edges[2].scale.set(w, w, box.size.z+w);
    edges[3].position.set(-box.size.x/2-w/2, -box.size.y/2-w/2, 0);
    edges[3].scale.set(w, w, box.size.z+w);
    const zFace = this.cube.zFace;
    zFace[0].position.set(0, 0, box.size.z/2+w/2);
    zFace[0].scale.set(box.size.x, box.size.y, w);
    zFace[1].position.set(0, 0, -box.size.z/2-w/2);
    zFace[1].scale.set(box.size.x, box.size.y, w);
    this.updateBoxInfoTextMesh();
    this.updateText();
    this.update2DBox();
    if ( changed ) {
      this.label.isChanged = true;
    }
    if (this.selected) {
      this.pcdTool.setArrow(this);
    }
  }
  removeText() {
    if (!("text" in this.cube)) {
      return
    }
    const text = this.cube.text;
    text.children.forEach((child) => {
      text.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }, text)
    this.pcdTool._scene.remove(text);
    text.geometry.dispose();
    text.material.dispose();
  }
  updateText() {
    this.removeText();
    if (this.pcdTool.state.visualizeObjectIds) {
      const newText = this.generateTextMesh();
      const box = this.box;
      this.pcdTool._scene.add(newText);
      newText.position.set(box.pos.x, box.pos.y, box.pos.z);
      newText.scale.set(Math.min(box.size.x, box.size.y) / 2, Math.min(box.size.x, box.size.y) / 2, box.size.z);
      newText.rotation.z = box.yaw - 1.57;
      newText.updateMatrixWorld();
      this.cube.text = newText;
    }
  }
  removeBoxInfoTextMesh () {
    if (!("boxInfoText" in this.cube)) {
      return
    }
    const boxInfoText = this.cube.boxInfoText;
    boxInfoText.children.forEach((child) => {
      boxInfoText.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }, boxInfoText)
    this.pcdTool._scene.remove(boxInfoText);
    boxInfoText.geometry.dispose();
    boxInfoText.material.dispose();
  }
  updateBoxInfoTextMesh () {
    this.removeBoxInfoTextMesh();

    if (this.selected && this.pcdTool.state.visualizeBoxInfo) {
      const newboxInfoText = this.generateBoxInfoTextMesh();
      const box = this.box;
      this.pcdTool._scene.add(newboxInfoText);
      newboxInfoText.position.set(box.pos.x + box.size.x / 2 - 0.4, box.pos.y - box.size.y / 2 - 0.6, box.pos.z);
      // Face to the camera
      newboxInfoText.quaternion.copy(this.pcdTool._camera.quaternion);
      newboxInfoText.updateMatrixWorld();
      this.cube.boxInfoText = newboxInfoText;
    }
  }
  removeProjectedRects() {
    Object.values(this.projectedRects).forEach((rect) => {
      rect.remove();
    });
  }
  update2DBox() {
    if (!this.pcdTool
      || !this.pcdTool.props
      || !this.pcdTool.props.labelTool
      || !this.pcdTool.props.labelTool.calibrations
      || !this.pcdTool.props.labelTool.candidateCalibrations
    ) {
      return
    }
    this.removeProjectedRects();
    if (!this.pcdTool.state.visualizeProjectedRects) return;

    Object.entries(this.pcdTool.props.labelTool.candidateCalibrations).forEach(([key, value]) => {
      const candidateId = Number(key);
      const calibrationFiles = this.pcdTool.props.labelTool.calibrations.filter((item) => {
        return item.id === value
      })
      if (calibrationFiles.length !== 1) return;

      // Project the box to the corresponding 2D image
      const projectedBox = projectBBox(calibrationFiles[0], this.box);
      if (projectedBox.w < 0) return;

      const imageTool = this.pcdTool.props.controls.getToolFromCandidateId(candidateId);
      const width = projectedBox.u_max - projectedBox.u_min;
      const height = projectedBox.v_max - projectedBox.v_min;
      const rect = imageTool._paper.rect(
        projectedBox.u_min, projectedBox.v_min,
        width, height
      );

      if (this.selected) {
        rect.attr(BBoxParams.attrs.rect.selected);
      }
      else {
        rect.attr(BBoxParams.attrs.rect.normal);
      }

      this.projectedRects[key] = rect;
    }, this);
  }
  setObjectId(id){
    const box = this.box;
    box.objectId = id
    this.updateParam();
  }
  shiftBboxParams(bboxParamsD){
    const box = this.box;
    box.size.set(
      box.size.x + bboxParamsD.size.x,
      box.size.y + bboxParamsD.size.y,
      box.size.z + bboxParamsD.size.z,
    )
    box.pos.set(
      box.pos.x + bboxParamsD.pos.x,
      box.pos.y + bboxParamsD.pos.y,
      box.pos.z + bboxParamsD.pos.z,
    )
    box.yaw = box.yaw + bboxParamsD.yaw
    this.updateParam();
  }
  setBboxParams(boxParams){
    const box = this.box;
    box.size.set(
      boxParams.size.x,
      boxParams.size.y,
      boxParams.size.z,
    )
    box.pos.set(
      boxParams.pos.x,
      boxParams.pos.y,
      boxParams.pos.z,
    )
    box.yaw = boxParams.yaw
    this.updateParam();
  }
  rotateFront(n) {
    const box = this.box;
    let cnt = n % 4;
    if (cnt == 0) { return; }

    if (cnt < 0) {
      cnt = 4 + cnt;
    }
    if (cnt & 1) {
      box.size.set(box.size.y, box.size.x, box.size.z);
    }
    box.yaw = (box.yaw + Math.PI / 2 * n) % (Math.PI * 2)

    this.updateParam();
  }
}


