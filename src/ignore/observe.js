import Utility from './utility.js';

export default function Observe (data) {
	this.scope = data.scope;
	this.view = data.view;
	this.model = data.model;
	this.render = data.render;

	this.event = data.event || 'change';

	this.isObservingObject = false;
	this.isObservingElement = false;
	this.isProxy = Proxy ? true : false;
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

Observe.prototype.object = function (object, callback) {
	if (typeof object === 'function') {
		callback = object;
		object = null;
	}

	object = object || this.model;
	this.isObservingObject = true;

	if (this.isProxy) return this._proxy(object, callback);
	else return this._define(object, callback);
};

Observe.prototype._mutation = function () {

};

Observe.prototype._change = function (element, callback) {
	var value = null;

	document.addEventListener(this.event, function (e) {
		value = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
		if (value) callback(name, value, e.target.value, e.target);
	}, false);
};

Observe.prototype.element = function (element, callback) {
	if (typeof element === 'function') {
		callback = element;
		element = null;
	}

	element = element || this.scope;
	this.isObservingElement = true;

	this._change(element, callback);
};
