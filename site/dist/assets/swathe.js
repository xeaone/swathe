(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Swathe', factory) :
	(global.Swathe = factory());
}(this, (function () { 'use strict';

	var sStyle = `
	[s-controller], [data-s-controller] {
		opacity: 0;
		transition: all 300ms ease;
		-o-transition: all 300ms ease;
		-ms-transition: all 300ms ease;
		-moz-transition: all 300ms ease;
		-webkit-transition: all 300ms ease;
	}
	.s-if-false, .s-if-false {
		display: none;
	}
	.s-show-true {
		opacity: 1;
	}
	.s-show-false {
		opacity: 0;
	}
`;

	var eStyle = document.createElement('style');
	var nStyle = document.createTextNode(sStyle);

	eStyle.appendChild(nStyle);

	var Utility = {

		is: function (type, value) {
			return !value ? false : value.constructor.name === type;
		},

		each: function (iterable, callback, scope) {
			var statment = null;

			if (this.is('Object', iterable)) {
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
		},

		toCamelCase: function (string) {
			var pattern = /(-.)/g;

			return string.replace(pattern, function (match) {
				return match[1].toUpperCase();
			});
		},

		getPathKeys: function (string) {
			string = string.replace(/(\])|(^data-s-)|(^s-)/g, '');
			string = string.replace('[', '.');
			string = this.toCamelCase(string);
			return string.split('.');
		},

		getByPath: function (object, path) {
			var keys = this.getPathKeys(path);
			var last = keys.length - 1;
			var obj = object;

			for (var i = 0; i < last; i++) {
				var prop = keys[i];
				if (!obj[prop]) return undefined;
				obj = obj[prop];
			}

			return obj[keys[last]];
		},

		setByPath: function (object, path, value) {
			var keys = this.getPathKeys(path);
			var last = keys.length - 1;
			var obj = object;

			for (var i = 0; i < last; i++) {
				var prop = keys[i];
				if (!obj[prop]) obj[prop] = {};
				obj = obj[prop];
			}

			obj[keys[last]] = value;
			return object;
		},

		removeChildren: function (element) {
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}

			return element;
		}

	};

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

	var REJECTED_TAGS = /(iframe)|(script)|(style)|(link)|(object)/;
	var REJECTED_ATTRIBUTES = /(s-controller=")|(data-s-controller=")/;

	function View (data) {
		this.scope = data.scope;
		this.nodes = this.scope.getElementsByTagName('*');
	}

	View.prototype.isTag = function (node, pattern) {
		var tag = node.tagName.toLowerCase();

		if (pattern.test(tag)) {
			return true;
		}

		return false;
	};

	View.prototype.isAttribute = function (node, pattern) {
		var attributes = node.attributes;

		for (var i = 0, l = attributes.length; i < l; i++) {
			var attribute = node.attributes[i].name + '="' + node.attributes[i].value + '"';
			if (pattern.test(attribute)) return true;
		}

		return false;
	};

	View.prototype.isRejected = function (node) {
		var isTag = this.isTag(node, REJECTED_TAGS);
		var isAttribute = this.isAttribute(node, REJECTED_ATTRIBUTES);
		return isTag || isAttribute;
	};

	View.prototype.list = function (filter) {
		var node =  null;
		var nodes = [];

		for (var i = 0, l = this.nodes.length; i < l; i++) {
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

	View.prototype.findByTag = function (pattern) {
		var self = this;

		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		return self.list(function (node) {
			return self.isTag(node, pattern);
		});
	};

	View.prototype.findByAttribute = function (pattern) {
		var self = this;

		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		return self.list(function (node) {
			return self.isAttribute(node, pattern);
		});
	};

	/*
		@preserve
		title: axa
		version: 1.0.5
		author: Alexander Elias
		descript: Axa a low level Ajax Xhr library.
	*/

	var mime = {
		script: 'text/javascript, application/javascript, application/x-javascript',
		json: 'application/json, text/javascript',
		xml: 'application/xml, text/xml',
		html: 'text/html',
		text: 'text/plain',
		urlencoded: 'application/x-www-form-urlencoded'
	};

	function serialize (data) {
		var string = '';

		for (var name in data) {
			string = string.length > 0 ? string + '&' : string;
			string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
		}

		return string;
	}

	function request (options) {
		if (!options) throw new Error('Axa: requires options');
		if (!options.action) throw new Error('Axa: requires options.action');
		if (!options.method) options.method = 'GET';
		if (!options.headers) options.headers = {};

		if (options.data) {
			if (options.method === 'GET') {
				options.action = options.action + '?' + serialize(options.data);
				options.data = null;
			} else {
				options.requestType = options.requestType.toLowerCase();
				options.responseType = options.responseType.toLowerCase();

				switch (options.requestType) {
					case 'script': options.contentType = mime.script; break;
					case 'json': options.contentType = mime.json; break;
					case 'xml': options.contentType = mime.xm; break;
					case 'html': options.contentType = mime.html; break;
					case 'text': options.contentType = mime.text; break;
					default: options.contentType = mime.urlencoded;
				}

				switch (options.responseType) {
					case 'script': options.accept = mime.script; break;
					case 'json': options.accept = mime.json; break;
					case 'xml': options.accept = mime.xml; break;
					case 'html': options.accept = mime.html; break;
					case 'text': options.accept = mime.text; break;
				}

				if (options.contentType === mime.json) options.data = JSON.stringify(options.data);
				if (options.contentType === mime.urlencoded) options.data = serialize(options.data);
			}
		}

		var xhr = new XMLHttpRequest();
		xhr.open(options.method.toUpperCase(), options.action, true, options.username, options.password);

		if (options.mimeType) xhr.overrideMimeType(options.mimeType);
		if (options.withCredentials) xhr.withCredentials = options.withCredentials;

		if (options.accept) options.headers['Accept'] = options.accept;
		if (options.contentType) options.headers['Content-Type'] = options.contentType;

		if (options.headers) {
			for (var name in options.headers) {
				xhr.setRequestHeader(name, options.headers[name]);
			}
		}

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 400) {
					return options.success(xhr);
				} else {
					return options.error(xhr);
				}
			}
		};

		xhr.send(options.data);
	}

	var Axa = {
		mime: mime,
		request: request,
		serialize: serialize
	};

	var IF = /(s-if)|(data-s-if)/;
	var FOR = /(s-for)|(data-s-for)/;
	var CSS = /(s-css)|(data-s-css)/;
	var HTML = /(s-html)|(data-s-html)/;
	// var VIEW = /(s-view)|(data-s-view)/;
	var TEXT = /(s-text)|(data-s-text)/;
	var STYLE = /(s-style)|(data-s-style)/;
	// var VALUE = /(s-value)|(data-s-value)/;
	var ON = /(s-on)|(s-event)|(data-s-on)|(data-s-event)/;

	function Render (data) {
		this.doc = document;
		this.view = data.view;
		this.model = data.model;
	}

	Render.prototype.eOn = function (model, view, name, value, element) {
		var self = this;

		value = value.replace(/\(/g, ', ');
		value = value.replace(/\)/g, '');
		value = value.split(', ');

		name = name.replace(/(data-)|(s-)|(on-)|(event-)|(-)/g, '');
		name = name.toLowerCase();

		var methodPath = value[0];
		var methodParameters = value;
		var method = Utility.getByPath(model, methodPath);

		// if (!method) return null;

		methodParameters.splice(0, 1);

		// convert parameters
		methodParameters.forEach(function (parameter, index) {
			if (/^[0-9]*$/.test(parameter)) {
				methodParameters[index] = parseInt(parameter);
			} else if (!/(')|(")|(`)/.test(parameter)) {
				methodParameters[index] = Utility.getByPath(model, parameter);
			}
		});

		var methodBound = method.bind.apply(method, [element].concat(methodParameters));

		element.addEventListener(name, methodBound);
	};

	Render.prototype.eFor = function (model, view, name, value, element) {
		var self = this;

		var variable = name.split('-').pop();
		var iterable = value;

		var iterableArray = Utility.getByPath(model, iterable);
		var fragment = self.doc.createDocumentFragment();

		// clone child elements
		iterableArray.forEach(function () {
			Utility.each(element.children, function (child) {
				fragment.appendChild(child.cloneNode(true));
			});
		});

		var elements = fragment.querySelectorAll('*');
		// var namePattern = /(^s-.*)|(^data-s-.*)/;
		// var valuePattern = /.*/;
		var index = 0;

		// change eFor child variable names
		Utility.each(elements, function (element) {
			Utility.each(element.attributes, function (attribute) {
				if (attribute.value === variable) {
					attribute.value = iterable + '.'+ index;
					index++;
				}
			});
		});

		// TODO impoment better loop
		// self._elements (model, view, name, value, elements, namePattern, valuePattern);

		// element = removeChildren(element);
		element.appendChild(fragment);
	};

	Render.prototype.eCss = function (model, view, name, value, element) {
		var self = this;

		var styles = value.replace(/\s/g, '').split(';');
		var cssText = null;
		var viewValue = null;
		var modelValue = null;
		var viewValueClean = null;

		styles.forEach(function (style) {
			viewValue = style.split(':').pop();

			if (/^\$/.test(viewValue)) {
				viewValueClean = viewValue.replace('$', '');
				modelValue = Utility.getByPath(model, viewValueClean);

				if (modelValue) {
					style = style.replace(viewValue, modelValue);
					cssText = Utility.getByPath(element, 'style.cssText');
					Utility.setByPath(element, 'style.cssText', cssText + style);
				}
			}
		});
	};

	Render.prototype.eIf = function (model, view, name, value, element) {
		var self = this;

		value = Utility.getByPath(model, value);
		if (value) element.classList.remove('s-if-false');
		else element.classList.add('s-if-false');
	};

	Render.prototype.eStyle = function (model, view, name, value, element) {
		var self = this;

		name = name.replace(/(s-style-)|(data-s-style-)/, 'style.');
		name = Utility.toCamelCase(name);
		self.eDefault(model, view, name, value, element);
	};

	Render.prototype.eHtml = function (model, view, name, value, element) {
		var self = this;

		name = 'innerHTML';

		// TODO handle all external resources
		if (/^\//.test(value)) {
			Axa.request({
				action: '/partial/index.html',
				success: function (xhr) {
					console.log(xhr);
				},
				error: function (xhr) {
					console.log(xhr);
				}
			});
		} else {
			self.eDefault(model, view, name, value, element);
		}
	};

	Render.prototype.eText = function (model, view, name, value, element) {
		var self = this;
		name = 'innerText';
		self.eDefault(model, view, name, value, element);
	};

	// function valueElement (model, view, name, value, element) {
	// 	var self = this;
	// 	value = getByPath(model, value);
	// 	setByPath(element, name, value);
	// }

	Render.prototype.eDefault = function (model, view, name, value, element) {
		var self = this;
		// value = getByPath(model, value) || value;
		value = Utility.getByPath(model, value);
		Utility.setByPath(element, name, value);
	};

	Render.prototype._switch = function (model, view, name, value, element) {
		var self = this;

		if (ON.test(name)) {
			self.eOn(model, view, name, value, element);
		} else if (IF.test(name)) {
			self.eIf(model, view, name, value, element);
		} else if (FOR.test(name)) {
			self.eFor(model, view, name, value, element);
		} else if (CSS.test(name)) {
			self.eCss(model, view, name, value, element);
		} else if (HTML.test(name)) {
			self.eHtml(model, view, name, value, element);
		} else if (TEXT.test(name)) {
			self.eText(model, view, name, value, element);
		} else if (STYLE.test(name)) {
			self.eStyle(model, view, name, value, element);
		} else {
			self.eDefault(model, view, name, value, element);
		}
	};

	// Render.prototype._elements = function (model, view, name, value, elements, namePattern, valuePattern) {
	// 	var self = this;
	//
	// 	each(elements, function (element) {
	// 		each(element.attributes, function (attribute) {
	// 			if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
	// 				self._switch(model, view, attribute.name, attribute.value, element);
	// 			}
	// 		});
	// 	});
	// };

	Render.prototype.elements = function (model, view, name, value) {
		var self = this;

		var dollarPattern = '(\\$' + value + ')';
		var regularPattern = '(' + name + '=\"' + value + '\")';
		var elements = view.findByAttribute(regularPattern + '|' + dollarPattern);

		var namePattern = new RegExp(name);
		var valuePattern = new RegExp(value);

		Utility.each(elements, function (element) {
			Utility.each(element.attributes, function (attribute) {
				if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
					self._switch(model, view, attribute.name, attribute.value, element);
				}
			});
		});
	};

	function Observe (data) {
		this.view = data.view;
		this.model = data.model;
		this.render = data.render;
		this.isProxy = Proxy ? true : false;
	}

	Observe.prototype._proxy = function (object, callback, prefix) {
		var self = this;

		if (!prefix) prefix = '';

		var handler = {
			get: function (target, property) {
				if (Utility.is('Object', target[property]) || Utility.is('Array', target[property])) {
					return self._proxy(target[property], callback, prefix + property + '.');
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
	};

	Observe.prototype._define = function (object, callback, prefix) {
		var self = this;

		var newObject = {};
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

			if (Utility.is('Object', value)) {
				newObject[key] = self._define(value, callback, prefixObject);
			} else {
				properties[key] = handler(object, key, prefixVariable);
			}
		}

		return Object.defineProperties(newObject, properties);
	};

	Observe.prototype.object = function (object, callback) {
		if (typeof object === 'function') {
			callback = object;
			object = null;
		}

		object = object || this.model;

		if (this.isProxy) return this._proxy(object, callback);
		else return this._define(object, callback);
	};

	Observe.prototype.elements = function (elements, callback) {

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
	};

	/*
		title: swathe
		version: 1.2.0
		author: alexander elias
	*/

	var ALL = '.*?';
	var S = '(s-)|(data-s-)';
	var VALUE = /(s-value)|(data-s-value)/;

	function Controller (data, callback) {
		var self = this;

		self.doc = data.doc;
		self.name = data.name;
		self.model = data.model;

		self.scope = self.doc.querySelector('[s-controller=' + self.name + ']') || self.doc.querySelector('[data-s-controller=' + self.name + ']');

		self.view = new View({
			scope: self.scope
		});

		self.render = new Render({
			model: self.model,
			view: self.view
		});

		self.observe = new Observe({
			model: self.model,
			view: self.view,
			render: self.render
		});

		self.render.elements(self.model, self.view, S, ALL);

		self.inputs = self.view.findByAttribute(VALUE);

		self.model = self.observe.object(function (value) {
			self.render.elements(self.model, self.view, ALL, value);
		});

		self.inputs = self.observe.elements(self.inputs, function (name, value, newValue) {
			Utility.setByPath(self.model, value, newValue);
		});

		if (callback) callback(self);
	}

	var Swathe = {
		controllers: {},
		controller: function (data, callback) {
			if (!data.name) throw new Error('Controller - name parameter required');
			if (!data.model) throw new Error('Controller - model parameter required');
			if (this.controllers[data.name]) throw new Error('Controller - name ' + data.name + ' exists');
			data.doc = data.doc || document;
			this.controllers[data.name] = new Controller(data, callback);
			return this.controllers[data.name];
		}
	};

	window.addEventListener('DOMContentLoaded', function () {
		document.head.appendChild(eStyle);
		for (var name in window.Swathe.controllers) {
			if (window.Swathe.controllers.hasOwnProperty(name)) {
				window.Swathe.controllers[name].scope.classList.toggle('s-show-true');
			}
		}
	});

	return Swathe;

})));