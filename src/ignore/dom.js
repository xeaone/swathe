/*
	Node is accepted.
		NodeFilter.FILTER_ACCEPT = 1

	Child nodes are also rejected.
		NodeFilter.FILTER_REJECT = 2

	Child nodes are not skipped.
		NodeFilter.FILTER_SKIP = 3
*/

var Dom = function (treeNode, treeFilter) {
	this.treeNode = treeNode;
	this.treeFilter = treeFilter;
	this.tree = document.createTreeWalker(this.treeNode, NodeFilter.SHOW_ELEMENT, this.treeFilter, false);
};

Dom.prototype.filter = function (filter) {
	var node = this.tree.currentNode;
	var nodes = [];

	while (node) {
		if (filter ? filter(node) : true) {
			nodes.push(node);
		}

		node = this.tree.nextNode();
	}

	return nodes;
};

Dom.prototype.findByTag = function (tag) {
	var tagPattern = new RegExp(tag);

	return this.filter(function (node) {
		return tagPattern.test(node.tagName.toLowerCase());
	});
};

Dom.prototype.findByAttribute = function (options) {
	var namePattern = new RegExp(options.name);
	var valuePattern = new RegExp(options.value);

	return this.filter(function (node) {
		var attributes = node.attributes;
		var l = attributes.length;
		var i = 0;

		if (options.name && options.value) {
			for (i; i < l; i++) {
				return namePattern.test(attributes[i].name) && valuePattern.test(attributes[i].value);
			}
		} else if (options.name) {
			for (i; i < l; i++) {
				return namePattern.test(attributes[i].name);
			}
		} else if (options.value) {
			for (i; i < l; i++) {
				return valuePattern.test(attributes[i].value);
			}
		}

	});
};

export { Dom };
