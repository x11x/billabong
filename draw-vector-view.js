
function DrawVectorView(boardView) {
  this.boardView = boardView;
  this.cellsToClear = [];
  this.drawing = false;
  this.animFrameRequested = false;
  this.startElem = this.endElem = null;
  this._onMouseDownListener = this._onMouseDownListener.bind(this);
  this._onMouseMoveListener = this._onMouseMoveListener.bind(this);
  this._onMouseUpListener = this._onMouseUpListener.bind(this);
  this._updateBound = this.update.bind(this);
  this.vector = boardView.board.createVector();
}

// XXX this is important, should be moved into view.js
DrawVectorView.prototype.getGridRefFromElem = function (e) {
  if (e.nodeName !== 'TD') return; // XXX better check
  var gridRef = e.getAttribute('data-grid-ref');
  if (!gridRef) return;
  var p = gridRef.split(',');
  if (p.length !== 2) return;
  var i = p[0] << 0;
  var j = p[1] << 0;
  return [i, j];
};

DrawVectorView.prototype.attachListeners = function (ctx) {
  if (!ctx) ctx = this.boardView.elems.table;
  this.listenerCtx = ctx;
  ctx.addEventListener('mousedown', this._onMouseDownListener, false)
  ctx.addEventListener('mousemove', this._onMouseMoveListener, false)
  ctx.addEventListener('mouseup', this._onMouseUpListener, false)
}

DrawVectorView.prototype.detachListeners = function (ctx) {
  if (!ctx) ctx = this.listenerCtx || this.boardView.elems.table;
  ctx.removeEventListener('mousedown', this._onMouseDownListener, false)
  ctx.removeEventListener('mousemove', this._onMouseMoveListener, false)
  ctx.removeEventListener('mouseup', this._onMouseUpListener, false)
  this.listenerCtx = null;
}

DrawVectorView.prototype.setVectorPointByElem = function (elem, setStart) {
  var ref = elem && this.getGridRefFromElem(elem);
  if (!ref) return;
  this.vector.setPoint(ref[0], ref[1], setStart);
  this.startElem = setStart ? elem : null;
  this.endElem = setStart ? null : setStart;
  return ref;
};

DrawVectorView.prototype.clearPreviousCells = function () {
  var cells = this.cellsToClear;
  for (var i = 0, l = cells.length; i < l; ++i) {
    cells[i].style.backgroundColor = '';
  }
  cells.length = 0;
};

function debugVector(board, vector, shouldCorrect) {
  var rows = vector.row2 - vector.row1;
  var cols = vector.col2 - vector.col1;
  var valid = vector.isValid();
  var s = `BEFORE
r1: ${vector.row1}, c1: ${vector.col1}
r2: ${vector.row2}, c2: ${vector.col2}
vdir: ${vector.vdir}, hdir: ${vector.hdir}, steps: ${vector.steps}
isValid: ${valid}
doesVectorCrossStartLine: ${board.doesVectorCrossStartLine(vector)}
is start in billabong: ${board.isRefInBillabong(vector.row1, vector.col1)}
is end in billabong: ${board.isRefInBillabong(vector.row2, vector.col2)}`;
  if (shouldCorrect) {
    valid = vector.correctInvalid();
    s += '\nAFTER';
    if (!valid) s += '\ncorrection unsuccessful';
    else s += `
r1: ${vector.row1}, c1: ${vector.col1}
r2: ${vector.row2}, c2: ${vector.col2}
vdir: ${vector.vdir}, hdir: ${vector.hdir}, steps: ${vector.steps}
isValid: ${vector.isValid()}
doesVectorCrossStartLine: ${board.doesVectorCrossStartLine(vector)}
is start in billabong: ${board.isRefInBillabong(vector.row1, vector.col1)}
is end in billabong: ${board.isRefInBillabong(vector.row2, vector.col2)}`;
  }
  debug.value = s;
  return valid;
}

DrawVectorView.prototype.update = function () {
  this.animFrameRequested = false;
  this.clearPreviousCells();
  if (!this.drawing) return;

  var vector = this.vector.calcStepsAndDir();
  var board = this.boardView.board;
  if (!debugVector(board, vector, true)) return;
  //if (!vector.correctInvalid()) return;

  var cellsToClear = this.cellsToClear;
  var cell;
  var cellElems = this.boardView.elems.cells;
  var vdir = vector.vdir, hdir = vector.hdir;
  var i = vector.row1, j = vector.col1, l = vector.steps + 1;
  for (var c = 0; c < l; ++c) {
    if (!(cell = cellElems[i]) || !(cell = cell[j])) {
      break;
      //console.error("trying to access undefined cell", i, j);
      //console.error(vector);
    }
    cell = cellElems[i][j];
    cellsToClear.push(cell);
    cell.style.backgroundColor = 'darkgreen';
    i += vdir;
    j += hdir;
  }
};

DrawVectorView.prototype._onMouseDownListener = function (event) {
  this.vector.reset();
  this.setVectorPointByElem(event.target, true);
  this.drawing = false;
  this.update();
  this.drawing = true;
};

DrawVectorView.prototype._onMouseUpListener = function (event) {
  if (!this.drawing) return;
  this.setVectorPointByElem(event.target, false);
  this.drawing = false;
  this.update();
};

DrawVectorView.prototype._onMouseMoveListener = function (event) {
  if (!this.drawing) return;
  if (!this.animFrameRequested) {
    this.setVectorPointByElem(event.target, false);
    this.animFrameRequested = true;
    window.requestAnimationFrame(this._updateBound);
  }
};
