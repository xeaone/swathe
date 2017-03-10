import Utility from './utility.js';

export default function ModelInterface (data) {
	this.model = data.model;
	this.isProxy = Proxy ? true : false;
}

ModelInterface.prototype.proxy = function (object, callback, prefix) {
	var self = this, value;

	if (!prefix) prefix = '';

	var handler = {
		get: function (target, property) {
			value = target[property];

			if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
				return self.proxy(value, callback, prefix + property + '.');
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
};

ModelInterface.prototype.define = function (object, callback, prefix) {
	var self = this, newObject = {}, properties = {};

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
			newObject[key] = self.define(value, callback, prefixObject);
		} else {
			properties[key] = handler(object, key, prefixVariable);
		}
	}

	return Object.defineProperties(newObject, properties);
};

ModelInterface.prototype.get = function (path) {
	return Utility.getByPath(this.model, path);
};

ModelInterface.prototype.set = function (path, data) {
	Utility.setByPath(this.model, path, data);
};

ModelInterface.prototype.setup = function (ViewInterface) {
	var self = this;

	self.ViewInterface = ViewInterface;

	function change (key, value) {
		key = Utility.getPathParent(key);
		key = new RegExp('(s-)(.*?)="' + key);
		self.ViewInterface.update(null, key);
	}

	if (self.isProxy) {
		self.model = self.proxy(self.model, change);
	} else {
		self.model = self.define(self.model, change);
	}
};
