var expando = 'billabong' + 1 * new Date;
var nextExpandoI = 0;

function clearElem(elem) {
  var e;
  while (e = elem.firstChild) elem.removeChild(e);
}

function AutoStylesheet(doc) {
  this.id = expando + nextExpando + 'ss';
  nextExpando++;
  this.document = doc || document;
  this.elem = null;
  this.css = '';
  this._doUpdateBound = this._doUpdate.bind(this);
  this.requestedAnimFram = false;
}

AutoStylesheet.prototype.update = function () {
  if (!this.requestedAnimFrame) {
    this.requestedAnimFram = true;
    window.requestAnimationFrame(this._doUpdateBound);
  }
}

AutoStylesheet.prototype._doUpdate = function () {
  this.requestedAnimFram = false;
  var doc = this.document;
  var elem = this.elem = this.elem || doc.getElementById(this.id);
  var oldCss = this.css;
  var newCss = this.css = this.generateCss();
  var hasCssChanged = oldCss !== newCss;
  if (!elem) {
    elem = this.elem = doc.createElement('style');
    elem.id = this.id;
    elem.appendChild(doc.createTextNode(newCss));
    doc.getElementsByTagName('head')[0].appendChild(elem);
  } else if (this.hasCssChanged) {
    clearElem(elem);
    elem.appendChild(doc.createTextNode(newCss));
  }
};

AutoStylesheet.prototype.generateCss = function () {};
