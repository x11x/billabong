
function DrawHops(boardView) {
  this.boardView = boardView;
  this.cellsToClear = [];
  this.drawing = false;
  this.animFrameRequested = false;
  this.startElem = this.endElem = null;
  this._onMouseDownListener = this._onMouseDownListener.bind(this);
  this._onMouseMoveListener = this._onMouseMoveListener.bind(this);
  this._onMouseUpListener = this._onMouseUpListener.bind(this);
  this._drawHopBound = this.drawHop.bind(this);
  this.hop = new Hop;
  this.hop.setGridConstraints(boardView.board.numRows, boardView.board.numCols);
}

// XXX this is important, should be moved into view.js
DrawHops.prototype.getGridRefFromElem = function (e) {
  if (e.nodeName !== 'TD') return; // XXX better check
  var gridRef = e.getAttribute('data-grid-ref');
  if (!gridRef) return;
  var p = gridRef.split(',');
  if (p.length !== 2) return;
  var i = p[0] << 0;
  var j = p[1] << 0;
  return [i, j];
};

DrawHops.prototype.attachListeners = function (ctx) {
  if (!ctx) ctx = this.boardView.elems.table;
  this.listenerCtx = ctx;
  ctx.addEventListener('mousedown', this._onMouseDownListener, false)
  ctx.addEventListener('mousemove', this._onMouseMoveListener, false)
  ctx.addEventListener('mouseup', this._onMouseUpListener, false)
}

DrawHops.prototype.detachListeners = function (ctx) {
  if (!ctx) ctx = this.listenerCtx || this.boardView.elems.table;
  ctx.removeEventListener('mousedown', this._onMouseDownListener, false)
  ctx.removeEventListener('mousemove', this._onMouseMoveListener, false)
  ctx.removeEventListener('mouseup', this._onMouseUpListener, false)
  this.listenerCtx = null;
}


/*DrawHops.prototype._onClickListener = function (event) {
  alert(this.getGridRefFromElem(event.target));
};*/

DrawHops.prototype.updateHop = function (elem, isStart) {
  var ref = elem && this.getGridRefFromElem(elem);
  if (!ref) return;
  if (isStart) {
    this.hop.setStart(ref[0], ref[1]);
    this.startElem = elem;
  } else {
    this.hop.setEnd(ref[0], ref[1]);
    this.endElem = elem;
  }
  return ref;
};

DrawHops.prototype.clearPreviousCells = function () {
  var cells = this.cellsToClear;
  for (var i = 0, l = cells.length; i < l; ++i) {
    cells[i].style.backgroundColor = '';
  }
  cells.length = 0;
};

var radToDegFactor = 180 / Math.PI;
var pion4 = Math.PI / 4;

function debugHop(board, hop, shouldCorrect) {
  var rows = hop.row2 - hop.row1;
  var cols = hop.col2 - hop.col1;
  var valid = hop.isValid();
  var s = `BEFORE
r1: ${hop.row1}, c1: ${hop.col1}
r2: ${hop.row2}, c2: ${hop.col2}
vdir: ${hop.vdir}, hdir: ${hop.hdir}, steps: ${hop.steps}
isValid: ${valid}
doesHopCrossStartLine: ${board.doesHopCrossStartLine(hop)}
is start in billabong: ${board.isRefInBillabong(hop.row1, hop.col1)}
is end in billabong: ${board.isRefInBillabong(hop.row2, hop.col2)}`;
  if (shouldCorrect) {
    valid = hop.correctInvalid();
    s += '\nAFTER';
    if (!valid) s += '\ncorrection unsuccessful';
    else s += `
r1: ${hop.row1}, c1: ${hop.col1}
r2: ${hop.row2}, c2: ${hop.col2}
vdir: ${hop.vdir}, hdir: ${hop.hdir}, steps: ${hop.steps}
isValid: ${hop.isValid()}
doesHopCrossStartLine: ${board.doesHopCrossStartLine(hop)}
is start in billabong: ${board.isRefInBillabong(hop.row1, hop.col1)}
is end in billabong: ${board.isRefInBillabong(hop.row2, hop.col2)}`;
  }
  debug.value = s;
  return valid;
}

DrawHops.prototype.drawHop = function () {
  this.animFrameRequested = false;
  var hop = this.hop.calcStepsAndDir();
  var board = this.boardView.board;
  if (!debugHop(board, hop, true)) return;
  //if (!hop.correctInvalid()) return;

  this.clearPreviousCells();
  var cellsToClear = this.cellsToClear;
  var cell;
  var cellElems = this.boardView.elems.cells;
  var vdir = hop.vdir, hdir = hop.hdir;
  var i = hop.row1, j = hop.col1, l = hop.steps + 1;
  for (var c = 0; c < l; ++c) {
    if (!(cell = cellElems[i]) || !(cell = cell[j])) {
      break;
      console.error("trying to access undefined cell", i, j);
      console.error(hop);
    }
    cell = cellElems[i][j];
    cellsToClear.push(cell);
    cell.style.backgroundColor = 'darkgreen';
    i += vdir;
    j += hdir;
  }
};

DrawHops.prototype._onMouseDownListener = function (event) {
  var elem = event.target;
  this.hop._setParams(0,0,0,0,0,0,0,false);
  var ref = this.updateHop(elem, true);
  this.drawHop();
  this.drawing = true;
};

DrawHops.prototype._onMouseUpListener = function (event) {
  if (!this.drawing) return;
  var elem = event.target;
  var ref = this.updateHop(elem, false);
  this.drawing = false;
  this.drawHop();
};

DrawHops.prototype._onMouseMoveListener = function (event) {
  if (!this.drawing) return;
  if (!this.animFrameRequested) {
    this.updateHop(event.target, false); // XXX move inside RAF loop?
    this.animFrameRequested = true;
    window.requestAnimationFrame(this._drawHopBound);
  }
};
