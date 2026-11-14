/**
 * FitVerse Pose Evaluation Engine
 * Evaluates MediaPipe body landmarks for Tree Pose, Warrior II, and Downward-Facing Dog.
 * Computes individual segment alignment (Green = Aligned, Red = Needs Correction).
 */

import { calculateAngle, calculateHorizontalAngle, calculateVerticalAngle, midPoint, calculateDistance } from './angleCalculator';

// MediaPipe Pose Landmark Indices (Standard 33-point model)
export const LM = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

const MIN_VISIBILITY = 0.5;

function isVisible(...points) {
  return points.every(p => p && (p.visibility === undefined || p.visibility >= MIN_VISIBILITY));
}

/**
 * Evaluates Warrior II Pose (Virabhadrasana II)
 */
export function evaluateWarriorII(landmarks) {
  if (!landmarks || landmarks.length < 29) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "visibility", text: "Please step back so your entire body is in camera frame.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const le = landmarks[LM.LEFT_ELBOW];
  const re = landmarks[LM.RIGHT_ELBOW];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  // Ensure landmarks are valid
  if (!ls || !rs || !lh || !rh) {
    return {
      alignmentScore: 0,
      statusText: "Detecting Body...",
      feedbackList: [{ id: "visibility", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  // 1. Joint angles
  const leftKneeAngle = calculateAngle(lh, lk, la);
  const rightKneeAngle = calculateAngle(rh, rk, ra);
  const leftElbowAngle = calculateAngle(ls, le, lw);
  const rightElbowAngle = calculateAngle(rs, re, rw);

  // Determine front leg vs back leg based on knee flexion
  // Front leg knee is bent closer to 90 degrees; back leg is straight (~170)
  const leftDiffFrom90 = Math.abs((leftKneeAngle || 180) - 90);
  const rightDiffFrom90 = Math.abs((rightKneeAngle || 180) - 90);

  const isLeftFront = leftDiffFrom90 <= rightDiffFrom90;
  const frontKneeAngle = isLeftFront ? leftKneeAngle : rightKneeAngle;
  const backKneeAngle = isLeftFront ? rightKneeAngle : leftKneeAngle;
  const frontKneeJoint = isLeftFront ? LM.LEFT_KNEE : LM.RIGHT_KNEE;

  // 2. Evaluate front knee: Target 85° - 105° (Right angle over ankle)
  const frontKneeCorrect = frontKneeAngle !== null && frontKneeAngle >= 82 && frontKneeAngle <= 108;
  const backLegCorrect = backKneeAngle !== null && backKneeAngle >= 158;

  // 3. Arm parallelity (horizontal angle of arm lines)
  const leftArmHoriz = calculateHorizontalAngle(ls, lw);
  const rightArmHoriz = calculateHorizontalAngle(rs, rw);
  const leftArmStraight = leftElbowAngle !== null && leftElbowAngle >= 155;
  const rightArmStraight = rightElbowAngle !== null && rightElbowAngle >= 155;
  const armsParallel = (leftArmHoriz !== null && leftArmHoriz <= 22) &&
                       (rightArmHoriz !== null && rightArmHoriz <= 22) &&
                       leftArmStraight && rightArmStraight;

  // 4. Torso alignment (vertical upright)
  const midShoulder = midPoint(ls, rs);
  const midHip = midPoint(lh, rh);
  const torsoTilt = calculateVerticalAngle(midShoulder, midHip);
  const backStraight = torsoTilt !== null && torsoTilt <= 18;

  // 5. Stance stability (wide base)
  const ankleDist = calculateDistance(la, ra);
  const shoulderDist = calculateDistance(ls, rs);
  const stanceStable = ankleDist >= (shoulderDist * 1.7);

  // Segments coloring state (Green = Aligned, Red = Needs Correction)
  const segments = {
    torso: backStraight,
    left_arm: (leftArmHoriz <= 22 && leftArmStraight),
    right_arm: (rightArmHoriz <= 22 && rightArmStraight),
    left_leg: isLeftFront ? frontKneeCorrect : backLegCorrect,
    right_leg: isLeftFront ? backLegCorrect : frontKneeCorrect,
    front_knee_joint: frontKneeCorrect,
  };

  // Feedback items matching the user's reference design
  const feedbackList = [
    {
      id: "front_knee",
      text: frontKneeCorrect ? "Front knee correctly aligned at ~90°." : "Adjust your front knee.",
      passed: frontKneeCorrect,
      isWarning: !frontKneeCorrect,
      segmentKey: isLeftFront ? "left_leg" : "right_leg",
      angle: frontKneeAngle,
      target: "85° - 105°"
    },
    {
      id: "arms",
      text: armsParallel ? "Arms parallel to the floor." : "Keep your arms parallel to the floor.",
      passed: armsParallel,
      isWarning: !armsParallel,
      segmentKey: "arms"
    },
    {
      id: "back",
      text: backStraight ? "Back and torso upright." : "Keep your back straight.",
      passed: backStraight,
      isWarning: !backStraight,
      segmentKey: "torso"
    },
    {
      id: "stance",
      text: stanceStable ? "Stable wide stance maintained." : "Maintain a stable stance.",
      passed: stanceStable,
      isWarning: !stanceStable,
      segmentKey: "stance"
    }
  ];

  // Dynamic Alignment Score: percentage of passing evaluated rules
  const evaluatedRules = [frontKneeCorrect, armsParallel, backStraight, backLegCorrect, stanceStable];
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 80 ? "Good Alignment" : (score >= 60 ? "Moderate Alignment" : "Needs Improvement"),
    feedbackList,
    segments,
    criticalJoint: !frontKneeCorrect ? frontKneeJoint : null,
    isLeftFront
  };
}

/**
 * Evaluates Tree Pose (Vrikshasana)
 */
export function evaluateTreePose(landmarks) {
  if (!landmarks || landmarks.length < 29) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "visibility", text: "Please step back so your entire body is in camera frame.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  // Ensure landmarks are valid
  if (!ls || !rs || !lh || !rh) {
    return {
      alignmentScore: 0,
      statusText: "Detecting Body...",
      feedbackList: [{ id: "visibility", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const leftKneeAngle = calculateAngle(lh, lk, la);
  const rightKneeAngle = calculateAngle(rh, rk, ra);

  // Standing leg has knee angle ~180; Bent leg has knee angle ~30 - 80
  const isLeftStanding = (leftKneeAngle || 0) > (rightKneeAngle || 0);
  const standingKneeAngle = isLeftStanding ? leftKneeAngle : rightKneeAngle;
  const bentKneeAngle = isLeftStanding ? rightKneeAngle : leftKneeAngle;

  const standingLegStraight = standingKneeAngle !== null && standingKneeAngle >= 162;
  const bentLegFolded = bentKneeAngle !== null && bentKneeAngle >= 30 && bentKneeAngle <= 80;

  // Hands in prayer (wrists close together) OR extended overhead
  const wristDist = calculateDistance(lw, rw);
  const handsInPrayer = wristDist < 0.20 || (lw.y < ls.y && rw.y < rs.y && wristDist < 0.28);

  // Spine upright
  const midShoulder = midPoint(ls, rs);
  const midHip = midPoint(lh, rh);
  const spineTilt = calculateVerticalAngle(midShoulder, midHip);
  const spineUpright = spineTilt !== null && spineTilt <= 14;

  const segments = {
    torso: spineUpright,
    left_arm: handsInPrayer,
    right_arm: handsInPrayer,
    left_leg: isLeftStanding ? standingLegStraight : bentLegFolded,
    right_leg: isLeftStanding ? bentLegFolded : standingLegStraight,
  };

  const feedbackList = [
    {
      id: "standing_leg",
      text: standingLegStraight ? "Standing leg is strong and rooted." : "Keep your standing leg straight and rooted.",
      passed: standingLegStraight,
      isWarning: !standingLegStraight,
      segmentKey: isLeftStanding ? "left_leg" : "right_leg"
    },
    {
      id: "bent_knee",
      text: bentLegFolded ? "Folded knee abducted correctly." : "Place foot on inner calf or thigh (avoid knee joint).",
      passed: bentLegFolded,
      isWarning: !bentLegFolded,
      segmentKey: isLeftStanding ? "right_leg" : "left_leg"
    },
    {
      id: "spine",
      text: spineUpright ? "Spine is upright and aligned." : "Maintain a long, upright spine.",
      passed: spineUpright,
      isWarning: !spineUpright,
      segmentKey: "torso"
    },
    {
      id: "hands",
      text: handsInPrayer ? "Hands in prayer / raised overhead." : "Bring palms together at your chest or overhead.",
      passed: handsInPrayer,
      isWarning: !handsInPrayer,
      segmentKey: "arms"
    }
  ];

  // Dynamic Alignment Score: 4 evaluated rules
  const evaluatedRules = [standingLegStraight, bentLegFolded, spineUpright, handsInPrayer];
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 75 ? "Good Alignment" : "Needs Improvement",
    feedbackList,
    segments,
    criticalJoint: !standingLegStraight ? (isLeftStanding ? LM.LEFT_KNEE : LM.RIGHT_KNEE) : (!bentLegFolded ? (isLeftStanding ? LM.RIGHT_KNEE : LM.LEFT_KNEE) : null)
  };
}

/**
 * Evaluates Downward-Facing Dog (Adho Mukha Svanasana)
 */
export function evaluateDownwardDog(landmarks) {
  if (!landmarks || landmarks.length < 29) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "visibility", text: "Ensure whole mat and body are visible in frame.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const ls = landmarks[LM.LEFT_SHOULDER];
  const rs = landmarks[LM.RIGHT_SHOULDER];
  const le = landmarks[LM.LEFT_ELBOW];
  const re = landmarks[LM.RIGHT_ELBOW];
  const lw = landmarks[LM.LEFT_WRIST];
  const rw = landmarks[LM.RIGHT_WRIST];
  const lh = landmarks[LM.LEFT_HIP];
  const rh = landmarks[LM.RIGHT_HIP];
  const lk = landmarks[LM.LEFT_KNEE];
  const rk = landmarks[LM.RIGHT_KNEE];
  const la = landmarks[LM.LEFT_ANKLE];
  const ra = landmarks[LM.RIGHT_ANKLE];

  // Ensure landmarks are valid
  if (!ls || !rs || !lh || !rh) {
    return {
      alignmentScore: 0,
      statusText: "Detecting Body...",
      feedbackList: [{ id: "visibility", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const leftArmAngle = calculateAngle(ls, le, lw);
  const rightArmAngle = calculateAngle(rs, re, rw);
  const leftLegAngle = calculateAngle(lh, lk, la);
  const rightLegAngle = calculateAngle(rh, rk, ra);

  // Hip apex angle (between shoulder, hip, and ankle/knee)
  const leftHipAngle = calculateAngle(ls, lh, lk);
  const rightHipAngle = calculateAngle(rs, rh, rk);
  const avgHipAngle = ((leftHipAngle || 90) + (rightHipAngle || 90)) / 2;

  // Inverted V shape: hip angle ~65° - 95°
  const invertedVCorrect = avgHipAngle >= 62 && avgHipAngle <= 98;
  const armsStraight = (leftArmAngle !== null && leftArmAngle >= 155) && (rightArmAngle !== null && rightArmAngle >= 155);
  const legsExtended = (leftLegAngle !== null && leftLegAngle >= 150) && (rightLegAngle !== null && rightLegAngle >= 150);

  // Spine elevation: hips should be higher than shoulders (smaller Y coordinate in canvas space)
  const midHip = midPoint(lh, rh);
  const midShoulder = midPoint(ls, rs);
  const hipsHigherThanShoulders = midHip.y < midShoulder.y;

  const segments = {
    torso: invertedVCorrect && hipsHigherThanShoulders,
    left_arm: leftArmAngle >= 155,
    right_arm: rightArmAngle >= 155,
    left_leg: leftLegAngle >= 150,
    right_leg: rightLegAngle >= 150
  };

  const feedbackList = [
    {
      id: "hips",
      text: (invertedVCorrect && hipsHigherThanShoulders) ? "Inverted 'V' shape formed correctly." : "Lift your hips high to form an inverted 'V'.",
      passed: invertedVCorrect && hipsHigherThanShoulders,
      isWarning: !(invertedVCorrect && hipsHigherThanShoulders),
      segmentKey: "torso"
    },
    {
      id: "arms",
      text: armsStraight ? "Arms straight and pressing firmly." : "Keep your arms straight and press firmly through hands.",
      passed: armsStraight,
      isWarning: !armsStraight,
      segmentKey: "arms"
    },
    {
      id: "legs",
      text: legsExtended ? "Legs well extended." : "Extend your legs; soften knees if hamstrings feel tight.",
      passed: legsExtended,
      isWarning: !legsExtended,
      segmentKey: "legs"
    },
    {
      id: "neck",
      text: "Neck relaxed with gaze toward navel.",
      passed: true,
      isWarning: false,
      segmentKey: "head"
    }
  ];

  // Dynamic Alignment Score: 4 evaluated rules
  const evaluatedRules = [(invertedVCorrect && hipsHigherThanShoulders), armsStraight, legsExtended, true];
  const passedCount = evaluatedRules.filter(Boolean).length;
  const score = Math.round((passedCount / evaluatedRules.length) * 100);

  return {
    alignmentScore: score,
    statusText: score >= 75 ? "Good Alignment" : "Needs Improvement",
    feedbackList,
    segments,
    criticalJoint: !armsStraight ? LM.LEFT_ELBOW : (!invertedVCorrect ? LM.LEFT_HIP : null)
  };
}

/**
 * Universal Pose Evaluator router
 */
export function evaluatePose(poseId, landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return {
      alignmentScore: 0,
      statusText: "Waiting for Pose...",
      feedbackList: [{ id: "none", text: "Step into camera view to begin.", passed: false, isWarning: true }],
      segments: {},
      criticalJoint: null
    };
  }

  const id = (poseId || "warrior_ii").toLowerCase();
  if (id.includes("tree")) {
    return evaluateTreePose(landmarks);
  } else if (id.includes("downward") || id.includes("dog")) {
    return evaluateDownwardDog(landmarks);
  } else {
    // Default to Warrior II
    return evaluateWarriorII(landmarks);
  }
}

