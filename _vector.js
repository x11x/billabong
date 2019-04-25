function Vector(row1, col1, row2, col2, vdir, hdir, steps) {
  // Initialize all properties to null
  (this.row1 = this.col1 = this.row2 = this.col2 = this.vdir = this.hdir =
    this.steps = null);
  // Set any of the constructor parameters if they are not null
  if (row1 != null && col1 != null) this.setStart(row1, col1);
  if (row2 != null && col2 != null) this.setEnd(row2, col2);
  else if (vdir != null && hdir != null && steps != null) {
    this.setDirAndSteps(vdir, hdir, steps);
  }
  // Calculate missing parameters if applicable
  this.calcMissing();
}

// The constructor can also be used as reset method to reset an instance
Vector.prototype.reset = Vector;

Hop.prototype.clone = function () {
  // Clone this instance
  return new Vector(this.row1, this.col1, this.row2, this.col2,
    this.vdir, this.hdir, this.steps);
};

Vector.prototype.isStartSet = function () {
  return this.row1 != null && this.col1 != null;
};

Vector.prototype.isEndSet = function () {
  return this.row2 != null && this.col2 != null;
};

Vector.prototype.isDirAndStepsSet = function () {
  return this.vdir != null && this.hdir != null && this.steps != null;
};

Vector.prototype.calcMissing = function () {
  return this.calcEnd() || this.calcDirAndSteps();
};

Vector.prototype.calcEnd = function () {
  if (this.isStartSet() && this.isDirAndStepsSet()) {
    var steps = this.steps;
    this.row2 = this.row1 + this.vdir * steps;
    this.col2 = this.col1 + this.hdir * steps;
    return true;
  }
  return false;
};

Vector.prototype.calcDirAndSteps = function () {

};
