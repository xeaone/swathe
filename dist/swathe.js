this.swathe = this.swathe || {};
this.swathe.b = this.swathe.b || {};
(function (lib_utilities) {
	'use strict';

	if (!window.Swathe)  window.Swathe = {};
	if (!window.Swathe.controllers) window.Swathe.controllers = {};

	/*
		globals
	*/

	var RGS = {
		comma: '(\\s*)\\,(\\s*)',
		collon: '(\\s*)\\:(\\s*)',
		bracketOpen: '(\\s*)\\((\\s*)',
		bracketClose: '(\\s*)\\)(\\s*)'
	};

	var RG = {
		parameters: new RegExp(
			'(' + RGS.comma + ')|' +
			'(' + RGS.collon + ')|' +
			'(' + RGS.bracketOpen + ')|' +
			'(' + RGS.bracketClose + ')',
			'g'
		)
	};

	/*
		prototypes
	*/

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
				type: {
					enumerable: true,
					configurable: true,
					get: function () {
						return element.constructor.name;
					}
				},
				attributes: {
					enumerable: true,
					configurable: true,
					get: function () {
						var attributes;

						for (var i = 0, l = element.attributes.length; i < l; i++) {
							var attribute = element.attributes[i];
							var value = attribute.value;
							var name = attribute.name;

							if (this.isAttribute(name)) {
								name = name.slice(2);
								value = value.replace(RG.parameters, ' ').trim().split(' ');
								attributes[name] = value;
							}
						}

						return attributes;
					}
				},
				eventMethodParameters: {
					enumerable: true,
					configurable: true,
					get: function () {
						return this.parameters.splice(2);
					}
				},
				eventMethod: {
					enumerable: true,
					configurable: true,
					get: function () {
						return this.parameters[1];
					}
				},
				eventName: {
					enumerable: true,
					configurable: true,
					get: function () {
						return this.parameterFirst.slice(2).toLowerCase();
					}
				},
				isFor: {
					value: function (string) {
						return /^for/.test(string);
					}
				},
				isEvent: {
					value: function (string) {
						return /^on/.test(string);
					}
				},
				isValue: {
					value: function (string) {
						return /^value/.test(string);
					}
				},
				isAttribute: {
					value: function (string) {
						return /^s\-/.test(string);
					}
				},
				toCamelCase: {
					value: function (string) {
						var nextIndex = string.search('-') + 1;
						var nextLetter = string.charAt(nextIndex).toString();
						var r = '-' + nextLetter;
						var n = nextLetter.toUpperCase();
						return string.replace(r, n);
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
		internal
	*/

	var Query = {
		forElements: '[data-s^="for:"]',
		sElements: '[data-s]:not(input):not(select):not(textarea):not([data-s^="for:"])',
		inputElements: 'input[data-s^="value:"], select[data-s^="value:"], textarea[data-s^="value:"]'
	};

	var GetSElements = function (scope) {
		var sElements = {};
		lib_utilities.each(scope.querySelectorAll('[data-s]'), function (elements) {
			if (!sElements[elements.swathe.parameterLast]) sElements[elements.swathe.parameterLast] = [];
			sElements[elements.swathe.parameterLast].push(elements);
		});
		return sElements;
	};

	var ObserveObjects = function (object, callback, prefix) {
		if (!prefix) prefix = '';

		var handler = {
			get: function (target, property) {
				if (lib_utilities.is('Object', target[property]) || lib_utilities.is('Array', target[property])) {
					return ObserveObjects(target[property], callback, prefix + property + '.');
				} else {
					return target[property];
				}
			},
			set: function (target, property, value) {
				if (target[property] !== value) { // send change if value is different
					target[property] = value;
					callback(prefix + property, value, target);
				}

				return true;
			}
		};

		return new Proxy(object, handler);
	};

	var ObserveElements = function (elements, callback) {
		var handler = function (e) { // event input works on: input, select, textarea
			var target = e.target;
			var value = target.value;
			var attribute = target.getAttribute('data-s');

			var sValue = attribute.split(':')[1].trim();

			callback(sValue, value, target);
		};

		lib_utilities.each(elements, function (element) {
			element.addEventListener('input', handler, false);
		});

		return elements;
	};

	/*
		main
	*/

	var Controller = function (scope, model, name) {
		var self = this;

		self.name = name;
		self.model = model;
		self.scope = lib_utilities.is('String', scope) ? document.querySelector(scope) : scope;

		self.sElements = GetSElements(self.scope);
		self.sInputElements = self.scope.querySelectorAll(Query.inputElements);

		self.model = ObserveObjects (model, function (path, value) {
			self.renderGroup(self.model, self.sElements[path], path, value);
		});

		self.view = ObserveElements (self.sInputElements, function (path, value) {
			lib_utilities.setByPath(self.model, path, value);
		});
	};

	Controller.prototype.forElement = function (model, element, name, value) {
		var self = this;

		var parameters = element.swathe.attributes[name];
		var parameterLast =  parameters[parameters.length-1];
		var fragment = document.createDocumentFragment();

		// clone child elements
		lib_utilities.each(value.length, function () {
			lib_utilities.each(element.children, function (child) {
				fragment.appendChild(child.cloneNode(true));
			});
		});

		var children = fragment.querySelectorAll('[data-s$="'+ parameters[1] +'"]');

		// update child element's parameterFirst
		lib_utilities.each(children, function (child, index) {
			// FIXME: needs to be in a loop over the attributes;
			var childParameters = child.swathe.attributes[name];
			var childKey = childParameters[0];
			// var childKey = child.swathe.parameterFirst;

			var childAttribute = childKey +': '+ parameterLast +'.'+ index;
			child.setAttribute('data-s', childAttribute);

			var path = child.swathe.parameterLast; // FIXME: start
			var value = lib_utilities.getByPath(model, path);
			self.renderSingle(model, child, path, value);

			// add to sElements
			if (!self.sElements[path]) self.sElements[path] = [];
			self.sElements[path].push(child);
		});

		element.swathe.removeChildren();
		element.appendChild(fragment);
	};

	Controller.prototype.eventElement = function (model, element) {
		var eventMethodParameters = element.swathe.eventMethodParameters;
		var eventMethod = element.swathe.eventMethod;
		var eventName = element.swathe.eventName;

		var method = lib_utilities.getByPath(model, eventMethod);
		var methodBound = method.bind.apply(method, [element].concat(eventMethodParameters));

		// TODO: need to handle non function error

		element.addEventListener(eventName, methodBound);
	};

	Controller.prototype.otherElement = function (element, name, value) {
		lib_utilities.setByPath(element, name, value);
	};

	Controller.prototype.renderSingle = function (model, element, path, value) {
		var attribute = element.swathe.attributes;
		var self = this;
		var name = '';

		for (name in attribute) {
			console.log(name);
			if (element.swathe.isEvent(attribute[name])) self.eventElement(model, element);
			else if (!element.swathe.isValue(attribute[name])) self.otherElement(element, name, value);
			else if (element.swathe.isFor(attribute[name])) self.forElement(model, element, name, value);
		}

		// if (element.swathe.isEvent) self.eventElement(model, element);
		// else if (element.swathe.isFor) self.forElement(model, element, value);
		// else if (!element.swathe.isValue) self.otherElement(element, value);
	};

	Controller.prototype.renderGroup = function (model, elements, path, value) {
		var self = this;

		lib_utilities.each(elements, function (element) {
			path = path || element.swathe.parameterLast;
			value = value || lib_utilities.getByPath(model, path);
			self.renderSingle(model, element, path, value);
		});
	};

	Controller.prototype.renderAll = function () {
		var self = this;

		lib_utilities.each(self.sElements, function (elements, path) {
			self.renderGroup(self.model, elements, path);
		});
	};

	window.Swathe.controller = function (scope, model, name) {
		if (!scope) throw new Error('Controller: scope parameter required');
		if (!model) throw new Error('Controller: model parameter required');

		name = name ? name : name = Object.keys(window.Swathe.controllers).length;
		window.Swathe.controllers[name] = new Controller(scope, model);
		window.Swathe.controllers[name].renderAll();

		return window.Swathe.controllers[name];
	};

	// function addEventListeners (target, props) {
	// 	Object.keys(props).forEach(name, function () {
	// 		if (isEvent(name)) {
	// 			target.addEventListener(getEventName(name), props[name]);
	// 		}
	// 	});
	// }

}(lib_utilities));
