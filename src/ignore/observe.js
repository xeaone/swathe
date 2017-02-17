import Utility from './utility.js';

export default function Observe () {
	self.isProxy = Proxy ? true : false;
}

Observe.prototype._proxy = function (object, callback, prefix) {
	var self = this;

	if (!prefix) prefix = '';

	var handler = {
		get: function (target, property) {
			if (Utility.is('Object', target[property]) || Utility.is('Array', target[property])) {
				return self._proxy(target[property], callback, prefix + property + '.');
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
};

Observe.prototype._define = function (object, callback, prefix) {
	var self = this;

	var newObject = {};
	var properties = {};

	if (!prefix) prefix = '';

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

		if (Utility.is('Object', value)) {
			newObject[key] = self._define(value, callback, prefixObject);
		} else {
			properties[key] = handler(object, key, prefixVariable);
		}
	}

	return Object.defineProperties(newObject, properties);
};

Observe.prototype.object = function (object, callback, prefix) {
	if (this.isProxy) this._proxy(object, callback, prefix);
	else this._define(object, callback, prefix);
};

Observe.prototype.elements = function (elements, callback) {

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
};
