(function () {
	'use strict';

	/*
	*/

	var Dom = function (options) {
		this.options = options || {};
		this.nodes = this.options.scope.getElementsByTagName('*');
	};

	Dom.prototype.list = function (filter) {
		var l = this.nodes.length;
		var node = null;
		var nodes = [];
		var i = 0;

		for (i; i < l; i++) {
			node = this.nodes[i];

			if (filter ? filter(node) : true) {
				nodes.push(node);
			}
		}

		return nodes;
	};

	Dom.prototype.filter = function (filter) {
		var filters = this.options.filters;

		if (filters) {
			if (filters.attributes) var attributesPattern = new RegExp(filters.attributes.join('|'));
			if (filters.tags) var tagsPattern = new RegExp(filters.tags.join('|'));
		}

		return this.list(function (node) {
			var attributesResult = true;
			var tagsResult = true;

			if (filters) {
				if (filters.tags) {
					var tag = node.tagName.toLowerCase();
					tagsResult = !tagsPattern.test(tag);
				}

				if (filters.attributes) {
					var l = node.attributes.length;
					var i = 0;

					for (i; i < l; i++) {
						var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
						if (!attributesPattern.test(attribute)) {
							attributesResult = true;
							break;
						} else {
							attributesResult = false;
						}
					}
				}
			}

			if (tagsResult && attributesResult) {
				return filter ? filter(node) : true;
			} else {
				return false;
			}

		});
	};

	Dom.prototype.findByTag = function (tag) {
		var tagPattern = new RegExp(tag);

		return this.filter(function (node) {
			return tagPattern.test(node.tagName.toLowerCase());
		});
	};

	Dom.prototype.findByAttribute = function (attribute) {
		var attributePattern = new RegExp(attribute);

		return this.filter(function (node) {
			var attributes = node.attributes;
			var l = attributes.length;
			var i = 0;

			for (i; i < l; i++) {
				var attributeNode = node.attributes[i].name + '="' + node.attributes[i].value + '"';
				if (attributePattern.test(attributeNode)) return true;
			}

		});
	};

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

	function getPathKeys (string) {
		string = string.replace(/(\])|(^data-s-)|(^s-)/g, '');
		string = string.replace('[', '.');
		string = toCamelCase(string);
		return string.split('.');
	}

	function getByPath (object, path) {
		var keys = getPathKeys(path);
		var last = keys.length - 1;
		var obj = object;

		for (var i = 0; i < last; i++) {
			var prop = keys[i];
			if (!obj[prop]) return undefined;
			obj = obj[prop];
		}

		return obj[keys[last]];
	}

	function setByPath (object, path, value) {
		var keys = getPathKeys(path);
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

	function toCamelCase (string) {
		var pattern = /(-.)/g;

		return string.replace(pattern, function (match) {
			return match[1].toUpperCase();
		});
	}

	var PATTERN$1 = {
		FOR: /(^s-for.*)|(^s-for.*)/,
		VALUE: /(^s-value.*)|(^s-value.*)/,
		ON: /(^s-on.*)|(^s-event.*)|(^data-s-on.*)|(^data-s-event.*)/
	};

	function onElement (model, dom, name, value, element) {
		var eventName = name;
		var sValues = value;

		sValues = sValues.replace(/\(/g, ', ');
		sValues = sValues.replace(/\)/g, '');
		sValues = sValues.split(', ');

		eventName = eventName.replace(/(^on)|(^event)/g, '');
		eventName = eventName.toLowerCase();

		var methodPath = sValues[0];
		var methodParameters = sValues;

		methodParameters.splice(0, 1);

		// convert parameters
		methodParameters.forEach(function (parameter, index) {
			if (/^[0-9]*$/.test(parameter)) {
				methodParameters[index] = parseInt(parameter);
			} else if (!/(')|(")|(`)/.test(parameter)) {
				methodParameters[index] = getByPath(model, parameter);
			}
		});

		var method = getByPath(model, methodPath);
		var methodBound = method.bind.apply(method, [element].concat(methodParameters));

		element.addEventListener(eventName, methodBound);
	}

	// function valueElement (model, dom, name, value, element) {
	// 	console.log(value);
	// }

	function defaultElement (model, dom, name, value, element) {
		value = getByPath(model, value);
		setByPath(element, name, value);
	}

	function proxy (model, dom, name, value, element) {
		if (PATTERN$1.ON.test(name)) {
			onElement(model, dom, name, value, element);
		} else if (PATTERN$1.FOR.test(name)) {
			// forElement(model, dom, name, value, element);
		} else if (PATTERN$1.VALUE.test(name)) {
			// valueElement(model, dom, name, value, element);
		} else {
			defaultElement(model, dom, name, value, element);
		}
	}

	function Render (model, dom, name, value) {
		var elements = dom.findByAttribute({ name: name, value: value });
		var namePattern = new RegExp(name);
		// var valuePattern = new RegExp(value);

		elements.forEach(function (element) {
			each(element.attributes, function (attribute) {
				if (attribute && namePattern.test(attribute.name)) {
					proxy(model, dom, attribute.name, attribute.value, element);
				}
			});
		});
	}

	function observeElements (elements, callback) {

		var handler = function (e) { // event input works on: input, select, textarea
			var target = e.target;
			var value = target.value;

			var sName = null;
			var sValue = null;

			if (target.hasAttribute('s-value')) sName = 's-value';
			else if (target.hasAttribute('data-s-value')) sName = 'data-s-value';

			sValue = target.getAttribute(sName);

			callback(sName, sValue, value, target);
		};

		each(elements, function (element) {
			element.addEventListener('input', handler);
		});

		return elements;
	}

	function observeObjectsProxy (object, callback, prefix) {
		if (!prefix) prefix = '';

		var handler = {
			get: function (target, property) {
				if (is('Object', target[property]) || is('Array', target[property])) {
					return observeObjectsProxy(target[property], callback, prefix + property + '.');
				} else {
					return target[property];
				}
			},
			set: function (target, property, value) {
				if (target[property] !== value) { // send change if value is different
					target[property] = value;
					callback(prefix + property, value);
				}

				return true;
			}
		};

		return new Proxy(object, handler);
	}

	function observeObjectsDefine (object, callback, prefix) {
		var self = {};
		var properties = {};

		var handler = function(o, k, p) {
			return {
				enumerable: true,
				configurable: true,
				get: function () {
					return o[k];
				},
				set: function (nv) {
					if (nv !== o[k]) {
						o[k] = nv;
						callback(p, nv);
					}
				}
			};
		};

		for (var key in object) {
			var value = object[key];
			var prefixObject = !prefix ? key : prefix + '.' + key;
			var prefixVariable = !prefix ? key : prefix + '.' + key;

			if (is('Object', value)) {
				self[key] = observeObjectsDefine(value, callback, prefixObject);
			} else {
				properties[key] = handler(object, key, prefixVariable);
			}
		}

		return Object.defineProperties(self, properties);
	}

	var PATTERN = {
		S: '(s-.*)|(data-s-.*)',
		VALUE: '(s-value)|(data-s-value)'
	};

	var Controller = function (name, model, callback) {
		var observeObjects = window.Proxy ? observeObjectsProxy : observeObjectsDefine;
		var self = this;

		var options = {
			scope: document.querySelector('[s-controller=' + name + ']') || document.querySelector('[data-s-controller=' + name + ']'),
			filters: {
				attributes: ['s-controller.*'],
				tags: ['script', 'iframe']
			}
		};

		self.name = name;
		self.model = model;
		self.dom = new Dom(options);
		self.inputs = self.dom.findByAttribute('s-value.*');

		// mValue
		self.model = observeObjects (self.model, function (value) {
			Render(self.model, self.view, null, value);
		});

		// might need to have a way to add inputs
		self.observedElements = observeElements (self.inputs, function (name, value, newValue) {
			setByPath(self.model, value, newValue);
		});

		Render(self.model, self.view, PATTERN.S);

		if (callback) return callback(self);
	};

	if (!window.Swathe)  {
		document.addEventListener('DOMContentLoaded', function () {

			window.Swathe = {};
			window.Swathe.controllers = {};
			window.Swathe.controller = function (name, model, callback) {
				if (!name) throw new Error('Controller - name parameter required');
				if (!model) throw new Error('Controller - model parameter required');

				this.controllers[name] = new Controller(name, model, callback);

				return this.controllers[name];
			};

		});
	}

}());