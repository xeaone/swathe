
export function is (type, value) {
	return !value ? false : value.constructor.name === type;
}

export function each (iterable, callback, scope) {
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

function getPathKeys (string) {
	string = string.replace(/(\])|(^data-s-)|(^s-)/g, '');
	string = string.replace('[', '.');
	string = toCamelCase(string);
	return string.split('.');
}

export function getByPath (object, path) {
	var keys = getPathKeys(path);
	var last = keys.length - 1;
	var obj = object;

	for (var i = 0; i < last; i++) {
		var prop = keys[i];
		if (!obj[prop]) return undefined;
		obj = obj[prop];
	}

	return obj[keys[last]];
}

export function setByPath (object, path, value) {
	var keys = getPathKeys(path);
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

export function removeChildren (element) {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}

	return element;
}

export function toCamelCase (string) {
	var pattern = /(-.)/g;

	return string.replace(pattern, function (match) {
		return match[1].toUpperCase();
	});
}

export function isSwatheAttribute (string) {
	return /(^s-)|(^data-s)/.test(string);
}

export function normalizeAttribute (string) {
	string = string.replace(/^data-s-/, '');
	string = string.replace(/^s-/, '');
	string = toCamelCase(string);
	return string;
}
