
(function() {
	'use strict';

	function SyncView (data, valueBind) {
		var dataBindElements = document.querySelectorAll('[data-bind~="' + valueBind + '"]');
		var i = 0;

		for (i; i < dataBindElements.length; i++) {
			var keyBindElement = dataBindElements[i].getAttribute('data-bind').split(':')[0].trim();
			dataBindElements[i][keyBindElement] = data;
		}
	}

	function ObserveElements (elements, callback) {
		var i = 0;

		for (i; i < elements.length; i++) {
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
		var self = this;

		if (!scope) throw new Error('Controller: scope parameter required');
		if (!model) throw new Error('Controller: model parameter required');

		scope = typeof scope === 'string' ? document.querySelector(scope) : scope;

		self._scope = scope;
		self._model = model;
		self._elements = scope.querySelectorAll('input[data-bind^="value"]');

		self.model = new ObserveObjects (self._model, function (value, path) {
			SyncView(value, path);
		});

		self.view = new ObserveElements (self._elements, function (value, keyBind, valueBind) {
			setByPath(valueBind, value);

			function setByPath (path, value) {
				var schema = self.model;  // moving reference
				var pathList = path.split('.');
				var last = pathList.length - 1;
				var i = 0;

				for(i; i < last; i++) {
					var item = pathList[i];
					if(!schema[item]) schema[item] = {};
					schema = schema[item];
				}

				schema[ pathList[ last ] ] = value;
			}
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
