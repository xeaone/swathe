
// swathe 1.0.1
(function() {
	'use strict';

	function SyncView (data, valueBind) {
		var dataBindElements = document.querySelectorAll('[data-bind~=\"' + valueBind + '\"]');

		dataBindElements.forEach(function (dataBindElement) {
			var keyBindElement = dataBindElement.getAttribute('data-bind').split(':')[0].trim();
			var valueBindElement = dataBindElement.getAttribute('data-bind').split(':')[1].trim();
			if (valueBind === valueBindElement) dataBindElement[keyBindElement] = data;
		});
	}

	// might want to change to MutationObserver
	function ObserveElements (elements, callback) {
		elements.forEach(function (element) {
			element.addEventListener('change', function (e) { // only works input, select textarea
				var target = e.target;
				var value = target.value;
				var dataBind = target.getAttribute('data-bind');

				var keyBind = dataBind.split(':')[0].trim();
				var valueBind = dataBind.split(':')[1].trim();

				callback(value, keyBind, valueBind);
			}, false);
		});

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
			console.log(value);
			eval('self.model.' + valueBind + ' = value');
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



// function ObserveObject(object, callback, prefix) {
// 	if (!prefix) prefix = '';
//
// 	return new Proxy(object, {
// 		set: function(target, property, value) {
// 			if (target[property] === value) return true; // do not send change if value is not different
// 			target[property] = value;
// 			callback(prefix + property, value);
// 			return true;
// 		},
// 		get: function(target, property) {
// 			if (isObject(target[property])) return ObserveObject(target[property], callback, prefix + property + '.');
// 			else return target[property];
// 		}
// 	});
// }


// function getByPath(object, path) {
// 	var keys = path.split('.');
//
// 	for (var i = 0; i < keys.length; i++) {
// 		object = object[keys[i]];
// 		if (object === undefined) return undefined;
// 	}
//
// 	return object;
// }
//
// function setByPath(object, path, value) {
// 	if (typeof path === 'string') path = path.split('.');
//
// 	if (path.length > 1) {
// 		var e = path.shift();
// 		object[e] = Object.prototype.toString.call(object[e]) === '[object Object]' ? object[e] : {};
// 		setByPath(object[e], path, value);
// 	} else {
// 		object[path[0]] = value;
// 	}
//
// 	return object;
// }
