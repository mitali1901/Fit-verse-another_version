/**
 * FitVerse Correction Renderer
 * Renders live skeleton overlay on HTML5 Canvas:
 * - GREEN lines (#22C55E / #4ADE80) for aligned segments
 * - RED lines (#EF4444 / #F87171) for segments requiring correction
 * - Joint highlight nodes with glowing radius and angle arcs
 */

import { LM } from './poseEvaluation';

const GREEN_COLOR = "#22C55E";
const RED_COLOR = "#EF4444";
const GREEN_GLOW = "rgba(34, 197, 94, 0.45)";
const RED_GLOW = "rgba(239, 68, 68, 0.45)";
const NODE_FILL = "#FFFFFF";

// MediaPipe Pose connections
const CONNECTIONS = [
  // Upper body / Arms
  { start: LM.LEFT_SHOULDER, end: LM.RIGHT_SHOULDER, segment: "torso" },
  { start: LM.LEFT_SHOULDER, end: LM.LEFT_ELBOW, segment: "left_arm" },
  { start: LM.LEFT_ELBOW, end: LM.LEFT_WRIST, segment: "left_arm" },
  { start: LM.RIGHT_SHOULDER, end: LM.RIGHT_ELBOW, segment: "right_arm" },
  { start: LM.RIGHT_ELBOW, end: LM.RIGHT_WRIST, segment: "right_arm" },
  
  // Torso box
  { start: LM.LEFT_SHOULDER, end: LM.LEFT_HIP, segment: "torso" },
  { start: LM.RIGHT_SHOULDER, end: LM.RIGHT_HIP, segment: "torso" },
  { start: LM.LEFT_HIP, end: LM.RIGHT_HIP, segment: "torso" },

  // Lower body / Legs
  { start: LM.LEFT_HIP, end: LM.LEFT_KNEE, segment: "left_leg" },
  { start: LM.LEFT_KNEE, end: LM.LEFT_ANKLE, segment: "left_leg" },
  { start: LM.LEFT_ANKLE, end: LM.LEFT_HEEL, segment: "left_leg" },
  { start: LM.LEFT_HEEL, end: LM.LEFT_FOOT_INDEX, segment: "left_leg" },

  { start: LM.RIGHT_HIP, end: LM.RIGHT_KNEE, segment: "right_leg" },
  { start: LM.RIGHT_KNEE, end: LM.RIGHT_ANKLE, segment: "right_leg" },
  { start: LM.RIGHT_ANKLE, end: LM.RIGHT_HEEL, segment: "right_leg" },
  { start: LM.RIGHT_HEEL, end: LM.RIGHT_FOOT_INDEX, segment: "right_leg" }
];

const IMPORTANT_JOINTS = [
  LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
  LM.LEFT_ELBOW, LM.RIGHT_ELBOW,
  LM.LEFT_WRIST, LM.RIGHT_WRIST,
  LM.LEFT_HIP, LM.RIGHT_HIP,
  LM.LEFT_KNEE, LM.RIGHT_KNEE,
  LM.LEFT_ANKLE, LM.RIGHT_ANKLE
];

/**
 * Draws the complete pose skeleton with color-coded alignment lines and joint highlights.
 */
export function drawPoseSkeleton(ctx, landmarks, evaluation, width, height) {
  if (!ctx || !landmarks || landmarks.length === 0) return;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const segments = evaluation?.segments || {};
  const criticalJoint = evaluation?.criticalJoint;
  const alignmentScore = evaluation?.alignmentScore || 0;

  // If not in pose (empty segments or 0 score), default all to red
  const notInPose = Object.keys(segments).length === 0 || alignmentScore === 0;

  // Direct 1:1 canvas mapping for normalized landmarks
  const toX = (normX) => normX * width;
  const toY = (normY) => normY * height;

  // 1. Draw Connection Lines
  CONNECTIONS.forEach(({ start, end, segment }) => {
    const p1 = landmarks[start];
    const p2 = landmarks[end];

    if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.35) || (p2.visibility && p2.visibility < 0.35)) {
      return;
    }

    // Force red if not in pose, otherwise use segment alignment
    const isAligned = notInPose ? false : (segments[segment] !== false);
    const lineColor = isAligned ? GREEN_COLOR : RED_COLOR;
    const glowColor = isAligned ? GREEN_GLOW : RED_GLOW;

    const x1 = toX(p1.x);
    const y1 = toY(p1.y);
    const x2 = toX(p2.x);
    const y2 = toY(p2.y);

    // Glowing outer stroke
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = glowColor;
    ctx.lineCap = "round";
    ctx.stroke();

    // Solid core line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = lineColor;
    ctx.lineCap = "round";
    ctx.stroke();
  });

  // 2. Highlight Critical Correction Joint (e.g. front knee angle in Warrior II)
  if (criticalJoint !== null && landmarks[criticalJoint]) {
    const cj = landmarks[criticalJoint];
    const cx = toX(cj.x);
    const cy = toY(cj.y);

    // Outer pulsating dashed red ring
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = RED_COLOR;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Glowing red backdrop
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
    ctx.fill();
  }

  // 3. Draw Joint Nodes
  IMPORTANT_JOINTS.forEach(jointIdx => {
    const pt = landmarks[jointIdx];
    if (!pt || (pt.visibility && pt.visibility < 0.35)) return;

    const x = toX(pt.x);
    const y = toY(pt.y);

    // Determine joint color - force red if not in pose
    let isJointAligned = !notInPose; // Default to aligned, unless not in pose
    if (!notInPose) {
      if (jointIdx === LM.LEFT_ELBOW || jointIdx === LM.LEFT_WRIST) {
        isJointAligned = segments["left_arm"] !== false;
      } else if (jointIdx === LM.RIGHT_ELBOW || jointIdx === LM.RIGHT_WRIST) {
        isJointAligned = segments["right_arm"] !== false;
      } else if (jointIdx === LM.LEFT_KNEE || jointIdx === LM.LEFT_ANKLE) {
        isJointAligned = segments["left_leg"] !== false;
      } else if (jointIdx === LM.RIGHT_KNEE || jointIdx === LM.RIGHT_ANKLE) {
        isJointAligned = segments["right_leg"] !== false;
      } else if (jointIdx === LM.LEFT_SHOULDER || jointIdx === LM.RIGHT_SHOULDER || jointIdx === LM.LEFT_HIP || jointIdx === LM.RIGHT_HIP) {
        isJointAligned = segments["torso"] !== false;
      }
    }

    if (jointIdx === criticalJoint) {
      isJointAligned = false;
    }

    const ringColor = isJointAligned ? GREEN_COLOR : RED_COLOR;

    // Outer node circle
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, 2 * Math.PI);
    ctx.fillStyle = ringColor;
    ctx.fill();

    // Inner white dot
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = NODE_FILL;
    ctx.fill();
  });

  ctx.restore();
}

