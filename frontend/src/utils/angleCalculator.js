/**
 * FitVerse Angle Calculation Engine
 * Accurately computes 2D joint angles and segment inclinations using vector mathematics.
 */

/**
 * Calculates the internal angle (in degrees) at joint B formed by segment AB and segment BC.
 * @param {Object} a - First landmark {x, y, visibility}
 * @param {Object} b - Middle vertex landmark {x, y, visibility}
 * @param {Object} c - Third landmark {x, y, visibility}
 * @returns {number} Angle in degrees [0 - 180]
 */
export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return null;

  // Vectors BA and BC
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (magBA === 0 || magBC === 0) return 0;

  const cosTheta = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  const angleRad = Math.acos(cosTheta);
  return Math.round((angleRad * 180) / Math.PI);
}

/**
 * Calculates segment angle relative to the horizontal plane (0° = perfectly horizontal).
 * Useful for arm parallelity check in Warrior II.
 */
export function calculateHorizontalAngle(p1, p2) {
  if (!p1 || !p2) return null;
  const dy = Math.abs(p2.y - p1.y);
  const dx = Math.abs(p2.x - p1.x);
  const rad = Math.atan2(dy, dx);
  return Math.round((rad * 180) / Math.PI);
}

/**
 * Calculates torso inclination relative to vertical (0° = perfectly vertical).
 * Useful for checking if the spine is upright.
 */
export function calculateVerticalAngle(pTop, pBottom) {
  if (!pTop || !pBottom) return null;
  const dx = Math.abs(pTop.x - pBottom.x);
  const dy = Math.abs(pBottom.y - pTop.y);
  const rad = Math.atan2(dx, dy);
  return Math.round((rad * 180) / Math.PI);
}

/**
 * Calculates Euclidean distance between two landmarks.
 */
export function calculateDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Computes mid-point between two landmarks (e.g. mid-hip or mid-shoulder).
 */
export function midPoint(p1, p2) {
  if (!p1 || !p2) return p1 || p2;
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    visibility: Math.min(p1.visibility ?? 1, p2.visibility ?? 1)
  };
}

