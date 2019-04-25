
function BoardView(board, doc) {
  this.board = board;
  this.document = doc || document;
  //this.winResizeAss = new AutoStylesheet(this.document);
  //this.winResizeAss.generateCss = this.genWinResizeCss.bind(this);
  this.elems = {};
}

/*
BoardView.prototype.genWinResizeCss = function () {
  var docElem = this.document.documentElement;
  var w = docElem.clientWidth, h = docElem.clientHeight;
  var board = this.board;
  var cellW = w / board.numCols, cellH = h / board.numRows;
};*/

BoardView.prototype.createGrid = function () {
  var board = this.board;
  var elems = this.elems;

  createTable(board.numRows, board.numCols, {
    document: this.document,
    refsCtx: elems,
    onCell: onCell
  });

  function onCell(cell, i, j, row, table) {
    var className = 'r' + i + ' c' + j;
    if (board.isRefInBillabong(i, j)) className += ' billabong';
    if (board.isRefOnStartLine(i, j)) className += ' startline';
    cell.className = className;
    cell.setAttribute('data-grid-ref', i + ',' + j);
  }
};

BoardView.prototype.attachGridTo = function (container) {
  var ownerDoc = container.ownerDocument;
  var doc = this.document = this.document || this.elems.document ||
    ownerDoc || document;
  container.appendChild(this.elems.table);
};

function createTable(rows, cols, options) {
  if (!options) options = {};
  var doc = options.document || this.document || document;
  var onCell = options.onCell || function () {};
  var table = doc.createElement('table');
  var refsCtx = options.refsCtx || {};
  var i, j, r, e;

  var rowArray;
  var cellRefs = new Array(rows);
  var rowRefs = new Array(rows);

  for (i = 0; i < rows; ++i) {
    r = doc.createElement('tr');
    rowArray = cellRefs[i] = new Array(cols);
    for (j = 0; j < cols; ++j) {
      e = doc.createElement('td');
      e.appendChild(document.createTextNode('\u00A0'));
      onCell(e, i, j, r, table);
      rowArray[j] = r.appendChild(e);
    }
    rowRefs[i] = table.appendChild(r);
  }
  refsCtx.table = table;
  refsCtx.rows = rowRefs;
  refsCtx.cells = cellRefs;
  refsCtx.document = doc;
  return refsCtx;
}
