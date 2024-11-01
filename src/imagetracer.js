class Point {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}
class DPoint {
    constructor(x, y, direction){
        this.x = x;
        this.y = y;
        this.direction = direction;
    }
}
class PathData {
    constructor(segments, isHole, holeChildren, ignore){
        this.segments = segments;
        this.isHole = isHole;
        this.holeChildren = holeChildren;
        this.ignore = ignore;
    }
}
const defaultOptions = {
    filterHoles: 0,
    enhanceCorners: true,
    lineTolerance: 1,
    splineTolerance: 1,
    mergePaths: true,
    precision: 1,
    strokeWidth: 1
};
function detectEdges(indexedArray, width, height, palette) {
    const layers = new Array(palette.length);
    for(let k = 0; k < palette.length; k++){
        layers[k] = new Uint8Array(width * height);
    }
    for(let j = 1; j < height - 1; j++){
        const currColumn = j * width;
        const prevColumn = currColumn - width;
        const nextColumn = currColumn + width;
        for(let i = 1; i < width - 1; i++){
            const val = indexedArray[currColumn + i];
            const iPrev = i - 1;
            const iNext = i + 1;
            const n1 = indexedArray[prevColumn + iPrev] === val ? 1 : 0;
            const n2 = indexedArray[prevColumn + i] === val ? 2 : 0;
            const n3 = indexedArray[prevColumn + iNext] === val ? 2 : 0;
            const n4 = indexedArray[currColumn + iPrev] === val ? 8 : 0;
            const n5 = indexedArray[currColumn + iNext] === val ? 1 : 0;
            const n6 = indexedArray[nextColumn + iPrev] === val ? 8 : 0;
            const n7 = indexedArray[nextColumn + i] === val ? 1 : 0;
            const n8 = indexedArray[nextColumn + iNext] === val ? 4 : 0;
            const layer = layers[val];
            layer[nextColumn + iNext] = 1 + n5 * 2 + n8 + n7 * 8;
            if (n4 === 0) layer[nextColumn + i] = 2 + n7 * 4 + n6;
            if (n2 === 0) layer[currColumn + iNext] = n3 + n5 * 4 + 8;
            if (n1 === 0) layer[currColumn + i] = n2 + 4 + n4;
        }
    }
    return layers;
}
function createBorderedInt16Array(uint8, width, height) {
    const newWidth = width + 2;
    const newHeight = height + 2;
    const size = newWidth * newHeight;
    const bordered = new Int16Array(size);
    for(let j = 0; j < height; j++){
        const yFrom = j * width;
        const yTo = (j + 1) * newWidth;
        for(let i = 0; i < width; i++){
            bordered[yTo + i + 1] = uint8[yFrom + i];
        }
    }
    for(let i = 0; i < newHeight; i++){
        const y = i * newWidth;
        bordered[y] = -1;
        bordered[y + width + 1] = -1;
    }
    const bottom = size - newWidth;
    for(let j = 1; j < width + 1; j++){
        bordered[j] = -1;
        bordered[bottom + j] = -1;
    }
    return bordered;
}
class Path {
    points = [];
    holeChildren = [];
    ignore = false;
    constructor(px, py, isHole){
        this.boundingBox = [
            px,
            py,
            px,
            py
        ];
        this.isHole = isHole;
    }
}
const lookupTables = [
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ],
    [
        [
            0,
            1,
            0,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            2,
            -1,
            0
        ]
    ],
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            1,
            0,
            -1
        ],
        [
            0,
            0,
            1,
            0
        ]
    ],
    [
        [
            0,
            0,
            1,
            0
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            2,
            -1,
            0
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ],
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            0,
            1,
            0
        ],
        [
            0,
            3,
            0,
            1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ],
    [
        [
            13,
            3,
            0,
            1
        ],
        [
            13,
            2,
            -1,
            0
        ],
        [
            7,
            1,
            0,
            -1
        ],
        [
            7,
            0,
            1,
            0
        ]
    ],
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            1,
            0,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            3,
            0,
            1
        ]
    ],
    [
        [
            0,
            3,
            0,
            1
        ],
        [
            0,
            2,
            -1,
            0
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ],
    [
        [
            0,
            3,
            0,
            1
        ],
        [
            0,
            2,
            -1,
            0
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ],
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            1,
            0,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            3,
            0,
            1
        ]
    ],
    [
        [
            11,
            1,
            0,
            -1
        ],
        [
            14,
            0,
            1,
            0
        ],
        [
            14,
            3,
            0,
            1
        ],
        [
            11,
            2,
            -1,
            0
        ]
    ],
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            0,
            1,
            0
        ],
        [
            0,
            3,
            0,
            1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ],
    [
        [
            0,
            0,
            1,
            0
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            2,
            -1,
            0
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ],
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            1,
            0,
            -1
        ],
        [
            0,
            0,
            1,
            0
        ]
    ],
    [
        [
            0,
            1,
            0,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            0,
            2,
            -1,
            0
        ]
    ],
    [
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ],
        [
            -1,
            -1,
            -1,
            -1
        ]
    ]
];
function scanPaths(arr, width, height) {
    const paths = [];
    for(let j = 0; j < height; j++){
        const y = j * width;
        for(let i = 0; i < width; i++){
            const index = y + i;
            const type = arr[index];
            if (type === 4 || type === 11) {
                const path = scanPath(arr, i, j, width);
                if (path) {
                    paths.push(path);
                    updateParent(paths, path);
                }
            }
        }
    }
    return paths;
}
function scanPath(arr, x, y, width) {
    let index = y * width + x;
    const isHole = arr[index] === 11;
    const path = new Path(x, y, isHole);
    let direction = 1;
    while(true){
        const nx = x - 1;
        const ny = y - 1;
        const point = new Point(nx, ny);
        path.points.push(point);
        updateBoundingBox(path.boundingBox, nx, ny);
        const lookup = lookupTables[arr[index]][direction];
        arr[index] = lookup[0];
        direction = lookup[1];
        x += lookup[2];
        y += lookup[3];
        index = y * width + x;
        if (isClosePath(x, y, path.points[0])) {
            return path;
        }
    }
}
function updateBoundingBox(boundingBox, x, y) {
    if (x < boundingBox[0]) boundingBox[0] = x;
    if (x > boundingBox[2]) boundingBox[2] = x;
    if (y < boundingBox[1]) boundingBox[1] = y;
    if (y > boundingBox[3]) boundingBox[3] = y;
}
function isClosePath(x, y, startPoint) {
    return x - 1 === startPoint.x && y - 1 === startPoint.y;
}
function containsBoundingBox(parentBBox, childBBox) {
    if (parentBBox[0] > childBBox[0]) return false;
    if (parentBBox[1] > childBBox[1]) return false;
    if (parentBBox[2] < childBBox[2]) return false;
    if (parentBBox[3] < childBBox[3]) return false;
    return true;
}
function isPointInPolygon(point, polygon) {
    let isInside = false;
    const numPoints = polygon.length;
    const { x, y } = point;
    for(let i = 0, j = numPoints - 1; i < numPoints; j = i++){
        const p1 = polygon[i];
        const p2 = polygon[j];
        const x1 = p1.x;
        const y1 = p1.y;
        const x2 = p2.x;
        const y2 = p2.y;
        const intersect = y1 > y !== y2 > y && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1;
        if (intersect) isInside = !isInside;
    }
    return isInside;
}
function updateParent(paths, path) {
    if (!path.isHole) return;
    const pathIndex = paths.length - 1;
    let parentIndex = 0;
    for(let i = 0; i < pathIndex; i++){
        const parentPath = paths[i];
        const currBBox = path.boundingBox;
        let parentBBox = parentPath.boundingBox;
        if (!parentPath.isHole && containsBoundingBox(parentBBox, currBBox) && isPointInPolygon(path.points[0], parentPath.points)) {
            parentIndex = i;
            parentBBox = parentPath.boundingBox;
        }
    }
    paths[parentIndex].holeChildren.push(pathIndex);
}
function filterHoles(indexedImage, width, layeredPaths, options) {
    const { filterHoles } = options;
    if (filterHoles <= 0) return;
    for(let i = 0; i < layeredPaths.length; i++){
        const holedPaths = layeredPaths[i];
        for(let j = 0; j < holedPaths.length; j++){
            const holedPath = holedPaths[j];
            if (!holedPath.isHole) continue;
            if (filterHoles < holedPath.points.length) continue;
            holedPath.ignore = true;
            const holedBoundingBox = holedPath.boundingBox;
            const indexes = getColorIndexes(indexedImage, width, holedPath);
            for(let k = 0; k < indexes.length; k++){
                const nonHoledPaths = layeredPaths[indexes[k]];
                for(let m = 0; m < nonHoledPaths.length; m++){
                    const nonHoledPath = nonHoledPaths[m];
                    if (filterHoles < nonHoledPath.points.length) continue;
                    const nonHoledBoundingBox = nonHoledPath.boundingBox;
                    if (containsBoundingBox(holedBoundingBox, nonHoledBoundingBox)) {
                        nonHoledPath.ignore = true;
                    }
                }
            }
        }
    }
}
function createMask(path, width, height, left, top) {
    function setBit(x, y) {
        x = x - left + 1;
        y = y - top + 1;
        mask[y * width + x] = 1;
    }
    const mask = new Uint8Array(width * height);
    const points = path.points;
    let prev = points[0];
    for(let i = 1; i <= points.length; i++){
        const curr = points[i % points.length];
        if (prev.x === curr.x) {
            if (prev.y < curr.y) {
                setBit(curr.x - 1, prev.y);
            } else {
                setBit(curr.x, prev.y - 1);
            }
        } else {
            if (prev.x < curr.x) {
                setBit(curr.x - 1, curr.y);
            } else {
                setBit(prev.x - 1, curr.y - 1);
            }
        }
        prev = curr;
    }
    return mask;
}
function floodFill(mask, width, height, startX, startY) {
    const startIndex = startY * width + startX;
    if (mask[startIndex] > 0) return;
    const stack = [
        [
            startX,
            startY
        ]
    ];
    while(stack.length > 0){
        const [x, y] = stack.pop();
        if (x < 0) continue;
        if (width <= x) continue;
        if (y < 0) continue;
        if (height <= y) continue;
        const index = y * width + x;
        if (1 <= mask[index]) continue;
        mask[index] = 255;
        stack.push([
            x + 1,
            y
        ]);
        stack.push([
            x - 1,
            y
        ]);
        stack.push([
            x,
            y + 1
        ]);
        stack.push([
            x,
            y - 1
        ]);
    }
}
function getColorIndexesFromMask(indexedImage, width, mask, maskWidth, maskHeight, path) {
    const indexes = new Set();
    const boundingBox = path.boundingBox;
    const left = boundingBox[0] - 1;
    const top = boundingBox[1] - 1;
    for(let j = 1; j < maskHeight - 1; j++){
        for(let i = 1; i < maskWidth - 1; i++){
            if (mask[j * maskWidth + i] < 255) {
                const index = indexedImage[(top + j) * width + left + i];
                indexes.add(index);
            }
        }
    }
    return Array.from(indexes);
}
function getColorIndexes(indexedImage, width, holedPath) {
    if (holedPath.points.length < 12) {
        const { x, y } = holedPath.points[0];
        const index = indexedImage[y * width + x];
        return [
            index
        ];
    } else {
        const [left, top, right, bottom] = holedPath.boundingBox;
        const maskWidth = right - left + 2;
        const maskHeight = bottom - top + 2;
        const mask = createMask(holedPath, maskWidth, maskHeight, left, top);
        floodFill(mask, maskWidth, maskHeight, 0, 0);
        const indexes = getColorIndexesFromMask(indexedImage, width, mask, maskWidth, maskHeight, holedPath);
        return indexes;
    }
}
function smoothPaths(paths, options = defaultOptions) {
    const result = new Array(paths.length);
    for(let i = 0; i < paths.length; i++){
        const newPoints = [];
        result[i] = newPoints;
        const points = paths[i].points;
        const numPoints = points.length;
        for(let j = 0; j < numPoints; j++){
            const point = points[j];
            const { x, y } = point;
            const n1 = points[(j + 1) % numPoints];
            const n2 = points[(j + 2) % numPoints];
            const x1 = n1.x;
            const y1 = n1.y;
            const x01 = (x + x1) / 2;
            const y01 = (y + y1) / 2;
            if (options.enhanceCorners) {
                const k = j + numPoints;
                const p1 = points[(k - 1) % numPoints];
                const p2 = points[(k - 2) % numPoints];
                const nearbyPoints = [
                    p2,
                    p1,
                    point,
                    n1,
                    n2
                ];
                if (isCorner(nearbyPoints)) {
                    if (j > 0) {
                        const lastPoint = newPoints.at(-1);
                        lastPoint.direction = getDirection(lastPoint.x, lastPoint.y, x, y);
                    }
                    const direction = getDirection(x, y, x01, y01);
                    const newPoint = new DPoint(x, y, direction);
                    newPoints.push(newPoint);
                }
            }
            const x2 = n2.x;
            const y2 = n2.y;
            const x12 = (x1 + x2) / 2;
            const y12 = (y1 + y2) / 2;
            const direction = getDirection(x01, y01, x12, y12);
            const newPoint = new DPoint(x01, y01, direction);
            newPoints.push(newPoint);
        }
    }
    return result;
}
function isCorner(points) {
    const [p1, p2, p3, p4, p5] = points;
    const x3 = p3.x;
    const y3 = p3.y;
    return x3 === p1.x && x3 === p2.x && y3 === p4.y && y3 === p5.y || y3 === p1.y && y3 === p2.y && x3 === p4.x && x3 === p5.x;
}
function getDirection(x1, y1, x2, y2) {
    if (x1 < x2) {
        if (y1 < y2) return 1;
        if (y1 > y2) return 7;
        return 0;
    } else if (x1 > x2) {
        if (y1 < y2) return 3;
        if (y1 > y2) return 5;
        return 4;
    } else {
        if (y1 < y2) return 2;
        if (y1 > y2) return 6;
        return 8;
    }
}
class FitStatus {
    constructor(status, errorPos, maxError){
        this.status = status;
        this.errorPos = errorPos;
        this.maxError = maxError;
    }
}
function trace(points, options = defaultOptions) {
    const result = [];
    let i = 0;
    while(i < points.length){
        const sequenceEnd = findSequenceEnd(points, i);
        result.push(...fit(points, i, sequenceEnd, options));
        i = sequenceEnd > 0 ? sequenceEnd : points.length;
    }
    return result;
}
function findSequenceEnd(points, startIndex) {
    const direction1 = points[startIndex].direction;
    let direction2 = -1;
    let i;
    for(i = startIndex + 1; i < points.length; i++){
        const direction = points[i].direction;
        if (direction === direction1) continue;
        if (direction2 === -1) {
            direction2 = direction;
        } else if (direction !== direction2) {
            break;
        }
    }
    return i >= points.length - 1 ? 0 : i;
}
function fit(points, start, end, options = defaultOptions) {
    const pointsLength = points.length;
    if (end > pointsLength || end < 0) return [];
    const segmentLength = (end - start + pointsLength) % pointsLength;
    const startPoint = points[start];
    const endPoint = points[end];
    const isStraightLine = checkStraightLine(points, start, end, segmentLength, options.lineTolerance);
    if (isStraightLine.status) return svgStraightLine(startPoint, endPoint);
    const fitPos = isStraightLine.errorPos;
    const controlPoint = calculateControlPoint(points, start, end, fitPos, segmentLength);
    const isSpline = checkSpline(points, start, fitPos, end, controlPoint, segmentLength, options.splineTolerance);
    if (isSpline.status) return svgSpline(startPoint, controlPoint, endPoint);
    const splitPos = fitPos;
    const segments = fit(points, start, splitPos, options);
    segments.push(...fit(points, splitPos, end, options));
    return segments;
}
function svgStraightLine(startPoint, endPoint) {
    return [
        {
            type: "L",
            x1: startPoint.x,
            y1: startPoint.y,
            x2: endPoint.x,
            y2: endPoint.y
        }
    ];
}
function svgSpline(startPoint, controlPoint, endPoint) {
    return [
        {
            type: "Q",
            x1: startPoint.x,
            y1: startPoint.y,
            x2: controlPoint.x,
            y2: controlPoint.y,
            x3: endPoint.x,
            y3: endPoint.y
        }
    ];
}
function checkStraightLine(points, start, end, segmentLength, lineTolerance) {
    const pointsLength = points.length;
    const startPoint = points[start];
    const endPoint = points[end];
    const vx = (endPoint.x - startPoint.x) / segmentLength;
    const vy = (endPoint.y - startPoint.y) / segmentLength;
    let i = (start + 1) % pointsLength;
    let status = true;
    let errorPos = start;
    let maxError = 0;
    while(i !== end){
        const point = points[i];
        const pl = (i - start + pointsLength) % pointsLength;
        const px = startPoint.x + vx * pl;
        const py = startPoint.y + vy * pl;
        const distance = (point.x - px) ** 2 + (point.y - py) ** 2;
        if (distance > lineTolerance) status = false;
        if (distance > maxError) {
            errorPos = i;
            maxError = distance;
        }
        i = (i + 1) % pointsLength;
    }
    return new FitStatus(status, errorPos, maxError);
}
function calculateControlPoint(points, start, end, fitPos, segmentLength) {
    const t = (fitPos - start) / segmentLength;
    const u = 1 - t;
    const t1 = u ** 2;
    const t2 = 2 * u * t;
    const t3 = t ** 2;
    const startPoint = points[start];
    const fitPoint = points[fitPos];
    const endPoint = points[end];
    const x = (t1 * startPoint.x + t3 * endPoint.x - fitPoint.x) / -t2;
    const y = (t1 * startPoint.y + t3 * endPoint.y - fitPoint.y) / -t2;
    return new Point(x, y);
}
function checkSpline(points, start, errorPos, end, controlPoint, segmentLength, splineTolerance) {
    const pointsLength = points.length;
    const startPoint = points[start];
    const endPoint = points[end];
    let i = start + 1;
    let status = true;
    let maxError = 0;
    while(i !== end){
        const point = points[i];
        const t = (i - start) / segmentLength;
        const u = 1 - t;
        const t1 = u ** 2;
        const t2 = 2 * u * t;
        const t3 = t ** 2;
        const px = t1 * startPoint.x + t2 * controlPoint.x + t3 * endPoint.x;
        const py = t1 * startPoint.y + t2 * controlPoint.y + t3 * endPoint.y;
        const distance = (point.x - px) ** 2 + (point.y - py) ** 2;
        if (distance > splineTolerance) status = false;
        if (distance > maxError) {
            errorPos = i;
            maxError = distance;
        }
        i = (i + 1) % pointsLength;
    }
    return new FitStatus(status, errorPos, maxError);
}
function toSVGString(traceData, options = defaultOptions) {
    const { mergePaths } = options;
    const { layers, palette, width, height } = traceData;
    const viewBox = `viewBox="0 0 ${width} ${height}"`;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" ${viewBox}>`;
    if (mergePaths) {
        for(let i = 0; i < traceData.layers.length; i++){
            const layer = layers[i];
            const colorAttributes = toColorAttributes(palette[i], options);
            let d = "";
            for(let j = 0; j < layer.length; j++){
                const pathData = layer[j];
                if (pathData.isHole) continue;
                d += toData(pathData, layer, options);
            }
            svg += `<path${colorAttributes} d="${d}"/>`;
        }
    } else {
        for(let i = 0; i < traceData.layers.length; i++){
            const layer = layers[i];
            const colorAttributes = toColorAttributes(palette[i], options);
            for(let j = 0; j < layer.length; j++){
                const pathData = layer[j];
                if (pathData.isHole) continue;
                const d = toData(pathData, layer, options);
                svg += `<path${colorAttributes} d="${d}"/>`;
            }
        }
    }
    svg += "</svg>";
    return svg;
}
function toColorString(rgba) {
    const b = rgba >> 16 & 0xFF;
    const g = rgba >> 8 & 0xFF;
    const r = rgba & 0xFF;
    const R = r.toString(16).padStart(2, "0");
    const G = g.toString(16).padStart(2, "0");
    const B = b.toString(16).padStart(2, "0");
    if (R[0] === R[1] && G[0] === G[1] && B[0] === B[1]) {
        return `#${R[0]}${G[0]}${B[0]}`;
    } else {
        return `#${R}${G}${B}`;
    }
}
function toColorAttributes(rgba, options = defaultOptions) {
    const { strokeWidth } = options;
    const colorString = toColorString(rgba);
    let fillStrokeAttr;
    if (colorString === "#000") {
        fillStrokeAttr = "";
    } else {
        fillStrokeAttr = ` fill="${colorString}"`;
    }
    const strokeWidthAttr = strokeWidth === 0 ? "" : ` stroke="${colorString}" stroke-width="${strokeWidth}"`;
    return fillStrokeAttr + strokeWidthAttr;
}
function toData(pathData, layer, options) {
    let str = nonHoleData(pathData, options);
    str += holeChildrenData(pathData, layer, options);
    return str;
}
function round(num, precision = 0) {
    const p = Math.pow(10, precision);
    const n = num * p * (1 + Number.EPSILON);
    return Math.round(n) / p;
}
function nonHoleData(pathData, options = defaultOptions) {
    if (pathData.ignore) return "";
    const { segments } = pathData;
    const { precision } = options;
    let prevType = "M";
    let str = "";
    if (precision !== -1) {
        const x1 = round(segments[0].x1, precision);
        const y1 = round(segments[0].y1, precision);
        str = `M${x1} ${y1}`;
        for(let i = 0; i < segments.length; i++){
            const { type, x2, y2, x3, y3 } = segments[i];
            const numbers = x3 === undefined ? [
                x2,
                y2
            ] : [
                x2,
                y2,
                x3,
                y3
            ];
            const n = numbers.map((x)=>round(x, precision)).join(" ");
            str += prevType == type ? " " + n : type + n;
            prevType = type;
        }
    } else {
        const x1 = segments[0].x1;
        const y1 = segments[0].y1;
        str = `M${x1} ${y1}`;
        for(let i = 0; i < segments.length; i++){
            const { type, x2, y2, x3, y3 } = segments[i];
            const numbers = x3 === undefined ? [
                x2,
                y2
            ] : [
                x2,
                y2,
                x3,
                y3
            ];
            const n = numbers.join(" ");
            str += prevType == type ? " " + n : type + n;
            prevType = type;
        }
    }
    return `${str}Z`;
}
function getLastPoints(segment) {
    const { x3 } = segment;
    if (x3 === undefined) {
        const { x2, y2 } = segment;
        return [
            x2,
            y2
        ];
    } else {
        const { y3 } = segment;
        return [
            x3,
            y3
        ];
    }
}
function holeChildrenData(pathData, layer, options = defaultOptions) {
    const { holeChildren } = pathData;
    if (holeChildren.length === 0) return "";
    const { precision } = options;
    let prevType = "M";
    let str = "";
    if (precision !== -1) {
        for(let i = 0; i < holeChildren.length; i++){
            const pathData = layer[holeChildren[i]];
            if (pathData.ignore) continue;
            const segments = pathData.segments;
            const lastPoint = getLastPoints(segments.at(-1));
            const x = round(lastPoint[0], precision);
            const y = round(lastPoint[1], precision);
            str += `M${x} ${y}`;
            for(let j = segments.length - 1; j >= 0; j--){
                const { type, x1, y1, x2, y2, x3 } = segments[j];
                const numbers = x3 === undefined ? [
                    x1,
                    y1
                ] : [
                    x2,
                    y2,
                    x1,
                    y1
                ];
                const n = numbers.map((x)=>round(x, precision)).join(" ");
                str += prevType == type ? " " + n : type + n;
                prevType = type;
            }
            str += "Z";
            prevType = "M";
        }
    } else {
        for(let i = 0; i < holeChildren.length; i++){
            const pathData = layer[holeChildren[i]];
            if (pathData.ignore) continue;
            const segments = pathData.segments;
            const lastPoint = getLastPoints(segments.at(-1));
            str += `M${lastPoint[0]} ${lastPoint[1]}`;
            for(let j = segments.length - 1; j >= 0; j--){
                const { type, x1, y1, x2, y2, x3 } = segments[j];
                const numbers = x3 === undefined ? [
                    x1,
                    y1
                ] : [
                    x2,
                    y2,
                    x1,
                    y1
                ];
                const n = numbers.join(" ");
                str += prevType == type ? " " + n : type + n;
                prevType = type;
            }
            str += "Z";
            prevType = "M";
        }
    }
    return str;
}
class TraceData {
    constructor(width, height, palette, layers){
        this.width = width;
        this.height = height;
        this.palette = palette;
        this.layers = layers;
    }
}
function toSVG(indexedImage, width, height, palette, options = {}) {
    options = {
        ...defaultOptions,
        ...options
    };
    const traceData = toTraceData(indexedImage, width, height, palette, options);
    return toSVGString(traceData, options);
}
function toTraceData(indexedImage, width, height, palette, options = {}) {
    options = {
        ...defaultOptions,
        ...options
    };
    const array = createBorderedInt16Array(indexedImage, width, height);
    const borderedWidth = width + 2;
    const borderedHeight = height + 2;
    const layers = detectEdges(array, borderedWidth, borderedHeight, palette);
    const layeredPaths = new Array(palette.length);
    for(let i = 0; i < palette.length; i++){
        const paths = scanPaths(layers[i], borderedWidth, borderedHeight, options);
        layeredPaths[i] = paths;
    }
    filterHoles(indexedImage, width, layeredPaths, options);
    for(let i = 0; i < palette.length; i++){
        const paths = layeredPaths[i];
        const smoothedPaths = smoothPaths(paths, options);
        const layer = new Array(smoothedPaths.length);
        for(let j = 0; j < smoothedPaths.length; j++){
            const segments = trace(smoothedPaths[j], options);
            const { isHole, holeChildren, ignore } = paths[j];
            const pathData = new PathData(segments, isHole, holeChildren, ignore);
            layer[j] = pathData;
        }
        layers[i] = layer;
    }
    return new TraceData(width, height, palette, layers);
}
export { TraceData as TraceData };
export { toSVG as toSVG };
export { toTraceData as toTraceData };

