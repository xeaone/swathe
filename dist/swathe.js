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
		GET: 2,
		SET: 3,
		prefix: /(data-)?s-/,

		uid: function () {
			return Math.random().toString(36).substr(2, 9);
		},

		toCamelCase: function (data) {
			if (data.constructor.name === 'Array') data = data.join('-');
			return data.replace(/-[a-z]/g, function (match) {
				return match[1].toUpperCase();
			});
		},

		toDashCase: function (data) {
			if (data.constructor.name === 'Array') data = data.join('');
			return data.replace(/[A-Z]/g, function (match) {
				return '-' + match.toLowerCase();
			});
		},

		ensureBoolean: function (value) {
			if (typeof value === 'string') return value === 'true';
			else return value;
		},

		ensureString: function (value) {
			if (typeof value === 'object') return JSON.stringify(value);
			else return value.toString();
		},

		/*
			object
		*/

		interact: function (type, collection, path, value) {
			var keys = this.toCamelCase(path).split('.');
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

		getByPath: function (collection, path) {
			return this.interact(this.GET, collection, path);
		},

		setByPath: function (collection, path, value) {
			return this.interact(this.SET, collection, path, value);
		},

		/*
			DOM
		*/

		glance: function (element) {
			var attribute, glance = element.nodeName.toLowerCase();

			for (var i = 0, l = element.attributes.length; i < l; i++) {
				attribute = element.attributes[i];
				glance = glance + ' ' + attribute.name + '="' + attribute.value + '"';
			}

			return glance;
		},

		eachAttribute: function (attributes, pattern, callback) {
			var i = 0, attribute = {};

			for (i; i < attributes.length; i++) {
				attribute = {
					name: attributes[i].name,
					value: attributes[i].value,
					full: attributes[i].name + '="' + attributes[i].value + '"'
				};

				if (pattern && pattern.test(attribute.full)) {
					if (callback) callback(attribute);
				}
			}
		},

		eachElement: function (elements, reject, skip, accept, callback) {
			var i = 0, element, glance;

			for (i; i < elements.length; i++) {
				element = elements[i];
				glance = this.glance(element);

				if (reject && reject.test(glance)) {
					i += element.children.length;
				} else if (skip && skip.test(glance)) {
					continue;
				} else if (accept && accept.test(glance)) {
					if (callback) i = callback(element, i) || i;
				}
			}
		}

	};


	// eachParent: function (element, reject, accept) {
	// 	var child = element, parent = child.parentNode, glance;
	//
	// 	if (reject && typeof reject === 'string') reject = new RegExp(reject);
	// 	if (accept && typeof accept === 'string') accept = new RegExp(accept);
	//
	// 	while (parent) {
	// 		glance = this.glance(parent);
	//
	// 		if (reject && reject.test(glance)) {
	// 			return null;
	// 		} else if (accept && accept.test(glance)) {
	// 			return { parent: parent, child: child };
	// 		}
	//
	// 		child = parent;
	// 		parent = child.parentNode;
	// 	}
	// }

	// toCleanCase: function (string) {
	// 	return string.replace(/(\[)|(\])/g, function (match) {
	// 		return match === '[' ? '.' : '';
	// 	});
	// },

	// getPathKeys: function (string) {
	// 	return this.toCamelCase(this.toCleanCase(string)).split('.');
	// },

	// getPathParent: function (string) {
	// 	var parent = string.split('.').slice(0, -1).join('.');
	// 	return parent === '' ? string : parent;
	// },

	// stringifyElement: function (element) {
	// 	return element.outerHTML.replace(/>(.*?)$/, '').replace('<', '');
	// },

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

	// id: function () {
	// 	return Math.random().toString(36).substr(2, 9);
	// },

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

	function Component (element, model, view) {
		this.view = view;
		this.model = model;
		this.element = element;

		this.innerHTML;
		this.listeners = {};

		this.SKIPS = /(s-value=)/;
		this.ACCEPTS = /(s-(.*?)=)/;
		this.REJECTS = /s-controller=/;
	}

	Component.prototype.on = function (data) {
		var self = this;
		var eventName = data.cmds[1];
		var methodName = data.opts[data.opts.length-1];

		if (typeof data.value !== 'function') return;

		self.element.removeEventListener(eventName, self.listeners[methodName], false);

		self.listeners[methodName] = function (e) {
			e.preventDefault();
			data.value.call(self.model.collection, e);
		};

		self.element.addEventListener(eventName, self.listeners[methodName], false);
	};

	// TODO improve perfomace
	Component.prototype.for = function (data) {
		var self = this;

		if (!self.for_child) self.for_child = self.element.children[0];

		var variable = data.cmds.slice(1);
		var child = self.for_child.cloneNode(true);
		var inner = '';

		child = child.outerHTML;
		variable = Utility.toCamelCase(variable);
		variable = new RegExp('="'+ variable +'"', 'g');


		for (var i = 0, l = data.value.length; i < l; i++) {
			inner += child.replace(variable, '="' + data.binder.value + '.' + i.toString() + '"');
		}

		self.renderInnerHTML(inner, self.element);
	};

	Component.prototype.html = function (data) {
		var self = this;

		if (/^</.test(data.value)) {
			self.renderInnerHTML(data.value);
		} else {
			Axa.request({
				action: data.value,
				success: function (xhr) { self.renderInnerHTML(xhr.response); },
				error: function (xhr) { throw xhr.response; }
			});
		}
	};

	Component.prototype.css = function (data) {
		var cssText = this.element.style.cssText;

		if (typeof data.value === 'object') {
			for (var key in data.value) {
				if (data.value.hasOwnProperty(key)) {
					key = Utility.toDashCase(key);
					cssText += key + ':' + data.value[key] + ';';
				}
			}
		} else {
			cssText += data.value;
		}

		this.element.style.cssText = cssText;
	};

	Component.prototype.class = function (data) {
		var className = data.cmds.slice(1).join('-');
		data.value = Utility.ensureBoolean(data.value);
		this.element.classList.toggle(className, data.value);
	};

	Component.prototype.enable = function (data) {
		this.element.disabled = !Utility.ensureBoolean(data.value);
	};

	Component.prototype.disable = function (data) {
		this.element.disabled = Utility.ensureBoolean(data.value);
	};

	Component.prototype.show = function (data) {
		this.element.hidden = !Utility.ensureBoolean(data.value);
	};

	Component.prototype.hide = function (data) {
		this.element.hidden = Utility.ensureBoolean(data.value);
	};

	Component.prototype.check = function (data) {
		this.element.checked = Utility.ensureBoolean(data.value);
	};

	Component.prototype.uncheck = function (data) {
		this.element.checked = !Utility.ensureBoolean(data.value);
	};

	Component.prototype.text = function (data) {
		this.element.innerText = Utility.ensureString(data.value);
	};

	Component.prototype.default = function (data) {
		var path = Utility.toCamelCase(data.cmds);
		Utility.setByPath(this.element, path, data.value);
	};

	Component.prototype.renderInnerHTML = function (inner) {
		var self = this;

		self.element.innerHTML = inner;
		self.view.addComponents(self.element, function (element) {
			return new Component(element, self.model, self.view);
		});
	};

	Component.prototype.render = function (binder) {
		var self = this, data = {};

		if (binder.name === 's-value') return;

		data.opts = binder.value.split('.');
		data.cmds = binder.name.replace(Utility.prefix, '').split('-');

		data.value = self.model.get(binder.value);
		data.value = data.value === null || data.value === undefined ? binder.value : data.value;
		data.binder = binder;

		if (data.cmds[0] in self) {
			self[data.cmds[0]](data);
		} else {
			self.default(data);
		}
	};

	Component.prototype.renderAll = function () {
		var self = this;

		Utility.eachAttribute(self.element.attributes, Utility.prefix, function (attribute) {
			self.render(attribute);
		});
	};

	Component.prototype.renderByBinderValue = function (binderValue, modelValue) {
		var self = this;

		Utility.eachAttribute(this.element.attributes, new RegExp(binderValue), function (attribute) {
			self.render(attribute, modelValue);
		});
	};

	/*
		@preserve
		title: obsr
		version: 1.0.3
		license: mpl-2.0
		author: alexander elias
	*/

	function Obsr () {}

	Obsr.prototype.descriptor = function (k, v, c) {
		return {
			configurable: true,
			enumerable: true,
			get: function () {
				return v;
			},
			set: function (nv) {
				v = nv;
				c(k, v);
			}
		};
	};

	Obsr.prototype.ins = function (observed, callback, prefix, key, value) {

		if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
			value = this.create(value, callback, prefix + key, true);
		}

		if (observed.constructor.name === 'Array' && key == -1) {
			key = 0;
			observed.splice(key, 0, value);
			observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
			key = observed.length-1;
			value = observed[key];
		}

		observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
		if (callback) callback(prefix + key, value);
	};

	Obsr.prototype.del = function (observed, callback, prefix, key) {
		if (observed.constructor.name === 'Object') {
			delete observed[key];
		} else if (observed.constructor.name === 'Array') {
			var l = observed.length - 1;
			observed.splice(key, 1);
			key = l;
		}

		if (callback) callback(prefix + key, undefined);
	};

	Obsr.prototype.create = function (observable, callback, prefix, trigger) {
		var observed, key, value, type;

		if (!prefix) prefix = '';
		else prefix += '.';

		type = observable.constructor.name;
		observed = type === 'Object' ? {} : [];

		observed = Object.defineProperty(observed, 'ins', {
			value: this.ins.bind(this, observed, callback, prefix)
		});

		observed = Object.defineProperty(observed, 'del', {
			value: this.del.bind(this, observed, callback, prefix)
		});

		for (key in observable) {
			value = observable[key];
			type = value.constructor.name;

			if (type === 'Object' || type === 'Array') value = this.create(value, callback, prefix + key);
			observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
			if (trigger && callback) callback(prefix + key, value);
		}

		return observed;
	};

	var obsr = function (observable, callback) {
		return new Obsr().create(observable, callback);
	};

	function Model (collection) {
		this.collection = collection;
		// this.isProxy = Proxy ? true : false;
	}

	// Model.prototype.proxy = function (object, callback, prefix) {
	// 	var self = this, value;
	//
	// 	if (!prefix) prefix = '';
	//
	// 	var handler = {
	// 		get: function (target, property) {
	// 			value = target[property];
	//
	// 			if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
	// 				return self.proxy(value, callback, prefix + property + '.');
	// 			} else {
	// 				return value;
	// 			}
	// 		},
	// 		set: function (target, property, value) {
	// 			if (target[property] !== value) { // send change if value is different
	// 				target[property] = value;
	// 				if (callback) callback(prefix + property, value);
	// 			}
	//
	// 			return true;
	// 		}
	// 	};
	//
	// 	return new Proxy(object, handler);
	// };

	// Model.prototype.define = function (object, callback, prefix) {
	// 	var self = this, newObject = {}, properties = {};
	//
	// 	var key = null;
	// 	var value = null;
	// 	var prefixObject = null;
	// 	var prefixVariable = null;
	//
	// 	if (!prefix) prefix = '';
	//
	// 	function handler (o, k, p) {
	// 		return {
	// 			enumerable: true,
	// 			configurable: true,
	// 			get: function () {
	// 				return o[k];
	// 			},
	// 			set: function (nv) {
	// 				if (nv !== o[k]) {
	// 					o[k] = nv;
	// 					if (callback) callback(p, nv);
	// 				}
	// 			}
	// 		};
	// 	}
	//
	// 	for (key in object) {
	// 		value = object[key];
	// 		prefixObject = !prefix ? key : prefix + '.' + key;
	// 		prefixVariable = !prefix ? key : prefix + '.' + key;
	//
	// 		if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
	// 			newObject[key] = self.define(value, callback, prefixObject);
	// 		} else {
	// 			properties[key] = handler(object, key, prefixVariable);
	// 		}
	// 	}
	//
	// 	return Object.defineProperties(newObject, properties);
	// };

	Model.prototype.get = function (path) {
		return Utility.getByPath(this.collection, path);
	};

	Model.prototype.set = function (path, data) {
		Utility.setByPath(this.collection, path, data);
	};

	Model.prototype.setup = function (callback) {
		this.collection = obsr(this.collection, callback);
		// if (this.isProxy) {
		// 	this.collection = this.proxy(this.collection, callback);
		// } else {
			// this.collection = this.define(this.collection, callback);
		// }
	};

	/*
		ids: Component Binder Data Base
			{Binder Value} > {ID} > [Binder Names]

		components: Component Identification Data Base
			{Identification} > {Component}
	*/

	function View () {
		this.ids = {};
		this.components = {};
		this.accepts = /(s-(.*?)=)/;
		this.rejects = /(s-controller=)|(iframe)|(object)|(script)/;
	}

	View.prototype.setComponent= function (id, component) {
		this.components[id] = component;
	};

	View.prototype.getComponent = function (id) {
		return this.components[id];
	};

	View.prototype.setId = function (id, value) {
		if (!this.ids[value]) this.ids[value] = [id];
		else this.ids[value].push(id);
	};

	View.prototype.getIds = function (value) {
		return this.ids[value];
	};

	View.prototype.setIds = function (id, element) {
		for (var i = 0, l = element.attributes.length, attribute; i < l; i++) {
			attribute = element.attributes[i];

			if (Utility.prefix.test(attribute.name)) {
				if (!this.ids[attribute.value]) this.ids[attribute.value] = [];
				this.ids[attribute.value].push(id);
				if (attribute.name === 's-css') console.log(attribute);
			}
		}
	};

	View.prototype.updateComponents = function (binderValue, modelValue) {
		var ids = this.getIds(binderValue), component, id;

		for (var i = 0, l = ids.length; i < l; i++) {
			id = ids[i];
			component = this.getComponent(id);
			component.renderByBinderValue(binderValue, modelValue);
		}
	};

	View.prototype.addComponents = function (element, callback) {
		var self = this, component, id;
		var elements = element.getElementsByTagName('*');

		Utility.eachElement(elements, self.rejects, null, self.accepts, function (element, index) {
			id = Utility.uid();
			element.id = id;

			component = callback(element);
			component.renderAll();
			self.setIds(id, element);
			self.setComponent(id, component);

			if (/s-for-(.*?)=/.test(Utility.glance(element))) return index++;

		});
	};

	/*
		title: swathe
		version: 1.2.0
		license: mpl-2.0
		author: alexander elias
	*/

	function Controller (data, callback) {
		var self = this;

		self.doc = data.doc;
		self.name = data.name;
		self.query = '[s-controller="' + self.name + '"], [data-s-controller="' + self.name + '"]';

		self.model = data.model;
		self.scope = self.doc.querySelector(self.query);

		self.Model = new Model(self.model);
		self.View = new View();

		self.Model.setup(function (path, value) {
			if (!isNaN(path.split('.').slice(-1))) {
				path = path.split('.').slice(0, -1).join('.');
			}

			self.View.updateComponents(path, value);
		});

		self.View.addComponents(self.scope, function (element) {
			return new Component(element, self.Model, self.View);
		});

		self.scope.addEventListener('keyup', function (e) {
			var component = self.View.getComponent(e.target.id);
			var value = component.element.getAttribute('s-value') || component.element.getAttribute('data-s-value');
			if (value) self.Model.set(value, component.element.value);
		}, false);

		// self.scope.addEventListener('submit', function (e) {
		// 	if (self.View.get(e.target.id)) {
		// 		var value = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
		// 		self.Model.set(value, e.target.value);
		// 	}
		// 	e.preventDefault();
		// }, false);

		self.model = self.Model.collection;

		if (callback) return callback.call(this);
	}

	window.addEventListener('DOMContentLoaded', function () {
		document.head.appendChild(eStyle);
		// for (var name in window.Swathe.controllers) {
		// 	if (window.Swathe.controllers.hasOwnProperty(name)) {
		// 		window.Swathe.controllers[name].view.classList.toggle('s-show-true');
		// 	}
		// }
	});

	var swathe_b = {
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

	return swathe_b;

})));
