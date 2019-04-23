
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
  this.billabongRows = billabongRows || this.billabongRows || 2;
  this.billabongCols = billabongCols || this.billabongCols || 4;
  this.trackRadius = trackRadius || this.trackRadius || 6;
  this.numRows = billabongRows + 2 * trackRadius;
  this.numCols = billabongCols + 2 * trackRadius;
  this.br1 = trackRadius;
  this.br2 = trackRadius + billabongRows;
  this.bc1 = trackRadius;
  this.bc2 = trackRadius + billabongCols;
  this.startLineCol = Math.floor(this.numCols / 2) + 1;
  var grid = new Array(numRows);
  for (var i = 0; i < numRows; ++i) grid[i] = new Array(numCols);
  this.grid = grid;
}

Board.prototype.isRefInBillabong = function (row, col) {
  return row >= this.br1 && row <= this.br2 &&
    col >= this.bc1 && col <= this.bc2;
};

Board.prototype.createHop = function (row1, col1, row2, col2) {
  if (!this.isValidRef(row1, col1) || !this.isValidRef(row2, col2)) return null;
  var hop = new Hop;
  hop.set2Refs(row1, col1, row2, col2);
  return hop;
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
  if (!hop || !hop.validate()) return false;
  var steps = hop.steps;
  if (steps < 1) return false;
  var pivotDistance = (steps - 1) / 2;
  var row1 = hop.row1, col1 = hop.col1;
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

Board.prototype.doesHopCrossStartLine(hop) {
  var startLineCol = this.startLineCol;
  var trackRadius = this.trackRadius;
  var row1 = hop.row1, col1 = hop.col1;
  var hdir = hop.hdir;
  // Only consider hops that have a horizontal direction, start before the
  // column of the start line and end after the start line column
  if (hdir && col1 < startLineCol && hop.col2 >= startLineCol) {
    // Diagonal hops (hops with both horiz. and vertical components)
    if (hop.vdir) {
      // Compute the row number where the hop crosses the start line;
      var rowAtStartLine = row1 + hdir * (startLineCol - col1);
      // Check that row where the hop crosses the start line is less than the
      // track radius (i.e. north of the billabong)
      if (rowAtStartLine < trackRadius) return true;

      // Hops with no vertical component that end in a row less than the track
      // radius (i.e. north of the billabong) must have crossed the start line
    } else if (hop.row2 < trackRadius) return true
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
  this.lastRef = null;
}

Move.prototype.reset = function () {
  this.hops.length = 0;
  this.lastRef = null;
};

Move.prototype.addHop = function (hop) {
  if (!board.isValidHop(hop)) return false;
  var lastRef = this.lastRef;
  if (lastRef && !lastRef.equals(hop.r1)) return false;
  this.hops.push(hop);
  this.lastRef = hop.r2;
  return true;
};


function Hop(row1, col1, row2, col2, vdir, hdir, steps) {
  this.row1 = row1 || null;
  this.col1 = col1 || null;
  this.row2 = row2 || null;
  this.col2 = col2 || null;
  this.vdir = vdir || null;
  this.hdir = hdir || null;
  this.steps = steps || null;
};

Hop.prototype._setParams = Hop;

Hop.prototype.clone = function () {
  return new Hop(this.row1, this.col1, this.row2, this.col2,
    this.vdir, this.hdir, this.steps);
};

Hop.prototype.validate = function () {
  var rows = this.row2 - this.row1, cols = this.col2 - this.col1;
  var absRows = Math.abs(rows), absCols = Math.abs(cols);
  var steps = absRows || absCols;
  return this.isValid = rows && cols && absRows !== absCols && steps % 2 === 0;
};

Hop.prototype.set2Refs = function (row1, col1, row2, col2) {
  var rows = row2 - row1;
  var cols = col2 - col1;
  var vdir = Math.sign(rows), hdir = Math.sign(cols);
  var steps = Math.abs(rows) || Math.abs(cols);
  this._setParams(row1, col1, row2, col2, vdir, hdir, steps);
};

Hop.prototype.set1RefDirAndSteps = function (row1, col1, vdir, hdir, steps) {
  vdir = Math.sign(vdir);
  hdir = Math.sign(hdir);
  steps = Math.abs(steps);
  var row2 = row1 + vdir * steps, col2 = col1 + hdir * steps;
  this._setParams(row1, col1, row2, col2, vdir, hdir, steps);
};
