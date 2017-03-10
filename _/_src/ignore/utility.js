
export default {
	GET: 2,
	SET: 3,
	STRIP_HTML: />(.*?)$/,

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

	// parseArguments: function () {
	//
	// },

	ensureBoolean: function (value) {
		if (typeof value === 'string') return value === 'true';
		else return value;
	},

	ensureString: function (value) {
		if (typeof value === 'object') return JSON.stringify(value);
		else return value.toString();
	},

	toCleanCase: function (string) {
		return string.replace(/(\[)|(\])/g, function (match) {
			return match === '[' ? '.' : '';
		});
	},

	toCamelCase: function (data) {
		if (data === null || data === undefined) {
			throw new Error('toCamelCase: argument required');
		} else if (data.constructor.name === 'Array') {
			data = data.join('-');
		}

		return data.replace(/-[a-z]/g, function (match) {
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

	// removeChildren: function (element) {
	// 	while (element.firstChild) {
	// 		element.removeChild(element.firstChild);
	// 	}
	//
	// 	return element;
	// },

	forEachAttribute: function (element, reject, skip, accept, callback) {
		var i = 0, attributes = element.attributes, result = {};

		for (i; i < attributes.length; i++) {
			result.value = attributes[i].value;
			result.name = attributes[i].name;
			result.attribute = attributes[i].name + '="' + attributes[i].value + '"';

			if (reject && reject.test(result.attribute)) {
				i += result.children.length;
			} else if (skip && skip.test(result.attribute)) {
				continue;
			} else if (accept && accept.test(result.attribute)) {
				if (callback) callback(result);
			}
		}
	},

	forEachElement: function (element, reject, skip, accept, callback) {
		var elements = element.getElementsByTagName('*');
		var i = 0, result = '', string  = '';

		for (i; i < elements.length; i++) {
			result = elements[i];
			string = result.outerHTML.replace(this.STRIP_HTML, '');

			if (reject !== null && reject.test(string)) {
				i += result.children.length;
			} else if (skip !== null && skip.test(string)) {
				continue;
			} else if (accept !== null && accept.test(string)) {
				if (callback) callback(result);
			}
		}
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
