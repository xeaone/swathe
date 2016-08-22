
(function() {
	'use strict';

	function ObserveElements (elements, callback) {
		for (var i = 0; i < elements.length; i++) {
			elements[i].addEventListener('input', function (e) { // input, select, textarea
				var target = e.target;
				var value = target.value;
				var dataS = target.getAttribute('data-s');

				var keyS = dataS.split(':')[0].trim();
				var valueS = dataS.split(':')[1].trim();

				callback(value, keyS, valueS);
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
		self._elements = scope.querySelectorAll('[data-s^=\"value\"]');

		self.model = ObserveObjects (self._model, function (value, path) {
			updateView(value, path);
		});

		self.view = ObserveElements (self._elements, function (value, keyS, valueS) {
			setByPath(self.model, valueS, value);
		});

		initView(self.model);

		return self;
	}


	window.Swathe = Controller;

	/*
		internal
	*/

	function initView (model) {
		var dataSElements = document.querySelectorAll('[data-s]');

		for (var i = 0; i < dataSElements.length; i++) {
			var keySElement = dataSElements[i].getAttribute('data-s').split(':')[0].trim();
			var valueSElement = dataSElements[i].getAttribute('data-s').split(':')[1].trim();
			var value = getByPath(model, valueSElement);
			if (keySElement !== 'value') setByPath(dataSElements[i], keySElement, value);
		}
	}

	function updateView (data, valueS) {
		var dataSElements = document.querySelectorAll('[data-s~="' + valueS + '"]');

		for (var i = 0; i < dataSElements.length; i++) {
			var keySElement = dataSElements[i].getAttribute('data-s').split(':')[0].trim();
			if (keySElement !== 'value') setByPath(dataSElements[i], keySElement, data);
		}
	}

	function getByPath (schema, path) {
		var pathList = path.split('.');
		var last = pathList.length - 1;

		for (var i = 0; i < last; i++) {
			var item = pathList[i];
			if(!schema[item]) schema[item] = {};
			schema = schema[item];
		}

		return schema[ pathList[ last ] ];
	}

	function setByPath (schema, path, value) {
		var pathList = path.split('.');
		var last = pathList.length - 1;

		for (var i = 0; i < last; i++) {
			var item = pathList[i];
			if(!schema[item]) schema[item] = {};
			schema = schema[item];
		}

		schema[ pathList[ last ] ] = value;
	}

	function isObject (value) {
		if (value === null || value === undefined) return false;
		else return value.constructor === Object;
	}

}());
