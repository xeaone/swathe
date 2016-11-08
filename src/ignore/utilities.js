function is (type, value) {
	return !value ? false : value.constructor.name === type;
}

function each (iterable, callback, scope) {
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
}

function getByPath (object, path) {
	var keys = path.swathe.pathKeys();
	var last = keys.length - 1;
	var obj = object;

	for (var i = 0; i < last; i++) {
		var prop = keys[i];
		if (!obj[prop]) return undefined;
		obj = obj[prop];
	}

	return obj[keys[last]];
}

function setByPath (object, path, value) {
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
}

function toCamelCase (string) {
	var pattern = /(-.)|(\..)/g;

	return string.replace(pattern, function (match) {
		return match[1].toUpperCase();
	});
}

function toDashCase (string) {
	var pattern = /[A-Z]/g;

	return string.replace(pattern, function (match) {
		return '-' + match.toLowerCase();
	});
}

function toDotCase (string) {
	var pattern = /[A-Z]/g;

	return string.replace(pattern, function (match) {
		return '.' + match.toLowerCase();
	});
}

function isSAttribute (string) {
	return /(^s-)|(^data-s)/.test(string);
}

function toCleanAttribute (string) {
	string = string.replace(/^data-s-/, '');
	string = string.replace(/^s-/, '');
	return string;
}

export { is, each, getByPath, setByPath, toCamelCase, toDashCase, toDotCase, isSAttribute, toCleanAttribute };
