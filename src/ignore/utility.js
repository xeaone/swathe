
export default {

	is: function (type, value) {
		return !value ? false : value.constructor.name === type;
	},

	each: function (iterable, callback, scope) {
		var statment = null;

		if (this.is('Object', iterable)) {
			var k = null;

			for (k in iterable) {
				if (!iterable.hasOwnProperty(k)) continue;
				statment = callback.call(scope, iterable[k], k, iterable);
				if (statment) if (statment === 'break') break; else if (statment === 'continue') continue;
			}
		} else {
			var i = null;
			var l = null;

			for (i = 0, l = iterable.length; i < l; i++) {
				statment = callback.call(scope, iterable[i], i, iterable);
				if (statment) if (statment === 'break') break; else if (statment === 'continue') continue;
			}
		}

		return iterable;
	},

	toCamelCase: function (string) {
		var pattern = /(-.)/g;

		return string.replace(pattern, function (match) {
			return match[1].toUpperCase();
		});
	},

	getPathKeys: function (string) {
		string = string.replace(/(\])|(^data-s-)|(^s-)/g, '');
		string = string.replace('[', '.');
		string = this.toCamelCase(string);
		return string.split('.');
	},

	getByPath: function (object, path) {
		var keys = this.getPathKeys(path);
		var last = keys.length - 1;
		var obj = object;

		for (var i = 0; i < last; i++) {
			var prop = keys[i];
			if (!obj[prop]) return undefined;
			obj = obj[prop];
		}

		return obj[keys[last]];
	},

	setByPath: function (object, path, value) {
		var keys = this.getPathKeys(path);
		var last = keys.length - 1;
		var obj = object;

		for (var i = 0; i < last; i++) {
			var prop = keys[i];
			if (!obj[prop]) obj[prop] = {};
			obj = obj[prop];
		}

		obj[keys[last]] = value;
		return object;
	},

	removeChildren: function (element) {
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		return element;
	}

};

// export function isSwatheAttribute (string) {
// 	return /(^s-)|(^data-s)/.test(string);
// }
//
// export function normalizeAttribute (string) {
// 	string = string.replace(/^data-s-/, '');
// 	string = string.replace(/^s-/, '');
// 	string = toCamelCase(string);
// 	return string;
// }
