var REJECTED_TAGS = /(iframe)|(script)|(style)|(link)|(object)/;
var REJECTED_ATTRIBUTES = /(s-controller=")|(data-s-controller=")/;

export default function View (data) {
	this.scope = data.scope;
	this.nodes = this.scope.getElementsByTagName('*');
}

View.prototype.isTag = function (node, pattern) {
	var tag = node.tagName.toLowerCase();

	if (pattern.test(tag)) {
		return true;
	}

	return false;
};

View.prototype.isAttribute = function (node, pattern) {
	var attributes = node.attributes;

	for (var i = 0, l = attributes.length; i < l; i++) {
		var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
		if (pattern.test(attribute)) return true;
	}

	return false;
};

View.prototype.isRejected = function (node) {
	var isTag = this.isTag(node, REJECTED_TAGS);
	var isAttribute = this.isAttribute(node, REJECTED_ATTRIBUTES);
	return isTag || isAttribute;
};

View.prototype.list = function (filter) {
	var node =  null;
	var nodes = [];

	for (var i = 0, l = this.nodes.length; i < l; i++) {
		node = this.nodes[i];

		if (this.isRejected(node)) { // rejects elment and its children
			i = i + node.children.length;
			node = this.nodes[i];
		} else if (filter ? filter(node) : true) {
			nodes.push(node);
		}
	}

	return nodes;
};

View.prototype.findByTag = function (pattern) {
	var self = this;

	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

	return self.list(function (node) {
		return self.isTag(node, pattern);
	});
};

View.prototype.findByAttribute = function (pattern) {
	var self = this;

	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

	return self.list(function (node) {
		return self.isAttribute(node, pattern);
	});
};
