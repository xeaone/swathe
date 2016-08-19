
(function() {
	'use strict';

	function SyncView (data, valueBind) {
		var dataBindElements = document.querySelectorAll('[data-bind~=\"' + valueBind + '\"]');

		for (var i = 0; i < dataBindElements.length; i++) {
			var keyBindElement = dataBindElements[i].getAttribute('data-bind').split(':')[0].trim();
			var valueBindElement = dataBindElements[i].getAttribute('data-bind').split(':')[1].trim();
			if (valueBind === valueBindElement) dataBindElements[i][keyBindElement] = data;
		}
	}

	// might want to change to MutationObserver
	function ObserveElements (elements, callback) {
		for (var i = 0; i < elements.length; i++) {
			elements[i].addEventListener('input', function (e) { // only works input, select textarea
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
		var self = this;

		if (!scope) throw new Error('Controller: scope parameter required');
		if (!model) throw new Error('Controller: model parameter required');

		scope = typeof scope === 'string' ? document.querySelector(scope) : scope;

		self._scope = scope;
		self._model = model;
		self._elements = scope.querySelectorAll('[data-bind^=\"value\"]');

		self.model = new ObserveObjects (self._model, function (value, path) {
			SyncView(value, path);
		});

		self.view = new ObserveElements (self._elements, function (value, keyBind, valueBind) {
			// console.log(value);
			eval('self.model.' + valueBind + ' = value'); //TODO: change from eval
		});
	}


	window.Swathe = {
		controller: function (scope, model) {
			return new Controller(scope, model);
		}
	};

	/*
		internal
	*/

	function isObject (value) {
		if (value === null || value === undefined) return false;
		else return value.constructor === Object;
	}

	function getByPath(object, path) {
		var keys = path.split('.');

		for (var i = 0; i < keys.length; i++) {
			object = object[keys[i]];
			if (object === undefined) return undefined;
		}

		return object;
	}

	function setByPath(object, path, value) {
		if (typeof path === 'string') path = path.split('.');

		if (path.length > 1) {
			var e = path.shift();
			object[e] = Object.prototype.toString.call(object[e]) === '[object Object]' ? object[e] : {};
			setByPath(object[e], path, value);
		} else {
			object[path[0]] = value;
		}
	}

}());
