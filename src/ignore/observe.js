import { is } from './utilities.js';

export function observeElements (elements, callback) {

	// event input works on: input, select, textarea
	var eventHandler = function (e) {
		var target = e.target;
		var value = target.getAttribute('s-value') || target.getAttribute('data-s-value');
		callback(name, value, target.value, target);
	};

	elements.forEach(function (element) {
		element.addEventListener('input', eventHandler);
	});

	return elements;
}

export function observeObjectsProxy (object, callback, prefix) {
	if (!prefix) prefix = '';

	var handler = {
		get: function (target, property) {
			if (is('Object', target[property]) || is('Array', target[property])) {
				return observeObjectsProxy(target[property], callback, prefix + property + '.');
			} else {
				return target[property];
			}
		},
		set: function (target, property, value) {
			if (target[property] !== value) { // send change if value is different
				target[property] = value;
				callback(prefix + property, value);
			}

			return true;
		}
	};

	return new Proxy(object, handler);
}

export function observeObjectsDefine (object, callback, prefix) {
	var self = {};
	var properties = {};

	var handler = function(o, k, p) {
		return {
			enumerable: true,
			configurable: true,
			get: function () {
				return o[k];
			},
			set: function (nv) {
				if (nv !== o[k]) {
					o[k] = nv;
					callback(p, nv);
				}
			}
		};
	};

	for (var key in object) {
		var value = object[key];
		var prefixObject = !prefix ? key : prefix + '.' + key;
		var prefixVariable = !prefix ? key : prefix + '.' + key;

		if (is('Object', value)) {
			self[key] = observeObjectsDefine(value, callback, prefixObject);
		} else {
			properties[key] = handler(object, key, prefixVariable);
		}
	}

	return Object.defineProperties(self, properties);
}
