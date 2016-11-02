var is = function (type, value) {
	return !value ? false : value.constructor.name === type;
};

var each = function (iterable, callback, scope) {
	var statment = null, i = null, l = null, k = null;

	if (is('Number', iterable)) {
		for (i = 0; i < iterable; i++) {
			statment = callback.call(scope, i, iterable);
			if (statment === 'break') break;
			else if (statment === 'continue') continue;
		}
	} else if (is('Object', iterable)) {
		for (k in iterable) {
			if (!iterable.hasOwnProperty(k)) continue;
			statment = callback.call(scope, iterable[k], k, iterable);
			if (statment === 'break') break;
			else if (statment === 'continue') continue;
		}
	} else {
		for (i = 0, l = iterable.length; i < l; i++) {
			statment = callback.call(scope, iterable[i], i, iterable);
			if (statment === 'break') break;
			else if (statment === 'continue') continue;
		}
	}

	return iterable;
};

var getByPath = function (object, path) {
	var keys = path.swathe.pathKeys();
	var last = keys.length - 1;
	var obj = object;

	for (var i = 0; i < last; i++) {
		var prop = keys[i];
		if (!obj[prop]) return undefined;
		obj = obj[prop];
	}

	return obj[keys[last]];
};

var setByPath = function (object, path, value) {
	var keys = path.swathe.pathKeys();
	var last = keys.length - 1;
	var obj = object;

	for (var i = 0; i < last; i++) {
		var prop = keys[i];
		if (!obj[prop]) obj[prop] = {};
		obj = obj[prop];
	}

	obj[keys[last]] = value;
	return object;
};

var toCamelCase = function (string) {
	var nextIndex = string.search('-') + 1;
	var nextLetter = string.charAt(nextIndex).toString();
	var r = '-' + nextLetter;
	var n = nextLetter.toUpperCase();
	return string.replace(r, n);
};

export { is, each, getByPath, setByPath, toCamelCase };
