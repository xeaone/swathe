(function () {
	'use strict';

	/*
		Node is accepted.
			NodeFilter.FILTER_ACCEPT = 1

		Child nodes are also rejected.
			NodeFilter.FILTER_REJECT = 2

		Child nodes are not skipped.
			NodeFilter.FILTER_SKIP = 3
	*/

	var Dom = function (treeNode, treeFilter) {
		this.treeNode = treeNode;
		this.treeFilter = treeFilter;
		this.tree = document.createTreeWalker(this.treeNode, NodeFilter.SHOW_ELEMENT, this.treeFilter, false);
	};

	Dom.prototype.filter = function (filter) {
		var node = this.tree.currentNode;
		var nodes = [];

		while (node) {
			if (filter ? filter(node) : true) {
				nodes.push(node);
			}

			node = this.tree.nextNode();
		}

		return nodes;
	};

	Dom.prototype.findByTag = function (tag) {
		var tagPattern = new RegExp(tag);

		return this.filter(function (node) {
			return tagPattern.test(node.tagName.toLowerCase());
		});
	};

	Dom.prototype.findByAttribute = function (options) {
		var namePattern = new RegExp(options.name);
		var valuePattern = new RegExp(options.value);

		return this.filter(function (node) {
			var attributes = node.attributes;
			var l = attributes.length;
			var i = 0;

			if (options.name && options.value) {
				for (i; i < l; i++) {
					return namePattern.test(attributes[i].name) && valuePattern.test(attributes[i].value);
				}
			} else if (options.name) {
				for (i; i < l; i++) {
					return namePattern.test(attributes[i].name);
				}
			} else if (options.value) {
				for (i; i < l; i++) {
					return valuePattern.test(attributes[i].value);
				}
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

	var Controller = function (name, model, dom) {
		var observeObjects = window.Proxy ? observeObjectsProxy : observeObjectsDefine;
		var self = this;

		self.dom = dom;
		self.name = name;
		self.model = model;
		self.view = self.dom.findByAttribute({ name: 's-controller', value: name });

		// TODO: find s-value elements
		// TODO: and change the query abilties from Dom to new View

		self.model = observeObjects (self.model, function (value) { // mValue
			Render(self.model, self.view, null, value);
		});

		self.observedElements = observeElements (self.inputs, function (name, value, newValue) {
			setByPath(self.model, value, newValue);
		});

		Render(self.model, self.view, PATTERN.S);
	};

	if (!window.Swathe)  {
		document.addEventListener('DOMContentLoaded', function () {

			window.Swathe = {};
			window.Swathe.controllers = {};
			window.Swathe.dom = new Dom(document.body);
			window.Swathe.controller = function (name, model) {
				if (!name) throw new Error('Controller - name parameter required');
				if (!model) throw new Error('Controller - model parameter required');

				this.controllers[name] = new Controller(name, model, this.dom);

				return this.controllers[name];
			};

		});
	}

}());