
function proxy (object, callback, prefix) {
	var value = null;

	if (!prefix) prefix = '';

	var handler = {
		get: function (target, property) {
			value = target[property];

			if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
				return proxy(value, callback, prefix + property + '.');
			} else {
				return value;
			}
		},
		set: function (target, property, value) {
			if (target[property] !== value) { // send change if value is different
				target[property] = value;
				if (callback) callback(prefix + property, value);
			}

			return true;
		}
	};

	return new Proxy(object, handler);
}

function define (object, callback, prefix) {
	var newObject = {};
	var properties = {};

	var key = null;
	var value = null;
	var prefixObject = null;
	var prefixVariable = null;

	if (!prefix) prefix = '';

	function handler (o, k, p) {
		return {
			enumerable: true,
			configurable: true,
			get: function () {
				return o[k];
			},
			set: function (nv) {
				if (nv !== o[k]) {
					o[k] = nv;
					if (callback) callback(p, nv);
				}
			}
		};
	}

	for (key in object) {
		value = object[key];
		prefixObject = !prefix ? key : prefix + '.' + key;
		prefixVariable = !prefix ? key : prefix + '.' + key;

		if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
			newObject[key] = define(value, callback, prefixObject);
		} else {
			properties[key] = handler(object, key, prefixVariable);
		}
	}

	return Object.defineProperties(newObject, properties);
}

export default function Model (data) {
	var self = this;

	self.isProxy = Proxy ? true : false;
	self.callback = function (key, value) { self._change(key, value); };

	if (self.isProxy) self.model = proxy(data.model, self.callback);
	else self.model = define(data.model, self.callback);
}

Model.prototype.change = function (callback) {
	this._change = callback;
};
