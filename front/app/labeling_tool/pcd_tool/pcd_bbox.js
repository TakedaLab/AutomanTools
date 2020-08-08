import BoxFrameObject from './box_frame_object';

const BBoxParams = {
  geometry: new THREE.CubeGeometry(1.0, 1.0, 1.0),
  material: new THREE.MeshBasicMaterial({
    color: 0x008866,
  })
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
  }
  updateSelected(selected) {
    this.selected = selected;
    this.cube.meshFrame.setStatus(selected, false);
    this.cube.meshFrame.setBold(selected);
    const box = this.box;
    this.cube.meshFrame.setParam(box.pos, box.size, box.yaw);
  }
  hover(isInto) {
    this.cube.meshFrame.setStatus(this.selected, isInto);
  }
  updateKlass() {
    this.cube.meshFrame.setColor(this.label.getColor());
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

    this.cube = {
      mesh: mesh,
      meshFrame: meshFrame,
      corners: corners,
      edges: edges,
      zFace: zFace,
      editGroup: group,
      text: text
    };
    this.updateCube(false);
  }
  generateTextMesh() {
    // Generate THREE.Mesh from this.box.objectId
    let color = "#FF3366";
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
    this.updateText();
    if ( changed ) {
      this.label.isChanged = true;
    }
    if (this.selected) {
      this.pcdTool.setArrow(this);
    }
  }
  updateText() {
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
    const newText = this.generateTextMesh();
    const box = this.box;
    this.pcdTool._scene.add(newText);
    newText.position.set(box.pos.x, box.pos.y, box.pos.z);
    newText.rotation.z = box.yaw - 1.57;
    newText.updateMatrixWorld();
    this.cube.text = newText;
  }

  setObjectId(id){
    const box = this.box;
    box.objectId = id
    this.updateParam();
  }
  shiftBboxParams(box_d){
    const box = this.box;
    box.size.set(
      box.size.x + box_d.size.x,
      box.size.y + box_d.size.y,
      box.size.z + box_d.size.z,
    )
    box.pos.set(
      box.pos.x + box_d.pos.x,
      box.pos.y + box_d.pos.y,
      box.pos.z + box_d.pos.z,
    )
    box.yaw = box.yaw + box_d.yaw
    this.updateParam();
  }
  setBboxParams(new_box){
    const box = this.box;
    box.size.set(
      new_box.size.x,
      new_box.size.y,
      new_box.size.z,
    )
    box.pos.set(
      new_box.pos.x,
      new_box.pos.y,
      new_box.pos.z,
    )
    box.yaw = new_box.yaw
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


