export function getMiddlePointOfBezierCurve (x1, y1, x2, y2, d) {
    if (x1 === x2) {
        return [
            [x1 - d, (y1 + y2) / 2],
            [x1 + d, (y1 + y2) / 2]
        ];
    }

    if (y1 === y2) {
        return [
            [(x1 + x2) / 2, y1 - d],
            [(x1 + x2) / 2, y1 + d]
        ];
    }

    const a = x2 - x1;
    const b = y2 - y1;
    const xc = (x1 + x2) / 2;
    const yc = (y1 + y2) / 2;
    const r = b / a;
    const sqrtPart = d / Math.sqrt(Math.pow(r, 2) + 1);
    return [-sqrtPart + yc, sqrtPart + yc].map(v => [xc + r * yc - r * v, v])
}

// p1 p2 p3
// p1p2 x p1p3
function cross(x1, y1, x2, y2, x3, y3) {
    return x1 * y2 + x3 * y1 + x2 * y3 - x3 * y2 - x2 * y1 - x1 * y3;
}

// 大于0在同侧；小于0在不同侧
export function checkSameSide(x1, y1, x2, y2, x3, y3, x4, y4) {
    return cross(x1, y1, x2, y2, x3, y3) * cross(x1, y1, x2, y2, x4, y4);
}

// 1. 叉积=0
// 2. 在矩形内
export function onSegement(p1, p2, q) {
    const maxX = p1[0] > p2[0] ? p1[0] : p2[0];
    const maxY = p1[1] > p2[1] ? p1[1] : p2[1];
    const minX = p1[0] > p2[0] ? p2[0] : p1[0];
    const minY = p1[1] > p2[1] ? p2[1] : p1[1];
    // 叉积为0表示三点共线，但是js中精度可能有点问题，这里放宽条件为0.1
    return cross(...p1, ...p2, ...q) < 0.1 && (q[0] >= minX && q[0] <= maxX) && (q[1] >= minY && q[1] <= maxY);
}

export function getControlPointOfBezierCurve (p0, p1, p2) {
    const t = 0.5;
    const mt = (1 - t);
    const tt = Math.pow(t, 2);
    const mtt = Math.pow(mt, 2);
    const d = 2 * t * mt;
    return [
        (p1[0] - tt * p2[0] - mtt * p0[0]) / d,
        (p1[1] - tt * p2[1] - mtt * p0[1]) / d,
    ];
}

export function rotatePoint(x, y, dx, dy, angle) {
    const rr = Math.PI / 180 * angle;
    const xx = (x - dx) * Math.cos(rr) - (y - dy) * Math.sin(rr) + dx;
    const yy = (y - dy) * Math.cos(rr) + (x - dx) * Math.sin(rr) + dy;
    return [xx, yy];
}

/**
 * 求圆和直线之间的交点
 * 直线方程：y = kx + b
 * 圆的方程：(x - m)² + (y - n)² = r²
 * x1, y1 = 线坐标1, x2, y2 = 线坐标2, m, n = 圆坐标, r = 半径
 */
export function getIntersectPointBetweenCircleAndLine (x1, y1, x2, y2, m, n, r) {
    const a = Math.pow(x2 - x1, 2) + Math.pow(y2- y1, 2);
    const b = 2 * ((x2 - x1) * (x1 - m) + (y2 - y1) * (y1 - n));
    const c = m * m + n * n + x1 * x1 + y1 * y1 - 2 * (m * x1 + n * y1) - r * r;
    const s = b * b - 4 * a * c;
    if (s < 0) {
        return null;
    } else if (s === 0) {
        const u = -b / (2 * a);
        return [x1 + u * (x2 - x1), y1 + u * (y2 - y1)];
    } else {
        const u1 = (-b + Math.sqrt(s)) / (2 * a);
        const u2 = (-b - Math.sqrt(s)) / (2 * a);
        return [
            [x1 + u1 * (x2 - x1), y1 + u1 * (y2 - y1)],
            [x1 + u2 * (x2 - x1), y1 + u2 * (y2 - y1)],
        ];
    }
}
