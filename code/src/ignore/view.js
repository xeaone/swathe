
export var View = function (options) {
	var self = this;

	self.options = options || {};
	self.nodes = self.options.scope.getElementsByTagName('*');

	if (this.options.rejected) {
		if (this.options.rejected.tags) this.options.rejected.tags = new RegExp(this.options.rejected.tags.join('|'));
		if (this.options.rejected.attributes) this.options.rejected.attributes = new RegExp(this.options.rejected.attributes.join('|'));
	}
};

View.prototype.isRejected = function (node) {
	var rejected = this.options.rejected;

	if (rejected) {
		var tagsPattern = rejected.tags;
		var attributesPattern = rejected.attributes;

		if (tagsPattern) {
			var tag = node.tagName.toLowerCase();
			if (tagsPattern.test(tag)) return true;
		}

		if (attributesPattern) {
			var l = node.attributes.length;
			var i = 0;

			for (i; i < l; i++) {
				var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
				if (attributesPattern.test(attribute)) return true;
				else if (i === l-1) return false;
			}
		}

	} else {
		return false;
	}
};

View.prototype.list = function (filter) {
	var l = this.nodes.length;
	var node =  null;
	var nodes = [];
	var i = 0;

	for (i; i < l; i++) {
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

View.prototype.findByTag = function (tag) {
	var tagPattern = new RegExp(tag);

	return this.list(function (node) {
		return tagPattern.test(node.tagName.toLowerCase());
	});
};

View.prototype.findByAttribute = function (attribute) {
	var attributePattern = new RegExp(attribute);

	return this.list(function (node) {
		var attributes = node.attributes;
		var l = attributes.length;
		var i = 0;

		for (i; i < l; i++) {
			var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
			if (attributePattern.test(attribute)) return true;
			else if (i === l-1) return false;
		}
	});
};
