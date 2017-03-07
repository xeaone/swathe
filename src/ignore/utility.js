
export default {
	GET: 2,
	SET: 3,
	prefix: /(data-)?s-/,

	uid: function () {
		return Math.random().toString(36).substr(2, 9);
	},

	toCamelCase: function (data) {
		if (data.constructor.name === 'Array') data = data.join('-');
		return data.replace(/-[a-z]/g, function (match) {
			return match[1].toUpperCase();
		});
	},

	toDashCase: function (data) {
		if (data.constructor.name === 'Array') data = data.join('');
		return data.replace(/[A-Z]/g, function (match) {
			return '-' + match.toLowerCase();
		});
	},

	ensureBoolean: function (value) {
		if (typeof value === 'string') return value === 'true';
		else return value;
	},

	ensureString: function (value) {
		if (typeof value === 'object') return JSON.stringify(value);
		else return value.toString();
	},

	/*
		object
	*/

	interact: function (type, collection, path, value) {
		var keys = this.toCamelCase(path).split('.');
		var last = keys.length - 1;
		var temporary = collection;

		for (var i = 0; i < last; i++) {
			var property = keys[i];

			if (temporary[property] === null || temporary[property] === undefined) {
				if (type === this.GET) {
					return undefined;
				} else if (type === this.SET) {
					temporary[property] = {};
				}
			}

			temporary = temporary[property];
		}

		if (type === this.GET) {
			return temporary[keys[last]];
		} else if (type === this.SET) {
			temporary[keys[last]] = value;
			return collection;
		}
	},

	getByPath: function (collection, path) {
		return this.interact(this.GET, collection, path);
	},

	setByPath: function (collection, path, value) {
		return this.interact(this.SET, collection, path, value);
	},

	/*
		DOM
	*/

	glance: function (element) {
		var attribute, glance = element.nodeName.toLowerCase();

		for (var i = 0, l = element.attributes.length; i < l; i++) {
			attribute = element.attributes[i];
			glance = glance + ' ' + attribute.name + '="' + attribute.value + '"';
		}

		return glance;
	},

	eachAttribute: function (attributes, pattern, callback) {
		var i = 0, attribute = {};

		for (i; i < attributes.length; i++) {
			attribute = {
				name: attributes[i].name,
				value: attributes[i].value,
				full: attributes[i].name + '="' + attributes[i].value + '"'
			};

			if (pattern && pattern.test(attribute.full)) {
				if (callback) callback(attribute);
			}
		}
	},

	eachElement: function (elements, reject, skip, accept, callback) {
		var i = 0, element, glance;

		for (i; i < elements.length; i++) {
			element = elements[i];
			glance = this.glance(element);

			if (reject && reject.test(glance)) {
				i += element.children.length;
			} else if (skip && skip.test(glance)) {
				continue;
			} else if (accept && accept.test(glance)) {
				if (callback) i = callback(element, i) || i;
			}
		}
	}

};


// eachParent: function (element, reject, accept) {
// 	var child = element, parent = child.parentNode, glance;
//
// 	if (reject && typeof reject === 'string') reject = new RegExp(reject);
// 	if (accept && typeof accept === 'string') accept = new RegExp(accept);
//
// 	while (parent) {
// 		glance = this.glance(parent);
//
// 		if (reject && reject.test(glance)) {
// 			return null;
// 		} else if (accept && accept.test(glance)) {
// 			return { parent: parent, child: child };
// 		}
//
// 		child = parent;
// 		parent = child.parentNode;
// 	}
// }

// toCleanCase: function (string) {
// 	return string.replace(/(\[)|(\])/g, function (match) {
// 		return match === '[' ? '.' : '';
// 	});
// },

// getPathKeys: function (string) {
// 	return this.toCamelCase(this.toCleanCase(string)).split('.');
// },

// getPathParent: function (string) {
// 	var parent = string.split('.').slice(0, -1).join('.');
// 	return parent === '' ? string : parent;
// },

// stringifyElement: function (element) {
// 	return element.outerHTML.replace(/>(.*?)$/, '').replace('<', '');
// },

// isVoid: function (value) {
// 	return value === null || value === undefined;
// },

// is: function (type, value) {
// 	return !value ? false : value.constructor.name === type;
// },

// each: function (iterable, callback, scope) {
// 	var i = null, l = null;
//
// 	if (iterable && iterable.constructor.name === 'Object') {
// 		for (i in iterable) {
// 			if (iterable.hasOwnProperty(i)) {
// 				callback.call(scope, iterable[i], i, iterable);
// 			}
// 		}
// 	} else {
// 		for (i = 0, l = iterable.length; i < l; i++) {
// 			callback.call(scope, iterable[i], i, iterable);
// 		}
// 	}
//
// 	return iterable;
// },

// id: function () {
// 	return Math.random().toString(36).substr(2, 9);
// },
