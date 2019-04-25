
var PI_ON_4 = Math.PI / 4;

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
}

Board.prototype.isRefInBillabong = function (row, col) {
  return row >= this._br1 && row < this._br2 &&
    col >= this._bc1 && col < this._bc2;
};

Board.prototype.isRefOnStartLine = function (row, col) {
  return row >= this._br2 && col === this.startLineCol;
}

Board.prototype.createHop = function (row1, col1, row2, col2, pinEnd) {
  return (new Hop(row1, col1, row2, col2, null, null, null, pinEnd))
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
}

Board.prototype.isValidRef = function (row, col) {
  return row < this.numRows && col < this.numCols &&
    !this.isRefInBillabong(row, col);
};

Board.prototype.isValidHop = function (hop) {
  if (!hop || !hop.isValid()) return false;
  var steps = hop.steps;
  if (!steps || steps % 2 === 0) return false;
  var row1 = hop.row1, col1 = hop.col1;
  var row2 = hop.row2, col2 = hop.col2;
  if (!this.isValidRef(row1, col1) || !this.isValidRef(row2, col2)) {
    return false;
  }
  var pivotDistance = (steps - 1) / 2;
  var vdir = hop.vdir, hdir = hop.hdir;
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

Board.prototype.doesHopCrossStartLine = function (hop) {
  if (!hop.isValid()) return false;
  var startLineCol = this.startLineCol;
  var br2 = this._br2;
  var row1 = hop.row1, col1 = hop.col1;
  var hdir = hop.hdir;
  // Only consider hops that have a horizontal direction, start before the
  // column of the start line and end after the start line column
  if (hdir && col1 <= startLineCol && hop.col2 >= startLineCol) {
    // Diagonal hops (hops with both horiz. and vertical components)
    if (hop.vdir) {
      // Compute the row number where the hop crosses the start line;
      var rowAtStartLine = row1 + hdir * (startLineCol - col1);
      // Check that row where the hop crosses the start line is greater than the
      // bottom billabong row (br2) (i.e. south of the billabong)
      if (rowAtStartLine > br2) return true;

      // Hops with no vertical component that end in a row less than the track
      // radius (i.e. south of the billabong) must have crossed the start line
    } else if (hop.row2 > br2) return true
  }
  return false;
};

Board.prototype.doesMoveCrossStartLine = function (move) {
  var hops = move.hops, l = hops.length;
  for (var i = 0; i < l; ++i) {
    if (this.doesHopCrossStartLine(hops[i])) return true;
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
  // Only one single step (hop with steps == 1) allowed per move
  this.isSingleStep = hop.steps === 1;
  return true;
};


function Hop(row1, col1, row2, col2, vdir, hdir, steps) {
  (this.row1 = this.col1 = this.row2 = this.col2 = this.vdir = this.hdir =
     this.steps = this._rows = this._cols = this._absRows = this._absCols = 0);
  this.maxRows = this.maxCols = null;
  this.setStart(row1, col1);
  this.setEnd(row2, col2);
  this.setDirections(vdir, hdir);
  this.setSteps(steps);
}

Hop.prototype._setParams = Hop;

Hop.prototype.clone = function () {
  return new Hop(this.row1, this.col1, this.row2, this.col2,
    this.vdir, this.hdir, this.steps, this._endPin);
};

Hop.prototype.isValid = function () {
  var rows = this._rows = this.row2 - this.row1;
  var cols = this._cols = this.col2 - this.col1;
  var absRows = this._absRows = Math.abs(rows);
  var absCols = this._absCols = Math.abs(cols);
  // Either rows or cols must be 0, or absolute values must be the same
  // in both directions. Also, must be an odd number of steps >= 1
  // XXX moved steps validation to Board (as this only applies for actual game moves, not
  // just vectors)
  return !(rows && cols && absRows !== absCols/* || !steps || steps % 2 === 0*/);
};

Hop.prototype.setGridConstraints = function (maxRows, maxCols) {
  this.maxRows = maxRows;
  this.maxCols = maxCols;
  return this.applyGridConstraints();
};

Hop.prototype.applyGridConstraints = function () {
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


Hop.prototype.correctInvalid = function (correctStartPoint) {
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

Hop.prototype.setPoint = function (row, col, setEnd) {
  var row = Math.max(row << 0, 0), col = Math.max(col << 0, 0);
  if (setEnd) {
    this.row2 = row;
    this.col2 = col;
  } else {
    this.row1 = row;
    this.col1 = col;
  }
  return this;
};

Hop.prototype.setStart = function (row, col) {
  return this.setPoint(row, col, false);
}

Hop.prototype.setEnd = function (row, col) {
  return this.setPoint(row, col, true);
}

Hop.prototype.setDirections = function (vdir, hdir) {
  this.vdir = Math.sign(vdir) << 0;
  this.hdir = Math.sign(hdir) << 0;
  return this;
};

Hop.prototype.setSteps = function (steps) {
  this.steps = Math.abs(steps << 0);
  return this;
};

Hop.prototype.calcStepsAndDir = function () {
  var rows = this.row2 - this.row1;
  var cols = this.col2 - this.col1;
  return this.setDirections(rows, cols).setSteps(rows || cols);
};

Hop.prototype.calcPoint = function (calcStartPoint) {
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
