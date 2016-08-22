
(function() {
	'use strict';

	function ObserveElements (elements, callback) {
		for (var i = 0; i < elements.length; i++) {
			elements[i].addEventListener('input', function (e) { // input, select, textarea
				var target = e.target;
				var value = target.value;
				var dataBind = target.getAttribute('data-bind');

				var keyBind = dataBind.split(':')[0].trim();
				var valueBind = dataBind.split(':')[1].trim();

				callback(value, keyBind, valueBind);
			}, false);
		}

		return elements;
	}

	function ObserveObjects (object, callback, prefix) {
		if (!prefix) prefix = '';

		return new Proxy(object, {
			set: function(target, property, value) {
				if (target[property] === value) return true; // do not send change if value is not different
				target[property] = value;
				callback(value, prefix + property);
				return true;
			},
			get: function(target, property) {
				if (isObject(target[property])) return ObserveObjects(target[property], callback, prefix + property + '.');
				else return target[property];
			}
		});
	}

	function Controller(scope, model) {
		var self = {};

		if (!scope) throw new Error('Controller: scope parameter required');
		if (!model) throw new Error('Controller: model parameter required');

		scope = typeof scope === 'string' ? document.querySelector(scope) : scope;

		self._scope = scope;
		self._model = model;
		self._elements = scope.querySelectorAll('[data-bind^="value"]');

		self.model = ObserveObjects (self._model, function (value, path) {
			updateView(value, path);
		});

		self.view = ObserveElements (self._elements, function (value, keyBind, valueBind) {
			setByPath(self.model, valueBind, value);
		});

		initView(self.model);

		return self;
	}


	window.Swathe = Controller;

	/*
		internal
	*/

	function initView (model) {
		var dataBindElements = document.querySelectorAll('[data-bind]');

		for (var i = 0; i < dataBindElements.length; i++) {
			var keyBindElement = dataBindElements[i].getAttribute('data-bind').split(':')[0].trim();
			var valueBindElement = dataBindElements[i].getAttribute('data-bind').split(':')[1].trim();
			var value = getByPath(model, valueBindElement);
			if (keyBindElement !== 'value') setByPath(dataBindElements[i], keyBindElement, value);
		}
	}

	function updateView (data, valueBind) {
		var dataBindElements = document.querySelectorAll('[data-bind~="' + valueBind + '"]');

		for (var i = 0; i < dataBindElements.length; i++) {
			var keyBindElement = dataBindElements[i].getAttribute('data-bind').split(':')[0].trim();
			if (keyBindElement !== 'value') setByPath(dataBindElements[i], keyBindElement, data);
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
