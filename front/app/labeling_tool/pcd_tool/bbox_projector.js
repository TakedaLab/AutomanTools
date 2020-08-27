const project3DPoint = (calibrationFile, x_3d, y_3d, z_3d) => {
  const distCoeff = calibrationFile.calibration.dist_coeff[0];
  const k1 = distCoeff[0];
  const k2 = distCoeff[1];
  const t1 = distCoeff[2];
  const t2 = distCoeff[3];
  const k3 = distCoeff[4];
  const mul = calibrationFile.cameraExtrinsicMatrix.elements;
  const X = x_3d - mul[12];
  const Y = y_3d - mul[13];
  const Z = z_3d - mul[14];
  const x = mul[0] * X + mul[1] * Y + mul[2] * Z;
  const y = mul[4] * X + mul[5] * Y + mul[6] * Z;
  const z = mul[8] * X + mul[9] * Y + mul[10] * Z;
  const x1 = x / z;
  const y1 = y / z;
  const r = Math.pow(x1, 2) + Math.pow(y1, 2);
  const radialDistCoeff = 1 + k1 * Math.pow(r, 2) + k2 * Math.pow(r, 4) + k3 * Math.pow(r, 6);
  const x2 = x1 * radialDistCoeff + 2 * t1 * x1 * y1 + t2 * (Math.pow(r, 2) + 2 * Math.pow(x1, 2));
  const y2 = y1 * radialDistCoeff + t1 * (Math.pow(r, 2) + 2 * Math.pow(y1, 2)) + 2 * t2 * x1 * y1;
  const cameraMat = calibrationFile.calibration.camera_mat;
  const u = cameraMat[0][0] * x2 + cameraMat[0][2];
  const v = cameraMat[1][1] * y2 + cameraMat[1][2];
  return {
    u: u,
    v: v,
    w: z,
  }
}


const projectBBox = (calibrationFile, box) => {
  const x_2 = box.size.x / 2;
  const y_2 = box.size.y / 2;
  const z_2 = box.size.z / 2;
  const cornerPointBases = [
    [x_2, y_2, z_2],
    [x_2, -y_2, z_2],
    [-x_2, -y_2, z_2],
    [-x_2, y_2, z_2],
    [x_2, y_2, -z_2],
    [x_2, -y_2, -z_2],
    [-x_2, -y_2, -z_2],
    [-x_2, y_2, -z_2]
  ];
  const cornerPoints = cornerPointBases.map((p) => {
    return [
      box.pos.x + Math.cos(box.yaw) * p[0] - Math.sin(box.yaw) * p[1] + 0 * p[2],
      box.pos.y + Math.sin(box.yaw) * p[0] + Math.cos(box.yaw) * p[1] + 0 * p[2],
      box.pos.z + 0 * p[0] + 0 * p[1] + 1 * p[2]
    ]
  })

  let projectedBox = project3DPoint(calibrationFile, box.pos.x, box.pos.y, box.pos.z);
  const projectedCornerPoints = cornerPoints.map((points) => {
    return project3DPoint(calibrationFile, ...points);
  })
  projectedBox = {
    ...projectedBox,
    u_min: Math.min(...projectedCornerPoints.map((item) => {return item.u})),
    u_max: Math.max(...projectedCornerPoints.map((item) => {return item.u})),
    v_min: Math.min(...projectedCornerPoints.map((item) => {return item.v})),
    v_max: Math.max(...projectedCornerPoints.map((item) => {return item.v})),
    w_min: Math.min(...projectedCornerPoints.map((item) => {return item.w})),
    w_max: Math.max(...projectedCornerPoints.map((item) => {return item.w})),
    cornerPoints: cornerPoints,
    projectedCornerPoints: projectedCornerPoints,
    box: box,
  }

  return projectedBox;
}

export default projectBBox;
