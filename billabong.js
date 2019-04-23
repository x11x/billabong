
function Board(options) {
  if (!options) options = {};
  this.createGrid(options.billabongRows, options.billabongCols,
    options.trackRadius);
}

Board.prototype.resetGrid = function () {
  var r = this.numRows;
  var c = this.numCols;
  var g = new Array(r);
  for (var i = 0; i < r; ++i) g[i] = new Array(c);
  this.grid = g;
};

Board.createGrid = function (billabongRows, billabongCols, trackRadius) {
  this.billabongRows = billabongRows || 2;
  this.billabongCols = billabongCols || 4;
  this.trackRadius = trackRadius || 6;
  this.numRows = billabongRows + 2 * trackRadius;
  this.numCols = billabongCols + 2 * trackRadius;
  this.br1 = trackRadius;
  this.br2 = trackRadius + billabongRows;
  this.bc1 = trackRadius;
  this.bc2 = trackRadius + billabongCols;
  this.startLineCol = Math.floor(this.numCols / 2) + 1;
  this.resetGrid();
}

Board.prototype.isRefInBillabong = function (r) {
  return r.row >= this.br1 && r.row <= this.br2 &&
    r.col >= this.bc1 && r.col <= this.bc2;
};

Board.prototype.getHop = function (r1, r2) {
  if (!this.isValidRef(r1) || !this.isValidRef(r2)) return null;
  return createMoveFromRefs(r1, r2);
};

Board.prototype.setRooAt = function (r, x) {
  if (!this.isValidRef(r)) return false;
  this.grid[r.row][r.col] = x;
  return true;
};

Board.prototype.isRooAt = function (r) {
  return this.getRoo(r) != null;
};

Board.prototype.getRoo = function (r) {
  if (!this.isValidRef(r)) return false;
  return this.grid[r.row][r.col];
}

function createHopFromRefs(r1, r2) {
  var rows = r2.row - r1.row;
  var cols = r2.col - r1.col;
  var absRows = Math.abs(rows);
  var absCols = Math.abs(cols);
  if (rows && cols && absRows !== absCols) return null;
  var steps = absRows || absCols;
  if (steps % 2 === 0) return null;
  return new Hop(r1, r2, Math.sign(rows), Math.sign(cols), steps);
}

function createHopFromRefDirSteps(r1, vdir, hdir, steps) {
  vdir = Math.sign(vdir);
  hdir = Math.sign(hdir);
  steps = Math.abs(steps);
  var r2 = new Ref(r1.row + vdir * steps, r1.col + hdir * steps);
  return new Hop(r1, r2, vdir, hdir, steps);
}

Board.prototype.isValidRef = function (r) {
  return r.row < this.numRows && r.col < this.numCols &&
    !this.isRefInBillabong(r);
};

Board.prototype.isValidHop = function (m) {
  var steps = m.steps;
  if (!steps) return false;
  if (steps > 1) {
    var midPt = (m.steps - 1) / 2;
    var i = m.r1.rows, j = m.r1.cols;
    var vdir = m.vdir, hdir = m.hdir;
    var r = new Ref(i + vdir * midPt, j + hdir * midPt);
    if (!this.isRooAt(r)) return false;
    for (var c = 0; c < steps; c++) {
      r.row = (i += vdir);
      r.col = (j += hdir);
      if (this.isRooAt(r) || this.isRefInBillabong(r)) return false;
    }
  }
  return true;
};

Board.prototype.doesMoveCrossStartLine = function (move) {
  var startLineCol = this.startLineCol;
  var trackRadius = this.trackRadius;
  var hops = move.hops, l = hops.length;
  var hop, h, r1;
  for (var i = 0; i < l; ++i) {
    hop = hops[i];
    r1 = hop.r1;
    // Only consider hops that have a horizontal direction, start before the
    // column of the start line and end after the start line column
    if (hop.hdir && r1.col < startLineCol && hop.r2.col >= startLineCol) {
      // Diagonal hops (hops with both horiz. and vertical components
      if (hop.vdir) {
        // Calculate a hop in the same direction that ends at the start line
        h = createHopFromRefDirSteps(r1, hop.vdir, hop.hdir,
          // (truncate the steps to the start line column)
          startLineCol - r1.col);
        // Check that row of at the start line is less than the track radius
        // (north of the billabong)
        if (h.r2.row < trackRadius) return true;

      // Hops with no vertical component that end in a row less than the track
      // radius (north of the billabong) must have crossed the start line
      } else if (hop.r2.row < trackRadius) return true
    }
  }
};

function Hop(r1, r2, vdir, hdir, steps) {
  this.r1 = r1;
  this.r2 = r2;
  this.vdir = vdir;
  this.hdir = hdir;
  this.steps = steps;
}

function Ref(i, j) {
  this.row = i;
  this.col = j;
}

function Move(board) {
  this.board = board;
  this.reset();
}

Move.prototype.reset = function () {
  this.hops = [];
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
