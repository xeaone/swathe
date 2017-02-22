var REJECTED_TAGS = /(iframe)|(script)|(style)|(link)|(object)/i;
var REJECTED_ATTRIBUTES = /(s-controller")|(data-s-controller")/i;

export default function View (data) {
	this.view = data.view;
	this.elements = this.view.getElementsByTagName('*');
}

View.prototype.atts = function (element, pattern, callback) {
	var attributes = element.attributes;
	var results = [];
	var result = {};

	for (var i = 0, l = attributes.length; i < l; i++) {
		result.value = attributes[i].value;
		result.name = attributes[i].name;
		result.attribute = result.name + '="' + result.value + '"';

		if (pattern.test(result.attribute)) {
			results.push(result);
			if (callback) callback(result);
			else return true;
		}
	}

	if (callback) return results;
	else return false;
};

View.prototype.isTag = function (element, pattern) {
	var tag = element.tagName.toLowerCase();

	if (pattern.test(tag)) {
		return true;
	}

	return false;
};

View.prototype.isAttribute = function (element, pattern) {
	return this.atts(element, pattern);
};

View.prototype.isRejected = function (element) {
	var isTag = this.isTag(element, REJECTED_TAGS);
	var isAttribute = this.isAttribute(element, REJECTED_ATTRIBUTES);
	return isTag || isAttribute;
};

View.prototype.eles = function (elements, callback) {
	var i = 0, element = null, results = [];

	for (i; i < elements.length; i++) {
		element = elements[i];

		if (this.isRejected(element)) { // rejects element and its children
			i = i + element.children.length;
			element = elements[i];
		} else {
			results.push(element);
			if (callback) callback(element);
		}
	}

	return results;
};

View.prototype.each = function (elements, pattern, callback) {
	var self = this;

	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

	self.eles(elements, function (element) {
		self.atts(element, pattern, function (attribute) {
			callback(element, attribute);
		});
	});
};

View.prototype.change = function (callback) {
	var value = null;

	this.view.addEventListener('change', function (e) {
		value = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
		// TODO might need to check correct view
		if (value) callback(value, e.target.value);
	}, false);
};

// View.prototype.traverseAttributes = function (pattern, callback) {
// 	var self = this;
// 	var elements = self.elements;
//
// 	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
//
// 	self.eles(elements, function (element) {
// 		self.atts(element, pattern, function (attribute) {
// 			callback(element, attribute);
// 		});
// 	});
// };

// View.prototype.filter = function (callback) {
// 	var elements = [];
//
// 	this.eles(function (element) {
// 		if (callback ? callback(element) : true) {
// 			elements.push(element);
// 		}
// 	});
//
// 	return elements;
// };

// View.prototype.findByTag = function (pattern, callback) {
// 	var self = this;
// 	var result = null;
//
// 	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
//
// 	return self.filter(function (element) {
// 		result = self.isTag(element, pattern);
// 		if (result && callback) callback(element, result);
// 		return result;
// 	});
// };

// View.prototype.findByAttribute = function (pattern, callback) {
// 	var self = this;
// 	var result = null;
//
// 	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
//
// 	return self.filter(function (element) {
// 		result = self.isAttribute(element, pattern);
// 		if (result && callback) callback(element, result);
// 		return result;
// 	});
// };
