/*
*/

var Dom = function (options) {
	this.options = options || {};
	this.nodes = this.options.scope.getElementsByTagName('*');
};

Dom.prototype.list = function (filter) {
	var l = this.nodes.length;
	var node = null;
	var nodes = [];
	var i = 0;

	for (i; i < l; i++) {
		node = this.nodes[i];

		if (filter ? filter(node) : true) {
			nodes.push(node);
		}
	}

	return nodes;
};

Dom.prototype.filter = function (filter) {
	var filters = this.options.filters;

	if (filters) {
		if (filters.attributes) var attributesPattern = new RegExp(filters.attributes.join('|'));
		if (filters.tags) var tagsPattern = new RegExp(filters.tags.join('|'));
	}

	return this.list(function (node) {
		var attributesResult = true;
		var tagsResult = true;

		if (filters) {
			if (filters.tags) {
				var tag = node.tagName.toLowerCase();
				tagsResult = !tagsPattern.test(tag);
			}

			if (filters.attributes) {
				var l = node.attributes.length;
				var i = 0;

				for (i; i < l; i++) {
					var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
					if (!attributesPattern.test(attribute)) {
						attributesResult = true;
						break;
					} else {
						attributesResult = false;
					}
				}
			}
		}

		if (tagsResult && attributesResult) {
			return filter ? filter(node) : true;
		} else {
			return false;
		}

	});
};

Dom.prototype.findByTag = function (tag) {
	var tagPattern = new RegExp(tag);

	return this.filter(function (node) {
		return tagPattern.test(node.tagName.toLowerCase());
	});
};

Dom.prototype.findByAttribute = function (attribute) {
	var attributePattern = new RegExp(attribute);

	return this.filter(function (node) {
		var attributes = node.attributes;
		var l = attributes.length;
		var i = 0;

		for (i; i < l; i++) {
			var attributeNode = node.attributes[i].name + '="' + node.attributes[i].value + '"';
			if (attributePattern.test(attributeNode)) return true;
		}

	});
};

export { Dom };
