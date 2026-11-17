export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface StrokeGeometry {
  start: Point2D;
  end: Point2D;
  centroid: Point2D;
  bbox: BoundingBox;
  points: Point2D[];
}

export interface StrokeValidationResult {
  valid: boolean;
  score: number;
  feedback: string;
}

export type StrokePracticeMode = "trace" | "recall" | "free";

/**
 * Parses a KanjiVG SVG path `d` attribute into sampled 2D points in the 0..109 coordinate space.
 * Pure TypeScript — zero DOM/React dependencies.
 */
export function parseSvgPathSamples(d: string): Point2D[] {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)/g);
  if (!tokens || tokens.length === 0) {
    return [{ x: 54.5, y: 54.5 }];
  }

  const points: Point2D[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let idx = 0;
  let cmd = "M";

  const pushSampledSegment = (fromX: number, fromY: number, toX: number, toY: number, steps = 5) => {
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      points.push({
        x: fromX + (toX - fromX) * t,
        y: fromY + (toY - fromY) * t,
      });
    }
  };

  while (idx < tokens.length) {
    const token = tokens[idx];
    if (/^[a-zA-Z]$/.test(token)) {
      cmd = token;
      idx += 1;
      if (cmd === "Z" || cmd === "z") {
        continue;
      }
    }

    const readNum = (): number => {
      const val = Number.parseFloat(tokens[idx] ?? "0");
      idx += 1;
      return Number.isFinite(val) ? val : 0;
    };

    switch (cmd) {
      case "M": {
        cursorX = readNum();
        cursorY = readNum();
        points.push({ x: cursorX, y: cursorY });
        cmd = "L";
        break;
      }
      case "m": {
        cursorX += readNum();
        cursorY += readNum();
        points.push({ x: cursorX, y: cursorY });
        cmd = "l";
        break;
      }
      case "L": {
        const nextX = readNum();
        const nextY = readNum();
        pushSampledSegment(cursorX, cursorY, nextX, nextY);
        cursorX = nextX;
        cursorY = nextY;
        break;
      }
      case "l": {
        const nextX = cursorX + readNum();
        const nextY = cursorY + readNum();
        pushSampledSegment(cursorX, cursorY, nextX, nextY);
        cursorX = nextX;
        cursorY = nextY;
        break;
      }
      case "H": {
        const nextX = readNum();
        pushSampledSegment(cursorX, cursorY, nextX, cursorY);
        cursorX = nextX;
        break;
      }
      case "h": {
        const nextX = cursorX + readNum();
        pushSampledSegment(cursorX, cursorY, nextX, cursorY);
        cursorX = nextX;
        break;
      }
      case "V": {
        const nextY = readNum();
        pushSampledSegment(cursorX, cursorY, cursorX, nextY);
        cursorY = nextY;
        break;
      }
      case "v": {
        const nextY = cursorY + readNum();
        pushSampledSegment(cursorX, cursorY, cursorX, nextY);
        cursorY = nextY;
        break;
      }
      case "C": {
        const x1 = readNum();
        const y1 = readNum();
        const x2 = readNum();
        const y2 = readNum();
        const endX = readNum();
        const endY = readNum();
        for (let s = 1; s <= 6; s += 1) {
          const t = s / 6;
          const u = 1 - t;
          const px =
            u * u * u * cursorX +
            3 * u * u * t * x1 +
            3 * u * t * t * x2 +
            t * t * t * endX;
          const py =
            u * u * u * cursorY +
            3 * u * u * t * y1 +
            3 * u * t * t * y2 +
            t * t * t * endY;
          points.push({ x: px, y: py });
        }
        cursorX = endX;
        cursorY = endY;
        break;
      }
      case "c": {
        const x1 = cursorX + readNum();
        const y1 = cursorY + readNum();
        const x2 = cursorX + readNum();
        const y2 = cursorY + readNum();
        const endX = cursorX + readNum();
        const endY = cursorY + readNum();
        for (let s = 1; s <= 6; s += 1) {
          const t = s / 6;
          const u = 1 - t;
          const px =
            u * u * u * cursorX +
            3 * u * u * t * x1 +
            3 * u * t * t * x2 +
            t * t * t * endX;
          const py =
            u * u * u * cursorY +
            3 * u * u * t * y1 +
            3 * u * t * t * y2 +
            t * t * t * endY;
          points.push({ x: px, y: py });
        }
        cursorX = endX;
        cursorY = endY;
        break;
      }
      case "S": {
        const x2 = readNum();
        const y2 = readNum();
        const endX = readNum();
        const endY = readNum();
        pushSampledSegment(cursorX, cursorY, (x2 + endX) / 2, (y2 + endY) / 2, 3);
        pushSampledSegment((x2 + endX) / 2, (y2 + endY) / 2, endX, endY, 3);
        cursorX = endX;
        cursorY = endY;
        break;
      }
      case "s": {
        const x2 = cursorX + readNum();
        const y2 = cursorY + readNum();
        const endX = cursorX + readNum();
        const endY = cursorY + readNum();
        pushSampledSegment(cursorX, cursorY, (x2 + endX) / 2, (y2 + endY) / 2, 3);
        pushSampledSegment((x2 + endX) / 2, (y2 + endY) / 2, endX, endY, 3);
        cursorX = endX;
        cursorY = endY;
        break;
      }
      default: {
        idx += 1;
        break;
      }
    }
  }

  return points.length > 0 ? points : [{ x: 54.5, y: 54.5 }];
}

export function computePointsGeometry(points: Point2D[]): StrokeGeometry {
  if (points.length === 0) {
    const center = { x: 54.5, y: 54.5 };
    return {
      start: center,
      end: center,
      centroid: center,
      bbox: { minX: 54.5, minY: 54.5, maxX: 54.5, maxY: 54.5 },
      points: [center],
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let sumX = 0;
  let sumY = 0;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
    sumX += pt.x;
    sumY += pt.y;
  }

  return {
    start: points[0],
    end: points[points.length - 1],
    centroid: {
      x: sumX / points.length,
      y: sumY / points.length,
    },
    bbox: { minX, minY, maxX, maxY },
    points,
  };
}

export function getStrokeGeometry(d: string): StrokeGeometry {
  return computePointsGeometry(parseSvgPathSamples(d));
}

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Validates a user's drawn stroke against an expected KanjiVG SVG path `d` in the 0..109 space.
 */
export function validateDrawnStroke(
  userPoints: Point2D[],
  expectedPathD: string,
  toleranceRadius = 28
): StrokeValidationResult {
  if (userPoints.length < 2) {
    return {
      valid: false,
      score: 0,
      feedback: "Draw the full stroke across the guide.",
    };
  }

  const userGeo = computePointsGeometry(userPoints);
  const expectedGeo = getStrokeGeometry(expectedPathD);

  // Measure path travel so tiny accidental taps don't count as strokes
  let userLength = 0;
  for (let i = 1; i < userPoints.length; i += 1) {
    userLength += distance(userPoints[i - 1], userPoints[i]);
  }
  if (userLength < 4) {
    return {
      valid: false,
      score: 0,
      feedback: "Stroke is too short — trace along the guide path.",
    };
  }

  // Check proximity of user points to the expected stroke path and bounding box
  let closePoints = 0;
  for (const uPt of userPoints) {
    let minDist = Number.POSITIVE_INFINITY;
    for (const ePt of expectedGeo.points) {
      const d = distance(uPt, ePt);
      if (d < minDist) minDist = d;
    }
    if (minDist <= toleranceRadius) {
      closePoints += 1;
    }
  }

  const coverageRatio = closePoints / userPoints.length;
  const centroidDist = distance(userGeo.centroid, expectedGeo.centroid);
  const startDist = distance(userGeo.start, expectedGeo.start);

  const bboxIntersects =
    userGeo.bbox.maxX + toleranceRadius >= expectedGeo.bbox.minX &&
    userGeo.bbox.minX - toleranceRadius <= expectedGeo.bbox.maxX &&
    userGeo.bbox.maxY + toleranceRadius >= expectedGeo.bbox.minY &&
    userGeo.bbox.minY - toleranceRadius <= expectedGeo.bbox.maxY;

  const isValid =
    bboxIntersects &&
    (coverageRatio >= 0.45 ||
      centroidDist <= toleranceRadius * 1.15 ||
      (startDist <= toleranceRadius * 1.15 && coverageRatio >= 0.3));

  const score = Math.round(Math.min(1, coverageRatio) * 100);

  return {
    valid: isValid,
    score,
    feedback: isValid
      ? "Great stroke!"
      : "Try starting near the numbered marker and following the stroke direction.",
  };
}

