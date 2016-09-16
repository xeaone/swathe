 (function() {
	'use strict';

	/*
		globals
	*/

	window.Swathe = {
		controllers: {}
	};

	var UID = null;

	/*
		prototypes
	*/

	Element.prototype.swatheUid = null;
	Element.prototype.swatheData = {};

	Object.defineProperty(String.prototype, 'swathe', {
		writeable: false,
		configurable: true,
		get: function () {
			return {
				string: this,
				pathKeys: function () {
					return this.string.replace('[', '.').replace(']', '').split('.');
				}
			};
		}
	});

	Object.defineProperty(Element.prototype, 'swathe', {
		enumerable: true,
		configurable: true,
		get: function () {
			var element = this;

			return Object.defineProperties({ element: element }, {
				uid: {
					enumerable: true,
					configurable: true,
					get: function () {
						if (!element.swatheUid) element.swatheUid = uid();
						return element.swatheUid;
					}
				},
				type: {
					enumerable: true,
					configurable: true,
					get: function () {
						return element.constructor.name;
					}
				},
				parameters: {
					enumerable: true,
					configurable: true,
					get: function () {
						try { return element.getAttribute('data-s').replace(':', '').split(' '); }
						catch (e) { return []; }
					}
				},
				parameterFirst: {
					enumerable: true,
					configurable: true,
					get: function () {
						return this.parameters[0];
					}
				},
				parameterLast: {
					enumerable: true,
					configurable: true,
					get: function () {
						return this.parameters[this.parameters.length-1];
					}
				},
				data: {
					value: function (key, value) {
						if (!value) return element.swatheData[key];
						else element.swatheData[key] = value;
					}
				},
				removeChildren: {
					value: function () {
						while (element.firstChild) {
							element.removeChild(element.firstChild);
						}
					}
				}
			});
		}
	});

	/*
		utilities
	*/

	function uid () {
		if (!UID) UID = (new Date()).getTime();
		return UID++;
	}

	function is (type, value) {
		return !value ? false : value.constructor.name === type;
	}

	function each (iterable, callback, scope) {
		var statment = null, i = null, l = null, k = null;

		if (is('Number', iterable)) {
			for (i = 0; i < iterable; i++) {
				statment = callback.call(scope, i, iterable);
				if (statment === 'break') break;
				else if (statment === 'continue') continue;
			}
		} else if (is('Object', iterable)) {
			for (k in iterable) {
				if (!iterable.hasOwnProperty(k)) continue;
				statment = callback.call(scope, iterable[k], k, iterable);
				if (statment === 'break') break;
				else if (statment === 'continue') continue;
			}
		} else {
			for (i = 0, l = iterable.length; i < l; i++) {
				statment = callback.call(scope, iterable[i], i, iterable);
				if (statment === 'break') break;
				else if (statment === 'continue') continue;
			}
		}

		return iterable;
	}

	function getByPath(object, path) {
		var keys = path.swathe.pathKeys();
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
		var keys = path.swathe.pathKeys();
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

	/*
		internal
	*/

	var Query = {
		forElements: '[data-s^="for:"]',
		sElements: '[data-s]:not(input):not(select):not(textarea):not([data-s^="for:"])',
		inputElements: 'input[data-s^="value:"], select[data-s^="value:"], textarea[data-s^="value:"]'
	};

	function GetSElements (scope) {
		var sElements = {};
		each(scope.querySelectorAll('[data-s]'), function (elements) {
			if (!sElements[elements.swathe.parameterLast]) sElements[elements.swathe.parameterLast] = [];
			sElements[elements.swathe.parameterLast].push(elements);
		});
		return sElements;
	}

	function ObserveObjects (object, callback, prefix) {
		if (!prefix) prefix = '';

		var handler = {
			get: function(target, property) {
				if (is('Object', target[property]) || is('Array', target[property])) {
					return ObserveObjects(target[property], callback, prefix + property + '.');
				} else {
					return target[property];
				}
			},
			set: function(target, property, value) {
				if (target[property] !== value) { // send change if value is different
					target[property] = value;
					callback(prefix + property, value, target);
				}

				return true;
			}
		};

		return new Proxy(object, handler);
	}

	function ObserveElements (elements, callback) {
		var handler = function (e) { // event input works on: input, select, textarea
			var target = e.target;
			var value = target.value;
			var attribute = target.getAttribute('data-s');

			var sValue = attribute.split(':')[1].trim();

			callback(sValue, value, target);
		};

		each(elements, function (element) {
			element.addEventListener('input', handler, false);
		});

		return elements;
	}

	/*
		main
	*/

	function Controller (scope, model, name) {
		var self = this;

		self.name = name;
		self.model = model;
		self.scope = is('String', scope) ? document.querySelector(scope) : scope;

		self.sElements = GetSElements(self.scope);
		self.sInputElements = self.scope.querySelectorAll(Query.inputElements);

		self.model = ObserveObjects (model, function (path, value) { //, value
			self.renderGroup(self.model, self.sElements[path], path, value); //, path, value
		});

		self.view = ObserveElements (self.sInputElements, function (path, value) {
			setByPath(self.model, path, value);
		});
	}

	Controller.prototype.renderSingle = function (model, element, path, value) {
		var self = this;

		var parameterFirst = element.swathe.parameterFirst;
		if (parameterFirst === 'for') self.renderForOf(model, element, value);
		else if (parameterFirst !== 'value') setByPath(element, parameterFirst, value);
	};

	Controller.prototype.renderGroup = function (model, elements, path, value) {
		var self = this;

		each(elements, function (element) {
			path = path || element.swathe.parameterLast;
			value = value || getByPath(model, path);
			self.renderSingle(model, element, path, value);
		});
	};

	Controller.prototype.renderAll = function () {
		var self = this;

		each(self.sElements, function (elements, path) {
			self.renderGroup(self.model, elements, path);
		});
	};

	Controller.prototype.renderForOf = function (model, element, value) {
		var self = this;

		var parameters = element.swathe.parameters;
		var parameterLast = element.swathe.parameterLast;
		var fragment = document.createDocumentFragment();

		// clone child elements
		each(value.length, function () {
			each(element.children, function (child) {
				fragment.appendChild(child.cloneNode(true));
			});
		});

		var children = fragment.querySelectorAll('[data-s$="'+ parameters[1] +'"]');

		// update child element's parameterFirst
		each(children, function (child, index) {
			var childKey = child.swathe.parameterFirst;

			var childAttribute = childKey +': '+ parameterLast +'.'+ index;
			child.setAttribute('data-s', childAttribute);

			var path = child.swathe.parameterLast;
			var value = getByPath(model, path);
			self.renderSingle(model, child, path, value);

			// add to sElements
			if (!self.sElements[path]) self.sElements[path] = [];
			self.sElements[path].push(child);
		});

		element.swathe.removeChildren();
		element.appendChild(fragment);
	};

	window.Swathe.controller = function (scope, model, name) {
		if (!scope) throw new Error('Controller: scope parameter required');
		if (!model) throw new Error('Controller: model parameter required');

		name = name ? name : name = Object.keys(window.Swathe.controllers).length;
		window.Swathe.controllers[name] = new Controller(scope, model);
		window.Swathe.controllers[name].renderAll();

		return window.Swathe.controllers[name];
	};

}());

// function flattenObject (object) {
// 	var flatObject = {};
//
// 	each(object, function (value, key) {
// 		if (is('Object', object[key]) || is('Array', object[key]) || is('Proxy', object[key])) {
// 			each(flattenObject(object[key]), function (childValue, childKey, childObject) {
// 				flatObject[key + '.' + childKey] = childObject[childKey];
// 			});
// 		} else {
// 			flatObject[key] = object[key];
// 			return 'continue';
// 		}
// 	});
//
// 	return flatObject;
// }
