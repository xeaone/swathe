
(function() {
	'use strict';

	function ObserveElements (elements, callback) {
		each(elements, function (element) {
			element.addEventListener('input', function (e) { // event input works on: input, select, textarea
				var target = e.target;
				var value = target.value;
				var attribute = target.getAttribute('data-s');

				var sValue = attribute.split(':')[1].trim();

				callback(value, sValue);
			}, false);
		});

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
				if (isObject(target[property]) || isArray(target[property])) return ObserveObjects(target[property], callback, prefix + property + '.');
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
		self._elements = scope.querySelectorAll('input[data-s^="value:"], select[data-s^="value:"], textarea[data-s^="value:"]');

		self.model = ObserveObjects (self._model, function (value, path) {
			updateElementsValueByPath(self.model, value, path);
		});

		self.view = ObserveElements (self._elements, function (value, path) {
			setByPath(self.model, path, value);
		});

		updateView(self.model);

		return self;
	}

	window.Swathe = Controller;

	/*
		internal
	*/

	function updateElementsValueByPath (model, value, path) {
		var elements = null;
		var query = null;

		if (isObject(value) || isArray(value)) {
			// query = '[data-s~="' + path + '"]';
			// elements = document.querySelectorAll(query);
			// updateView(model, elements);
		}

		query = '[data-s~="' + path + '"]:not(input):not(select):not(textarea):not([data-s^="for:"])';
		elements = document.querySelectorAll(query);

		each(elements, function (element) {
			var sKey = element.getSwatheKey();
			setByPath(element, sKey, value);
		});
	}

	function updateView (model, scope) {

		var forElements = document.querySelectorAll('[data-s^="for:"]');

		each(forElements, function (element) {
			var sKey = element.getSwatheKey();
			var sValue = element.getSwatheValue();
			initalizeForChildren(model, element, sKey, sValue);
		});

		scope = (scope) ? scope : document;
		var elements = scope.querySelectorAll('[data-s]:not(input):not(select):not(textarea):not([data-s^="for:"])');

		each(elements, function (element) {
			var sKey = element.getSwatheKey();
			var sValue = element.getSwatheValue();

			var mValue = getByPath(model, sValue);
			setByPath(element, sKey, mValue);
		});
	}

	function initalizeForChildren (model, element, sKey, sValue) {
		var sVariable = sValue.split('of')[0].trim();
		var sIterable = sValue.split('of')[1].trim();

		var mValues = getByPath(model, sIterable);
		var children = element.cloneNode(true).children;

		// clone child elements
		each(mValues, function (mValue, index) {
			if (index === 0) return 'continue';

			each(children, function (child) {
				element.appendChild(child.cloneNode(true));
			});
		});

		// update child element's sVariable
		each(element.querySelectorAll('[data-s$="'+ sVariable +'"]'), function (elementChild, index) {
			var elementChildKey = elementChild.getSwatheKey();
			var elementChildAttribute = elementChildKey +': '+ sIterable +'.'+ index;
			elementChild.setAttribute('data-s', elementChildAttribute);
		});
	}

	/*
		utilities
	*/

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

	function each (array, callback, scope) {
		for (var i = 0, l = array.length; i < l; i++) {
			var statment = callback.call(scope, array[i], i);
			if (statment === 'break') break;
			else if (statment === 'continue') continue;
		}
	}

	function isObject (value) {
		if (value === null || value === undefined) return false;
		else return value.constructor === Object;
	}

	function isArray (value) {
		if (value === null || value === undefined) return false;
		else return value.constructor === Array;
	}

	HTMLElement.prototype.getSwatheKey = function () {
		try { return this.getAttribute('data-s').split(':')[0].trim(); }
		catch (e) { return null; }
	};

	HTMLElement.prototype.getSwatheValue = function () {
		try { return this.getAttribute('data-s').split(':')[1].trim(); }
		catch (e) { return null; }
	};

	String.prototype.getSwathePathKeys = function () {
		return this.replace('[', '.').replace(']', '').split('.');
	};

}());
