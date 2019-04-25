
function Board(options) {
  if (!options) options = {};
  this.billabongRows = 2;
  this.billabongCols = 4;
  this.trackRadius = 6;
  this.numRows = this.numCols = this.startLineCol = this.grid = null;
  this.br1 = this.br2 = this.bc1 = this.bc2 = null;
  this.createGrid(options.billabongRows, options.billabongCols,
    options.trackRadius);
}

Board.prototype.createGrid = function (billabongRows, billabongCols, trackRadius) {
  billabongRows = this.billabongRows = billabongRows || this.billabongRows;
  billabongCols = this.billabongCols = billabongCols || this.billabongCols;
  trackRadius = this.trackRadius = trackRadius || this.trackRadius;
  var numRows = this.numRows = billabongRows + 2 * trackRadius;
  var numCols = this.numCols = billabongCols + 2 * trackRadius;
  this._br1 = trackRadius;
  this._br2 = trackRadius + billabongRows;
  this._bc1 = trackRadius;
  this._bc2 = trackRadius + billabongCols;
  this.startLineCol = Math.floor(numCols / 2);
  var grid = new Array(numRows);
  for (var i = 0; i < numRows; ++i) grid[i] = new Array(numCols);
  this.grid = grid;
};

Board.prototype.isRefInBillabong = function (row, col) {
  return row >= this._br1 && row < this._br2 &&
    col >= this._bc1 && col < this._bc2;
};

Board.prototype.isRefOnStartLine = function (row, col) {
  return row >= this._br2 && col === this.startLineCol;
};

Board.prototype.createVector = function (row1, col1, row2, col2) {
  return (new Vector(row1, col1, row2, col2, null, null, null))
    .setGridConstraints(this.numRows, this.numCols)
    .calcStepsAndDir();
};

Board.prototype.setRooAt = function (row, col, roo) {
  if (!this.isValidRef(row, col)) return false;
  this.grid[row][col] = roo;
  return true;
};

Board.prototype.isRooAt = function (row, col) {
  return this.getRoo(row, col) != null;
};

Board.prototype.getRoo = function (row, col) {
  if (!this.isValidRef(row, col)) return false;
  return this.grid[row][col];
};

Board.prototype.isValidRef = function (row, col) {
  return row >= 0 && row < this.numRows && col >= 0 && col < this.numCols &&
    !this.isRefInBillabong(row, col);
};

Board.prototype.isValidHop = function (vector) {
  if (!vector || !vector.isValid()) return false;
  var steps = vector.steps;
  if (!steps || steps % 2 === 0) return false;
  var row1 = vector.row1, col1 = vector.col1;
  var row2 = vector.row2, col2 = vector.col2;
  if (!this.isValidRef(row1, col1) || !this.isValidRef(row2, col2)) {
    return false;
  }
  var pivotDistance = (steps - 1) / 2;
  var vdir = vector.vdir, hdir = vector.hdir;
  // Compute row and column of pivot roo
  var pivotRow = row1 + vdir * pivotDistance;
  var pivotCol = col1 + hdir * pivotDistance;
  // Check that the pivot roo is in place
  if (!this.isRooAt(pivotRow, pivotCol)) return false;
  // Check all other refs are empty
  for (var i = row1, j = col1, c = 0; c < steps; c++) {
    i += vdir;
    h += hdir;
    // Skip the pivot ref
    if (i === pivotRow || j === pivotCol) continue;
    // Check if there's a roo in the current ref or if its in the billabong
    if (this.isRooAt(i, j) || this.isRefInBillabong(i, j)) return false;
  }
  return true;
};

Board.prototype.doesVectorCrossStartLine = function (vector) {
  if (!vector.isValid()) return 0;
  var rowAtStartLine;
  var startLineCol = this.startLineCol;
  var br2 = this._br2;
  var row1 = vector.row1, col1 = vector.col1;
  var col2 = vector.col2;
  var hdir = vector.hdir, vdir = vector.vdir;
  // Only consider vectors that have a horizontal direction
  if (!hdir) return 0;

  // Does the vector start and end (resp.) left of the start line?
  var startsLeft = col1 < startLineCol, endsLeft = col2 < startLineCol;

  // If vector starts and ends on the same side of the start line, it can't
  // cross it
  if (startsLeft === endsLeft) return 0;

  // Calculate distance from start line in horizontal direction (num cols)
  var stepsToStartLine = Math.abs(startLineCol - col1);
  // If vector has vertical component (i.e. it is a diagonal vector)
  if (vdir) {
    // Compute the row number at the start line column
    var rowAtStartLine = row1 + vdir * stepsToStartLine;
    // If this row is south of the billabong, its a crossing
    // (return the direction of the crossing which is the opposite of the
    // horizontal direction of the vector)
    if (rowAtStartLine >= br2) return -hdir;
  // Purely horizontal vectors, we only need to look at the end row
  } else if (vector.row2 >= br2) return -hdir;

  // No crossing otherwise
  return 0;
};

Board.prototype.doesMoveCrossStartLine = function (move) {
  var hop = move.hops, l = hops.length;
  for (var i = 0; i < l; ++i) {
    if (this.doesVectorCrossStartLine(hops[i])) return true;
  }
};

Board.prototype.createMove = function () {
  return new Move(this);
};


function Move(board) {
  this.board = board;
  this.hops = [];
  this.lastRow = this.lastCol = null;
  this.isSingleStep = false;
}

Move.prototype.reset = function () {
  this.hops.length = this.lastRow = this.lastCol = 0;
  this.isSingleStep = false;
};

Move.prototype.addHop = function (hop) {
  if (this.isSingleStep || !board.isValidHop(hop)) return false;
  var lastRow = this.lastRow, lastCol = this.lastCol;
  if (lastRow != null && lastCol != null &&
    hop.steps === 1 ||
    lastRow !== hop.row1 || lastCol !== hop.col1) return false;
  this.hops.push(hop);
  this.lastRow = hop.row2;
  this.lastCol = hop.col2;
  // Only one single step (vector with steps == 1) allowed per move
  this.isSingleStep = hop.steps === 1;
  return true;
};


function Vector(row1, col1, row2, col2, vdir, hdir, steps) {
  (this.row1 = this.col1 = this.row2 = this.col2 = this.vdir = this.hdir =
     this.steps = this._rows = this._cols = this._absRows = this._absCols = 0);
  this.maxRows = this.maxCols = null;
  this.setStart(row1, col1);
  this.setEnd(row2, col2);
  this.setDirections(vdir, hdir);
  this.setSteps(steps);
  return this;
}

Vector.prototype._setParams = Vector;

Vector.prototype.reset = function () {
  return this._setParams(0,0,0,0,0,0,0);
};

Vector.prototype.clone = function () {
  return new Vector(this.row1, this.col1, this.row2, this.col2,
    this.vdir, this.hdir, this.steps);
};

Vector.prototype.isValid = function () {
  var rows = this._rows = this.row2 - this.row1;
  var cols = this._cols = this.col2 - this.col1;
  var absRows = this._absRows = Math.abs(rows);
  var absCols = this._absCols = Math.abs(cols);
  // Either rows or cols must be 0, or absolute values must be the same
  // in both directions.
  return !rows || !cols || absRows === absCols;
};

Vector.prototype.setGridConstraints = function (maxRows, maxCols) {
  this.maxRows = maxRows;
  this.maxCols = maxCols;
  return this.applyGridConstraints();
};

Vector.prototype.applyGridConstraints = function () {
  var maxRows = this.maxRows, maxCols = this.maxCols;
  if (maxRows != null && maxCols != null) {
    var x;
    if (x = this.row1) this.row1 = Math.min(maxRows, x) << 0;
    if (x = this.col1) this.col1 = Math.min(maxCols, x) << 0;
    if (x = this.row2) this.row2 = Math.min(maxRows, x) << 0;
    if (x = this.col2) this.col2 = Math.min(maxCols, x) << 0;
  }
  return this;
};


Vector.prototype.correctInvalid = function (correctStartPoint) {
  this.applyGridConstraints();
  if (this.isValid()) return true;

  var rows = this._rows, cols = this._cols;
  var absRows = this._absRows, absCols = this._absCols;
  var steps = this.steps = Math.max(absRows, absCols) << 0;
  rows = Math.round(rows / steps) * steps;
  cols = Math.round(cols / steps) * steps;
  this.setDirections(rows, cols);
  this.calcPoint(correctStartPoint);
  return this.isValid();
};

Vector.prototype.setPoint = function (row, col, setStart) {
  var row = Math.max(row << 0, 0), col = Math.max(col << 0, 0);
  if (setStart) {
    this.row1 = row;
    this.col1 = col;
  } else {
    this.row2 = row;
    this.col2 = col;
  }
  return this;
};

Vector.prototype.setStart = function (row, col) {
  return this.setPoint(row, col, true);
};

Vector.prototype.setEnd = function (row, col) {
  return this.setPoint(row, col, false);
};

Vector.prototype.setDirections = function (vdir, hdir) {
  this.vdir = Math.sign(vdir) << 0;
  this.hdir = Math.sign(hdir) << 0;
  return this;
};

Vector.prototype.setSteps = function (steps) {
  this.steps = Math.abs(steps << 0);
  return this;
};

Vector.prototype.calcStepsAndDir = function () {
  var rows = this.row2 - this.row1;
  var cols = this.col2 - this.col1;
  return this.setDirections(rows, cols).setSteps(rows || cols);
};

Vector.prototype.calcPoint = function (calcStartPoint) {
  if (calcStartPoint) {
    return this.setStart(
      this.row2 - this.vdir * this.steps,
      this.col2 - this.hdir * this.steps);
  } else {
    return this.setEnd(
      this.row1 + this.vdir * this.steps,
      this.col1 + this.hdir * this.steps);
  }
};
