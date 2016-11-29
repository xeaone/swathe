(function () {
	'use strict';

	var sStyle = `
	[s-controller], [data-s-controller] {
		opacity: 0;
		transition: all 300ms ease;
		-o-transition: all 300ms ease;
		-ms-transition: all 300ms ease;
		-moz-transition: all 300ms ease;
		-webkit-transition: all 300ms ease;
	}
	.s-if-false {
		display: none;
	}
`;

	var View = function (options) {
		var self = this;

		self.options = options || {};
		self.nodes = self.options.scope.getElementsByTagName('*');

		if (this.options.rejected) {
			if (this.options.rejected.tags) this.options.rejected.tags = new RegExp(this.options.rejected.tags.join('|'));
			if (this.options.rejected.attributes) this.options.rejected.attributes = new RegExp(this.options.rejected.attributes.join('|'));
		}
	};

	View.prototype.isRejected = function (node) {
		var rejected = this.options.rejected;

		if (rejected) {
			var tagsPattern = rejected.tags;
			var attributesPattern = rejected.attributes;

			if (tagsPattern) {
				var tag = node.tagName.toLowerCase();
				if (tagsPattern.test(tag)) return true;
			}

			if (attributesPattern) {
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

	View.prototype.list = function (filter) {
		var l = this.nodes.length;
		var node =  null;
		var nodes = [];
		var i = 0;

		for (i; i < l; i++) {
			node = this.nodes[i];

			if (this.isRejected(node)) { // rejects elment and its children
				i = i + node.children.length;
				node = this.nodes[i];
			} else if (filter ? filter(node) : true) {
				nodes.push(node);
			}
		}

		return nodes;
	};

	View.prototype.findByTag = function (tag) {
		var tagPattern = new RegExp(tag);

		return this.list(function (node) {
			return tagPattern.test(node.tagName.toLowerCase());
		});
	};

	View.prototype.findByAttribute = function (attribute) {
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
		var statment = null;

		if (is('Object', iterable)) {
			var k = null;

			for (k in iterable) {
				if (!iterable.hasOwnProperty(k)) continue;
				statment = callback.call(scope, iterable[k], k, iterable);
				if (statment) if (statment === 'break') break; else if (statment === 'continue') continue;
			}
		} else {
			var i = null;
			var l = null;

			for (i = 0, l = iterable.length; i < l; i++) {
				statment = callback.call(scope, iterable[i], i, iterable);
				if (statment) if (statment === 'break') break; else if (statment === 'continue') continue;
			}
		}

		return iterable;
	}

	function toCamelCase (string) {
		var pattern = /(-.)/g;

		return string.replace(pattern, function (match) {
			return match[1].toUpperCase();
		});
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

	// export function isSwatheAttribute (string) {
	// 	return /(^s-)|(^data-s)/.test(string);
	// }
	//
	// export function normalizeAttribute (string) {
	// 	string = string.replace(/^data-s-/, '');
	// 	string = string.replace(/^s-/, '');
	// 	string = toCamelCase(string);
	// 	return string;
	// }

	function serialize (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	}

	function ajax (options) {
		if (!options) throw new Error('ajax: requires options');

		if (!options.action) options.action = window.location.pathname;
		if (!options.enctype) options.enctype = 'text/plain';
		if (!options.method) options.method = 'GET';

		options.method = options.method.toUpperCase();

		if (options.data) {
			if (options.method === 'GET') {
				options.action = options.action + '?' + serialize(options.data);
				options.data = null;
			} else {
				if (options.enctype.search('application/x-www-form-urlencoded') !== -1) options.data = serialize(options.data);
				else if (options.enctype.search('application/json') !== -1) options.data = JSON.stringify(options.data);
			}
		}

		var xhr = new XMLHttpRequest();
		xhr.open(options.method, options.action, true, options.username, options.password);

		if (options.mimeType) xhr.overrideMimeType(options.mimeType);
		if (options.withCredentials) xhr.withCredentials = options.withCredentials;

		if (options.headers) {
			for (var name in options.headers) {
				xhr.setRequestHeader(name, options.headers[name]);
			}
		}

		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) {
					if (options.success) return options.success(xhr);
				} else {
					if (options.error) return options.error(xhr);
				}
			}
		};

		xhr.send(options.data);
	}

	var PATTERN$1 = {
		IF: /(^s-if.*)|(^data-s-if.*)/,
		FOR: /(^s-for.*)|(^data-s-for.*)/,
		CSS: /(^s-css.*)|(^data-s-css.*)/,
		HTML: /(^s-html.*)|(^data-s-html.*)/,
		// VIEW: /(^s-view.*)|(^data-s-view.*)/,
		TEXT: /(^s-text.*)|(^data-s-text.*)/,
		STYLE: /(^s-style.*)|(^data-s-style.*)/,
		VALUE: /(^s-value.*)|(^data-s-value.*)/,
		ON: /(^s-on.*)|(^s-event.*)|(^data-s-on.*)|(^data-s-event.*)/
	};

	function onElement (model, dom, name, value, element) {

		value = value.replace(/\(/g, ', ');
		value = value.replace(/\)/g, '');
		value = value.split(', ');

		name = name.replace(/(data-)|(s-)|(on-)|(event-)|(-)/g, '');
		name = name.toLowerCase();

		var methodPath = value[0];
		var methodParameters = value;
		var method = getByPath(model, methodPath);

		// if (!method) return null;

		methodParameters.splice(0, 1);

		// convert parameters
		methodParameters.forEach(function (parameter, index) {
			if (/^[0-9]*$/.test(parameter)) {
				methodParameters[index] = parseInt(parameter);
			} else if (!/(')|(")|(`)/.test(parameter)) {
				methodParameters[index] = getByPath(model, parameter);
			}
		});

		var methodBound = method.bind.apply(method, [element].concat(methodParameters));

		element.addEventListener(name, methodBound);
	}

	function forElement (model, dom, name, value, element) {
		var variable = name.split('-').pop();
		var iterable = value;

		var iterableArray = getByPath(model, iterable);
		var fragment = document.createDocumentFragment();

		// clone child elements
		iterableArray.forEach(function () {
			each(element.children, function (child) {
				fragment.appendChild(child.cloneNode(true));
			});
		});

		var elements = fragment.querySelectorAll('*');
		var namePattern = /(^s-.*)|(^data-s-.*)/;
		var valuePattern = /.*/;
		var index = 0;

		// change forElement child variable names
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

	function cssElement (model, dom, name, value, element) {
		var styles = value.replace(/\s/g, '').split(';');
		var cssText = null;
		var viewValue = null;
		var modelValue = null;
		var viewValueClean = null;

		styles.forEach(function (style) {
			viewValue = style.split(':').pop();

			if (/^\$/.test(viewValue)) {
				viewValueClean = viewValue.replace('$', '');
				modelValue = getByPath(model, viewValueClean);

				if (modelValue) {
					style = style.replace(viewValue, modelValue);
					cssText = getByPath(element, 'style.cssText');
					setByPath(element, 'style.cssText', cssText + style);
				}
			}
		});
	}

	function ifElement (model, dom, name, value, element) {
		value = getByPath(model, value);
		if (value) element.classList.remove('s-if-false');
		else element.classList.add('s-if-false');
	}

	function styleElement (model, dom, name, value, element) {
		name = name.replace(/(s-style-)|(data-s-style-)/, 'style.');
		name = toCamelCase(name);
		defaultElement(model, dom, name, value, element);
	}

	function htmlElement (model, dom, name, value, element) {
		name = 'innerHTML';

		if (/^\//.test(value)) {
			ajax({
				action: '/partial/index.html',
				success: function (xhr) {
					console.log(xhr);
				},
				error: function (xhr) {
					console.log(xhr);
				}
			});
		} else {
			defaultElement(model, dom, name, value, element);
		}
	}

	function textElement (model, dom, name, value, element) {
		name = 'innerText';
		defaultElement(model, dom, name, value, element);
	}

	// function valueElement (model, dom, name, value, element) {
	// 	value = getByPath(model, value);
	// 	setByPath(element, name, value);
	// }

	function defaultElement (model, dom, name, value, element) {
		// value = getByPath(model, value) || value;
		value = getByPath(model, value);
		setByPath(element, name, value);
	}

	function proxyElement (model, dom, name, value, element) {
		if (PATTERN$1.ON.test(name)) {
			onElement(model, dom, name, value, element);
		} else if (PATTERN$1.IF.test(name)) {
			ifElement(model, dom, name, value, element);
		} else if (PATTERN$1.FOR.test(name)) {
			forElement(model, dom, name, value, element);
		} else if (PATTERN$1.CSS.test(name)) {
			cssElement(model, dom, name, value, element);
		} else if (PATTERN$1.HTML.test(name)) {
			htmlElement(model, dom, name, value, element);
		} else if (PATTERN$1.TEXT.test(name)) {
			textElement(model, dom, name, value, element);
		} else if (PATTERN$1.STYLE.test(name)) {
			styleElement(model, dom, name, value, element);
		} else {
			defaultElement(model, dom, name, value, element);
		}
	}

	function handleElements (model, dom, name, value, elements, namePattern, valuePattern) {
		each(elements, function (element) {
			each(element.attributes, function (attribute) {
				if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
					proxyElement(model, dom, attribute.name, attribute.value, element);
				}
			});
		});
	}

	function Render (model, dom, name, value) {
		var dollarPattern = '(\\$' + value + ')';
		var regularPattern = '(' + name + '=\"' + value + '\")';
		var elements = dom.findByAttribute(regularPattern + '|' + dollarPattern);

		handleElements(model, dom, name, value, elements, new RegExp(name), new RegExp(value));
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

		if (!prefix) prefix = '';

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
		self.view = new View(options);
		self.inputs = self.view.findByAttribute(PATTERN.VALUE);

		self.model = observeObjects (self.model, function (value) {
			Render(self.model, self.view, PATTERN.ALL, value);
		});

		self.inputs = observeElements (self.inputs, function (name, value, newValue) {
			setByPath(self.model, value, newValue);
		});

		Render(self.model, self.view, PATTERN.S, PATTERN.ALL);

		document.addEventListener('DOMContentLoaded', function () {
			options.scope.style.opacity = '1';
		});

		if (callback) callback(self);
	};

	if (!window.Swathe)  {

		var eStyle = document.createElement('style');
		var nStyle = document.createTextNode(sStyle);
		eStyle.title = 'swathe';
		eStyle.appendChild(nStyle);
		document.head.appendChild(eStyle);

		window.Swathe = {
			controllers: {},
			controller: function (name, model, callback) {
				if (!name) throw new Error('Controller - name parameter required');
				if (!model) throw new Error('Controller - model parameter required');
				this.controllers[name] = new Controller(name, model, callback);
				return this.controllers[name];
			}
		};

	}

}());