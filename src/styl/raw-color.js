module.exports = function() {
  return function(styl) {
    var nodes = styl.nodes;
    nodes.RGBA.prototype.toString = function() {
      return this.raw;
    };
    nodes.HSLA.prototype.toString = nodes.RGBA.prototype.toString;
  };
};
