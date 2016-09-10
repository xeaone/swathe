
(function() {
	'use strict';

	function ObserveElements (elements, callback) {
		for (var i = 0, l = elements.length; i < l; i++) {
			elements[i].addEventListener('input', function (e) { // input, select, textarea
				var target = e.target;
				var value = target.value;
				var attribute = target.getAttribute('data-s');

				var sValue = attribute.split(':')[1].trim();

				callback(value, sValue);
			}, false);
		}

		return elements;
	}

	function ObserveObjects (model, callback, path) {
		var self = {};

		var Options = function(m, k, p) {
			var t = {};

			t.configurable = true;
			t.enumerable = true;
			t.get = function () {
				return m[k];
			};
			t.set = function (nv) {
				if (nv === m[k]) return null;
				m[k] = nv;
				callback(nv, p);
			};

			return t;
		};

		for (var key in model) {
			var value = model[key];
			var pathObject = !path ? key : path + '.' + key;
			var pathVariable = !path ? key : path + '.' + key;

			if (isObject(value)) self[key] = ObserveObjects(value, callback, pathObject);
			else Object.defineProperty(self, key, Options(model, key, pathVariable));
		}

		return self;
	}

	function Controller(scope, model) {
		var self = {};

		if (!scope) throw new Error('Controller: scope parameter required');
		if (!model) throw new Error('Controller: model parameter required');

		scope = typeof scope === 'string' ? document.querySelector(scope) : scope;

		self._scope = scope;
		self._model = model;
		self._elements = scope.querySelectorAll('input[data-s^="value:"], select[data-s^="value:"], textarea[data-s^="value:"]');

		self.model = ObserveObjects (self._model, function (value, path) {
			updateView(value, path);
		});

		self.view = ObserveElements (self._elements, function (value, path) {
			setByPath(self.model, path, value);
		});

		initalizeView(self.model);

		return self;
	}

	window.Swathe = Controller;

	/*
		internal
	*/

	function initalizeView (model) {
		var elements = document.querySelectorAll('[data-s]:not(input):not(select):not(textarea)');

		for (var i = 0, l = elements.length; i < l; i++) {
			var sKey = elements[i].getSwatheKey();
			var sValue = elements[i].getSwatheValue();
			var value = getByPath(model, sValue);
			setByPath(elements[i], sKey, value);
		}
	}

	function updateView (data, valueS) {
		var elements = document.querySelectorAll('[data-s~="' + valueS + '"]:not(input):not(select):not(textarea)');

		for (var i = 0, l = elements.length; i < l; i++) {
			var sKey = elements[i].getSwatheKey();
			setByPath(elements[i], sKey, data);
		}
	}

	function getByPath(object, path) {
		var keys = path.getSwathePathKeys();
		var last = keys.length - 1;
		var obj = object;

		for (var i = 0; i < last; i++) {
			var prop = keys[i];
			if (!obj[prop]) return undefined;
			obj = obj[prop];
		}

		return obj[keys[last]];
	}

	function setByPath(object, path, value) {
		var keys = path.getSwathePathKeys();
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

	function isObject (value) {
		if (value === null || value === undefined) return false;
		else return value.constructor === Object;
	}

	HTMLElement.prototype.getSwatheKey = function () {
		return this.getAttribute('data-s').split(':')[0].trim();
	};

	HTMLElement.prototype.getSwatheValue = function () {
		return this.getAttribute('data-s').split(':')[1].trim();
	};

	String.prototype.getSwathePathKeys = function () {
		return this.replace('[', '.').replace(']', '').split('.');
	};

}());
