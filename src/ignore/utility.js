
export default {
	GET: 2, SET: 3,

	id: function () {
		return Math.random().toString(36).substr(2, 9);
	},

	interact: function (type, collection, path, value) {
		var keys = this.getPathKeys(path);
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

	toCleanCase: function (string) {
		return string.replace(/(\[)|(\])/g, function (match) {
			return match === '[' ? '.' : '';
		});
	},

	toCamelCase: function (string) {
		return string.replace(/-[a-z]/g, function (match) {
			return match[1].toUpperCase();
		});
	},

	toDashCase: function ( string ) {
		return string.replace(/[A-Z]/g, function (match) {
			return '-' + match.toLowerCase();
		});
	},

	getPathKeys: function (string) {
		return this.toCamelCase(this.toCleanCase(string)).split('.');
	},

	getPathParent: function (string) {
		var parent = string.split('.').slice(0, -1).join('.');
		return parent === '' ? string : parent;
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

	removeChildren: function (element) {
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		return element;
	},

	forEachAttribute: function (element, pattern, callback) {
		var attributes = element.attributes;
		var i = 0, results = [];

		for (i; i < attributes.length; i++) {
			var result = {
				value: attributes[i].value,
				name: attributes[i].name,
				attribute: attributes[i].name + '="' + attributes[i].value + '"'
			};

			if (pattern.test(result.attribute)) {
				results.push(result);
				if (callback) callback(result);
			}
		}

		return results;
	},

	forEachElement: function (element, reject, skip, accept, callback) {
		var elements = element.getElementsByTagName('*');
		var i = 0, results = [], string;

		for (i; i < elements.length; i++) {
			var result = elements[i];
			string = result.outerHTML.replace(result.innerHTML, '');

			if (reject && reject.test(string)) {
				i += result.children.length;
			} else if (skip && skip.test(string)) {
				continue;
			} else if (accept && accept.test(string)) {
				results.push(result);
				if (callback) callback(result);
			}
		}

		return results;
	}

};

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
