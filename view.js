
function createTable(rows, cols, options) {
  if (!options) options = {};
  var doc = options.document || this.document || document;
  var onCell = options.onCell || function () {};
  var table = doc.createElement('table');
  var i, j, r, e;

  for (i = 0; i < rows; ++i) {
    r = doc.createElement('tr');
    for (j = 0; j < cols; ++j) {
      e = doc.createElement('td');
      e.appendChild(document.createTextNode('\u00A0'));
      onCell(e, i, j, r, table);
      r.appendChild(e);
    }
    table.appendChild(r);
  }
  return table;
}

function addClasses(cell, i, j, row, table) {
  cell.className = 'r' + i + ' c' + j;
  if (i >= 6 && i < 8 && j >= 6 && j < 10) {
    cell.className += ' billabong';
  }
  if (i >= 8 && j === 8) cell.className += ' startline'

}
