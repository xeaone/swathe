
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

	function ObserveObjects (model, callback, path) {
		var self = this;

		var Options = function(m, k, p) {
			this.configurable = true;
			this.enumerable = true;
			this.get = function () {
				return m[k];
			};
			this.set = function (nv) {
				if (nv === m[k]) return null;
				m[k] = nv;
				callback(nv, p);
			};
		};

		for (var key in model) {
			if (model.hasOwnProperty(key)) {
				var value = model[key];
				var pathObject = !path ? key : path + '.' + key;
				var pathVariable = !path ? key : path + '.' + key;

				if (isObject(value)) self[key] = new ObserveObjects(value, callback, pathObject);
				else Object.defineProperty(self, key, new Options(model, key, pathVariable));
			}
		}
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

}());
