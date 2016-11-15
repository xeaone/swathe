(function () {
	'use strict';

	/*
	*/

	var Dom = function (options) {
		var self = this;

		self.options = options || {};
		self.nodes = self.options.scope.getElementsByTagName('*');

		if (this.options.rejected) {
			if (this.options.rejected.tags) this.options.rejected.tags = new RegExp(this.options.rejected.tags.join('|'));
			if (this.options.rejected.attributes) this.options.rejected.attributes = new RegExp(this.options.rejected.attributes.join('|'));
		}
	};

	Dom.prototype.isRejected = function (node) {
		var rejected = this.options.rejected;

		if (rejected) {
			var tagsPattern = rejected.tags;
			var attributesPattern = rejected.attributes;

			if (rejected.tags) {
				var tag = node.tagName.toLowerCase();
				if (tagsPattern.test(tag)) return true;
			}

			if (rejected.attributes) {
				var l = node.attributes.length;
				var i = 0;

				for (i; i < l; i++) {
					var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
					if (attributesPattern.test(attribute)) return true;
					else if (i === l-1) return false;
				}
			}
		} else {
			return false;
		}
	};

	Dom.prototype.list = function (filter) {
		var l = this.nodes.length;
		var node =  null;
		var nodes = [];
		var i = 0;

		for (i; i < l; i++) {
			node = this.nodes[i];

			if (this.isRejected(node)) { // skips elment and its children
				i = i + node.children.length;
				node = this.nodes[i];
			} else if (filter ? filter(node) : true) {
				nodes.push(node);
			}
		}

		return nodes;
	};

	Dom.prototype.findByTag = function (tag) {
		var tagPattern = new RegExp(tag);

		return this.list(function (node) {
			return tagPattern.test(node.tagName.toLowerCase());
		});
	};

	Dom.prototype.findByAttribute = function (attribute) {
		var attributePattern = new RegExp(attribute);

		return this.list(function (node) {
			var attributes = node.attributes;
			var l = attributes.length;
			var i = 0;

			for (i; i < l; i++) {
				var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
				if (attributePattern.test(attribute)) return true;
				else if (i === l-1) return false;
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

	function removeChildren (element) {
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		return element;
	}

	function toCamelCase (string) {
		var pattern = /(-.)/g;

		return string.replace(pattern, function (match) {
			return match[1].toUpperCase();
		});
	}

	var PATTERN$1 = {
		FOR: /(^s-for.*)|(^data-s-for.*)/,
		VALUE: /(^s-value.*)|(^data-s-value.*)/,
		ON: /(^s-on.*)|(^s-event.*)|(^data-s-on.*)|(^data-s-event.*)/
	};

	function onElement (model, dom, name, value, element) {

		value = value.replace(/\(/g, ', ');
		value = value.replace(/\)/g, '');
		value = value.split(', ');

		name = name.replace(/(s-)|(on-)|(event-)|(-)/g, '');
		name = name.toLowerCase();

		var methodPath = value[0];
		var methodParameters = value;

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

		element.addEventListener(name, methodBound);
	}

	function forElement (model, dom, name, value, element) {
		var values = value.split(' of ');
		var variable = values[0];
		var iterable = values[1];
		var iterableArray = getByPath(model, iterable);
		var fragment = document.createDocumentFragment();

		// clone child elements
		each(iterableArray.length, function () {
			each(element.children, function (child) {
				fragment.appendChild(child.cloneNode(true));
			});
		});

		var elements = fragment.querySelectorAll('*');
		var namePattern = /(^s-.*)|(^data-s-.*)/;
		var valuePattern = /.*/;
		var index = 0;

		// change variable name
		each(elements, function (element) {
			each(element.attributes, function (attribute) {
				if (attribute.value === variable) {
					attribute.value = iterable + '.'+ index;
					index++;
				}
			});
		});

		handleElements (model, dom, name, value, elements, namePattern, valuePattern);

		element = removeChildren(element);
		element.appendChild(fragment);
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
			forElement(model, dom, name, value, element);
		// } else if (PATTERN.VALUE.test(name)) {
			// valueElement(model, dom, name, value, element);
		} else {
			defaultElement(model, dom, name, value, element);
		}
	}

	function handleElements (model, dom, name, value, elements, namePattern, valuePattern) {
		elements.forEach(function (element) {
			each(element.attributes, function (attribute) {
				if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
					proxy(model, dom, attribute.name, attribute.value, element);
				}
			});
		});
	}

	function Render (model, dom, name, value) {
		var elements = dom.findByAttribute(name + '="' + value + '"');
		var namePattern = new RegExp(name);
		var valuePattern = new RegExp(value);

		handleElements(model, dom, name, value, elements, namePattern, valuePattern);
	}

	function observeElements (elements, callback) {

		// event input works on: input, select, textarea
		var eventHandler = function (e) {
			var target = e.target;
			var value = target.getAttribute('s-value') || target.getAttribute('data-s-value');
			callback(name, value, target.value, target);
		};

		elements.forEach(function (element) {
			element.addEventListener('input', eventHandler);
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
		ALL: '.*',
		S: '(s-.*)|(data-s-.*)',
		VALUE: '(s-value.*)|(data-s-value.*)',
		TAGS: ['iframe', 'script', 'style', 'link', 'object'],
		ATTRIBUTES: ['(s-controller.*)|(data-s-controller.*)']
	};

	var Controller = function (name, model, callback) {
		var observeObjects = window.Proxy ? observeObjectsProxy : observeObjectsDefine;
		var self = this;

		var options = {
			scope: document.querySelector('[s-controller=' + name + ']') || document.querySelector('[data-s-controller=' + name + ']'),
			rejected: {
				tags: PATTERN.TAGS,
				attributes: PATTERN.ATTRIBUTES
			}
		};

		self.name = name;
		self.model = model;
		self.dom = new Dom(options);
		self.inputs = self.dom.findByAttribute(PATTERN.VALUE);

		self.model = observeObjects (self.model, function (value) {
			Render(self.model, self.dom, PATTERN.ALL, value);
		});

		// might need to have a way to add inputs
		self.observedElements = observeElements (self.inputs, function (name, value, newValue) {
			setByPath(self.model, value, newValue);
		});

		Render(self.model, self.dom, PATTERN.S, PATTERN.ALL);

		if (callback) return callback(self);
	};

	if (!window.Swathe)  {
		window.Swathe = {};
		window.Swathe.controllers = {};
		window.Swathe.controller = function (name, model, callback) {
			if (!name) throw new Error('Controller - name parameter required');
			if (!model) throw new Error('Controller - model parameter required');

			this.controllers[name] = new Controller(name, model, callback);

			return this.controllers[name];
		};
	}

}());