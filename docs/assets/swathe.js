(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Swathe', factory) :
	(global.Swathe = factory());
}(this, (function () { 'use strict';

	var sStyle = `
	[s-controller], [data-s-controller] {
		// opacity: 0;
		transition: all 300ms ease;
		-o-transition: all 300ms ease;
		-ms-transition: all 300ms ease;
		-moz-transition: all 300ms ease;
		-webkit-transition: all 300ms ease;
	}
	.s-if-true {
		display: inherit;
	}
	.s-if-false {
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
		GET: 2, SET: 3,

		interact: function (type, collection, path, value) {
			var keys = this.getPathKeys(path);
			var last = keys.length - 1;
			var temporary = collection;

			for (var i = 0; i < last; i++) {
				var property = keys[i];

				if (temporary[property] === null || temporary[property] === undefined) {
					if (type === this.GET) {
						return undefined;
					} else if (type === this.SET) {
						temporary[property] = {};
					}
				}

				temporary = temporary[property];
			}

			if (type === this.GET) {
				return temporary[keys[last]];
			} else if (type === this.SET) {
				temporary[keys[last]] = value;
				return collection;
			}
		},

		toCleanCase: function (string) {
			return string.replace(/(\])|(\])|(((data)?)(-?)s-)/g, function (match) {
				return match === ']' ? '.' : '';
			});
		},

		toCamelCase: function (string) {
			return string.replace(/-[a-z]/g, function (match) {
				return match[1].toUpperCase();
			});
		},

		toDashCase: function ( string ) {
			return string.replace(/[A-Z]/g, function (match) {
				return '-' + match.toLowerCase();
			});
		},

		getPathKeys: function (string) {
			return this.toCamelCase(this.toCleanCase(string)).split('.');
		},

		getPathParent: function (string) {
			var parent = string.split('.').slice(0, -1).join('.');
			return parent === '' ? string : parent;
		},

		getByPath: function (collection, path) {
			return this.interact(this.GET, collection, path);
		},

		setByPath: function (collection, path, value) {
			return this.interact(this.SET, collection, path, value);
		},

		removeChildren: function (element) {
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}

			return element;
		}

	};

	// isVoid: function (value) {
	// 	return value === null || value === undefined;
	// },

	// is: function (type, value) {
	// 	return !value ? false : value.constructor.name === type;
	// },

	// each: function (iterable, callback, scope) {
	// 	var i = null, l = null;
	//
	// 	if (iterable && iterable.constructor.name === 'Object') {
	// 		for (i in iterable) {
	// 			if (iterable.hasOwnProperty(i)) {
	// 				callback.call(scope, iterable[i], i, iterable);
	// 			}
	// 		}
	// 	} else {
	// 		for (i = 0, l = iterable.length; i < l; i++) {
	// 			callback.call(scope, iterable[i], i, iterable);
	// 		}
	// 	}
	//
	// 	return iterable;
	// },

	var REJECTED_TAGS = /(iframe)|(script)|(style)|(link)|(object)/i;
	var REJECTED_ATTRIBUTES = /(s-controller")|(data-s-controller")/i;

	function View (data) {
		this.view = data.view;
		this.elements = this.view.getElementsByTagName('*');
	}

	View.prototype.atts = function (element, pattern, callback) {
		var attributes = element.attributes;
		var results = [];
		var result = {};

		for (var i = 0, l = attributes.length; i < l; i++) {
			result.value = attributes[i].value;
			result.name = attributes[i].name;
			result.attribute = result.name + '="' + result.value + '"';

			if (pattern.test(result.attribute)) {
				results.push(result);
				if (callback) callback(result);
				else return true;
			}
		}

		if (callback) return results;
		else return false;
	};

	View.prototype.isTag = function (element, pattern) {
		var tag = element.tagName.toLowerCase();

		if (pattern.test(tag)) {
			return true;
		}

		return false;
	};

	View.prototype.isAttribute = function (element, pattern) {
		return this.atts(element, pattern);
	};

	View.prototype.isRejected = function (element) {
		var isTag = this.isTag(element, REJECTED_TAGS);
		var isAttribute = this.isAttribute(element, REJECTED_ATTRIBUTES);
		return isTag || isAttribute;
	};

	View.prototype.eles = function (elements, callback) {
		var i = 0, element = null, results = [];

		for (i; i < elements.length; i++) {
			element = elements[i];

			if (this.isRejected(element)) { // rejects element and its children
				i = i + element.children.length;
				element = elements[i];
			} else {
				results.push(element);
				if (callback) callback(element);
			}
		}

		return results;
	};

	View.prototype.each = function (elements, pattern, callback) {
		var self = this;

		pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

		self.eles(elements, function (element) {
			self.atts(element, pattern, function (attribute) {
				callback(element, attribute);
			});
		});
	};

	View.prototype.change = function (callback) {
		var value = null;

		this.view.addEventListener('change', function (e) {
			value = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
			// TODO might need to check correct view
			if (value) callback(value, e.target.value);
		}, false);
	};

	// View.prototype.traverseAttributes = function (pattern, callback) {
	// 	var self = this;
	// 	var elements = self.elements;
	//
	// 	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
	//
	// 	self.eles(elements, function (element) {
	// 		self.atts(element, pattern, function (attribute) {
	// 			callback(element, attribute);
	// 		});
	// 	});
	// };

	// View.prototype.filter = function (callback) {
	// 	var elements = [];
	//
	// 	this.eles(function (element) {
	// 		if (callback ? callback(element) : true) {
	// 			elements.push(element);
	// 		}
	// 	});
	//
	// 	return elements;
	// };

	// View.prototype.findByTag = function (pattern, callback) {
	// 	var self = this;
	// 	var result = null;
	//
	// 	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
	//
	// 	return self.filter(function (element) {
	// 		result = self.isTag(element, pattern);
	// 		if (result && callback) callback(element, result);
	// 		return result;
	// 	});
	// };

	// View.prototype.findByAttribute = function (pattern, callback) {
	// 	var self = this;
	// 	var result = null;
	//
	// 	pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
	//
	// 	return self.filter(function (element) {
	// 		result = self.isAttribute(element, pattern);
	// 		if (result && callback) callback(element, result);
	// 		return result;
	// 	});
	// };

	function proxy (object, callback, prefix) {
		var value = null;

		if (!prefix) prefix = '';

		var handler = {
			get: function (target, property) {
				value = target[property];

				if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
					return proxy(value, callback, prefix + property + '.');
				} else {
					return value;
				}
			},
			set: function (target, property, value) {
				if (target[property] !== value) { // send change if value is different
					target[property] = value;
					if (callback) callback(prefix + property, value);
				}

				return true;
			}
		};

		return new Proxy(object, handler);
	}

	function define (object, callback, prefix) {
		var newObject = {};
		var properties = {};

		var key = null;
		var value = null;
		var prefixObject = null;
		var prefixVariable = null;

		if (!prefix) prefix = '';

		function handler (o, k, p) {
			return {
				enumerable: true,
				configurable: true,
				get: function () {
					return o[k];
				},
				set: function (nv) {
					if (nv !== o[k]) {
						o[k] = nv;
						if (callback) callback(p, nv);
					}
				}
			};
		}

		for (key in object) {
			value = object[key];
			prefixObject = !prefix ? key : prefix + '.' + key;
			prefixVariable = !prefix ? key : prefix + '.' + key;

			if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
				newObject[key] = define(value, callback, prefixObject);
			} else {
				properties[key] = handler(object, key, prefixVariable);
			}
		}

		return Object.defineProperties(newObject, properties);
	}

	function Model (data) {
		var self = this;

		self.isProxy = Proxy ? true : false;
		self.callback = function (key, value) { self._change(key, value); };

		if (self.isProxy) self.model = proxy(data.model, self.callback);
		else self.model = define(data.model, self.callback);
	}

	Model.prototype.change = function (callback) {
		this._change = callback;
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

	var ALL = /((data)?)(-?)s-/;
	var IF = /((data)?)(-?)s-if(-?)/;
	var FOR = /((data)?)(-?)s-for(-?)/;
	var HTML = /((data)?)(-?)s-html(-?)/;
	// var VIEW = /(s-view)|(data-s-view)/;
	var TEXT = /((data)?)(-?)s-text(-?)/;
	var STYLE = /((data)?)(-?)s-style(-?)/;
	var VALUE = /((data)?)(-?)s-value(-?)/;
	var ON = /(((data)?)(-?)s-on(-?))|(((data)?)(-?)s-event(-?))/;

	function Render (data) {
		this.doc = data.doc;
		this.view = data.view;
		this.model = data.model;
	}

	Render.prototype._on = function (element, attribute, path, value) {
		var self = this;

		value = value.replace(/\(/g, ', ');
		value = value.replace(/\)/g, '');
		value = value.split(', ');

		// attribute.name = attribute.name.replace(/(data-)|(s-)|(on-)|(event-)|(-)/g, '');
		path = path.toLowerCase();

		var methodPath = value[0];
		var methodParameters = value;
		var method = Utility.getByPath(self.model.model, methodPath);

		// if (!method) return null;

		methodParameters.splice(0, 1);

		// convert parameters
		methodParameters.forEach(function (parameter, index) {
			if (/^[0-9]*$/.test(parameter)) {
				methodParameters[index] = parseInt(parameter);
			} else if (!/(')|(")|(`)/.test(parameter)) {
				methodParameters[index] = Utility.getByPath(self.model.model, parameter);
			}
		});

		var methodBound = method.bind.apply(method, [node].concat(methodParameters));

		node.addEventListener(path, methodBound);
	};

	Render.prototype._if = function (element, attribute, path, value) {
		if (typeof value === 'string') {
			value = new Boolean(value);
		}

		element.hidden = !value;
	};

	Render.prototype._for = function (element, attribute, path, value) {
		var self = this;

		var variable = path.split('-').pop();
		var iterable = value;

		var iterableArray = Utility.getByPath(self.model.model, iterable);
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

		// change _for child variable names
		Utility.each(elements, function (element) {
			Utility.each(element.attributes, function (attribute) {
				if (value === variable) {
					value = iterable + '.'+ index;
					index++;
				}
			});
		});

		// TODO impoment better loop
		// self._elements (element, attribute, path, values, namePattern, valuePattern);

		// element = removeChildren(element);
		element.appendChild(fragment);
	};

	Render.prototype._html = function (element, attribute, path, value) {
		var self = this;

		if (/^</.test(value)) {
			element.innerHTML = value;
			self.each(element.children, ALL);
		} else {
			Axa.request({
				action: value,
				success: function (xhr) {
					element.innerHTML = xhr.response;
					self.each(element.children, ALL);
				},
				error: function (xhr) {
					throw xhr;
				}
			});
		}
	};

	Render.prototype._text = function (element, attribute, path, value) {
		if (typeof value === 'object') {
			value = JSON.stringify(value);
		} else if (typeof value === 'number') {
			value = value.toString();
		}
		element.innerText = value.toString();
	};

	Render.prototype._style = function (element, attribute, path, value) {
		if (typeof value === 'string') {
			path = Utility.toCamelCase(path).replace('.', '');
			element.style[path] = value;
		} else {
			for (var key in value) {
				if (value.hasOwnProperty(key)) {
					key = Utility.toDashCase(key);
					element.style.cssText += key + ':' + value[key] + ';';
				}
			}
		}
	};

	Render.prototype._value = function (element, attribute, path, value) {
		if (element.value !== value) element.value = value;
	};

	Render.prototype._default = function (element, attribute, path, value) {
		Utility.setByPath(element, path, value);
	};

	Render.prototype._switch = function (element, attribute, value) {
		if (ON.test(attribute.name)) this._on(element, attribute, attribute.name.replace(ON, ''), value);
		else if (IF.test(attribute.name)) this._if(element, attribute, attribute.name.replace(IF, ''), value);
		else if (FOR.test(attribute.name)) this._for(element, attribute, attribute.name.replace(FOR, ''), value);
		else if (HTML.test(attribute.name)) this._html(element, attribute, attribute.name.replace(HTML, ''), value);
		else if (TEXT.test(attribute.name)) this._text(element, attribute, attribute.name.replace(TEXT, ''), value);
		else if (STYLE.test(attribute.name)) this._style(element, attribute, attribute.name.replace(STYLE, ''), value);
		else if (VALUE.test(attribute.name)) this._value(element, attribute, attribute.name.replace(VALUE, ''), value);
		else this._default(element, attribute, attribute.name, value);
	};

	Render.prototype.each = function (elements, pattern, value) {
		var self = this;

		// var isValue = value === null || value === undefined ? false : true;

		self.view.each(elements, pattern, function (element, attribute) {
			// value = isValue ? value : Utility.getByPath(self.model.model, attribute.value);
			value = Utility.getByPath(self.model.model, attribute.value);
			value = value === null || value === undefined ? attribute.value : value;
			self._switch(element, attribute, value);
		});
	};

	Render.prototype.update = function (name) {
		name = Utility.getPathParent(name);
		name = '(((s-)|(data-s-))(.*?)="' + name +'(.*?)")';
		this.each(this.view.elements, name);
	};

	Render.prototype.setup = function () {
		this.each(this.view.elements, ALL);
	};

	/*
		title: swathe
		version: 1.2.0
		author: alexander elias
	*/

	function Controller (data, callback) {
		var self = this;

		self.doc = data.doc;
		self.name = data.name;
		self.query = '[s-controller="' + self.name + '"], [data-s-controller="' + self.name + '"]';

		self.View = new View({
			view: self.doc.querySelector(self.query)
		});

		self.Model = new Model({
			model: data.model
		});

		self.Render = new Render({
			doc: self.doc,
			view: self.View,
			model: self.Model
		});

		self.Model.change(function (name, value) {
			self.Render.update(name, value);
		});

		self.View.change(function (key, value) {
			Utility.setByPath(self.Model.model, key, value);
		});

		self.Render.setup();

		self.view = self.View.view;
		self.model = self.Model.model;

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
				window.Swathe.controllers[name].view.classList.toggle('s-show-true');
			}
		}
	});

	return Swathe;

})));