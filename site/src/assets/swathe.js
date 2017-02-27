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

		// id: function () {
		// 	return Math.random().toString(36).substr(2, 9);
		// },

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

		ensureBoolean: function (value) {
			if (typeof value === 'string') return value === 'true';
			else return value;
		},

		ensureString: function (value) {
			if (typeof value === 'object') return JSON.stringify(value);
			else return value.toString();
		},

		toCleanCase: function (string) {
			return string.replace(/(\[)|(\])/g, function (match) {
				return match === '[' ? '.' : '';
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

		/*
			DOM
		*/

		// removeChildren: function (element) {
		// 	while (element.firstChild) {
		// 		element.removeChild(element.firstChild);
		// 	}
		//
		// 	return element;
		// },

		forEachAttribute: function (element, reject, skip, accept, callback) {
			var attributes = element.attributes;
			var i = 0, results = [];

			for (i; i < attributes.length; i++) {
				var result = {
					value: attributes[i].value,
					name: attributes[i].name,
					attribute: attributes[i].name + '="' + attributes[i].value + '"'
				};

				if (reject && reject.test(result.attribute)) {
					i += result.children.length;
				} else if (skip && skip.test(result.attribute)) {
					continue;
				} else if (accept && accept.test(result.attribute)) {
					results.push(result);
					if (callback) callback(result);
				}
			}

			return results;
		},

		forEachElement: function (element, reject, skip, accept, callback) {
			var elements = element.getElementsByTagName('*');
			var i = 0, results = [], string;

			for (i; i < elements.length; i++) {
				var result = elements[i];
				string = result.outerHTML.replace(result.innerHTML, '');

				if (reject && reject.test(string)) {
					i += result.children.length;
				} else if (skip && skip.test(string)) {
					continue;
				} else if (accept && accept.test(string)) {
					results.push(result);
					if (callback) callback(result);
				}
			}

			return results;
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

	function ViewInterface (data) {
		this.view = data.view;

		this.PREFIX = /(^(data-)?s-)/;
		// this.BINDER_CMD = /(^data-s-)|(^s-)|((-|\.)(.*?)$)/g;
		this.BINDER_CMD = /s-\w+/;
		this.BINDER_OPT = /((^data-s-)|(^s-))(\w+(\.|-)?)/;
		this.ADAPTER_CMD = /\((.*?)$/;
		this.ADAPTER_OPT = /(^(.*?)\()|(\)(.*?)$)/g;

		this.NUMBER = /^\d{1,}$/;
		this.STRING = /(^')|(^")|(^`)/;
		this.BOOLEAN = /(^true$)|(^false$)/;

		this.ALL = /(s-(.*?)=)/;
		this.REJECTS = /(<iframe)|(<script)|(<style)|(<link)|(<object)|(s-controller=)/;

		this.AT_SKIPS = /(s-value=)/;
	}

	ViewInterface.prototype.sOn = function (data) {
		var self = this;

		if (typeof data.value !== 'function') return;

		if (!data.element.swathe) {
			data.element.swathe = {};
		} else {
			data.element.removeEventListener(data.binder.opt, data.element.swathe.originalEventListener);
		}

		data.element.swathe.originalEventListener = function (e) {
			var parameters = data.adapter.opt.split(', ').map(function (parameter) { // TODO fix split on all commas /,(\s)?/
				if (self.STRING.test(parameter)) {
					return parameter.replace(/(')|(")|(`)/g, '');
				} else if (self.NUMBER.test(parameter)) {
					return Number(parameter);
				} else if (self.BOOLEAN.test(parameter)) {
					return parameter === 'true';
				} else {
					return self.ModelInterface.get(parameter);
				}
			});

			parameters.push(e);
			data.value.apply(self.ModelInterface.model, parameters);
		};

		data.element.addEventListener(data.binder.opt, data.element.swathe.originalEventListener);
	};

	ViewInterface.prototype.sFor = function (data) {
		var self = this, originalInnerHtml;

		if (!data.element.swathe) {
			originalInnerHtml = data.element.innerHTML;
			data.element.swathe = {};
			data.element.swathe.originalInnerHTML = originalInnerHtml;
		} else {
			originalInnerHtml = data.element.swathe.originalInnerHTML;
		}

		var variable = new RegExp('="'+ data.binder.opt +'"', 'g');
		var newInnerHtml = '';

		if (data.value === null || data.value === undefined) {
			throw 's-for-[variable name] requires an iterable';
		} else {
			for (var i = 0, l = data.value.length; i < l; i++) {
				newInnerHtml += originalInnerHtml.replace(variable, '=\"' + data.attribute.value + '[' + i + ']\"');
			}
		}

		data.element.innerHTML = newInnerHtml;
		self.update(data.element);
	};

	ViewInterface.prototype.sHtml = function (data) {
		var self = this;

		if (/^</.test(data.value)) {
			data.element.innerHTML = data.value;
			self.update(data.element);
		} else {
			Axa.request({
				action: data.value,
				success: function (xhr) {
					data.element.innerHTML = xhr.response;
					self.update(data.element);
				},
				error: function (xhr) {
					throw xhr;
				}
			});
		}
	};

	ViewInterface.prototype.sIf = function (data) {
		data.element.hidden = !Utility.ensureBoolean(data.value);
	};

	ViewInterface.prototype.sEnable = function (data) {
		data.element.disabled = !Utility.ensureBoolean(data.value);
	};

	ViewInterface.prototype.sDisable = function (data) {
		data.element.disabled = Utility.ensureBoolean(data.value);
	};

	ViewInterface.prototype.sShow = function (data) {
		data.element.hidden = !Utility.ensureBoolean(data.value);
	};

	ViewInterface.prototype.sHide = function (data) {
		data.element.hidden = Utility.ensureBoolean(data.value);
	};

	ViewInterface.prototype.sCheck = function (data) {
		data.element.checked = Utility.ensureBoolean(data.value);
	};

	ViewInterface.prototype.sUncheck = function (data) {
		data.element.checked = !Utility.ensureBoolean(data.value);
	};

	ViewInterface.prototype.sClass = function (data) {
		data.value = Utility.ensureBoolean(data.value);
		data.element.classList.toggle(data.binder.opt, data.value);
	};

	ViewInterface.prototype.sText = function (data) {
		data.element.innerText = Utility.ensureString(data.value);
	};

	ViewInterface.prototype.sCss = function (data) {
		if (typeof data.value === 'string') {
			data.element.style.cssText = data.value;
		} else {
			for (var key in data.value) {
				if (data.value.hasOwnProperty(key)) {
					key = Utility.toDashCase(key);
					data.element.style.cssText += key + ':' + data.value[key] + ';';
				}
			}
		}
	};

	// ViewInterface.prototype._style = function (data) {
	// 	if (typeof data.value === 'string') {
	// 		data.element.style[Utility.toCamelCase(data.binder.opt)] = data.value;
	// 	} else {
	// 		for (var key in data.value) {
	// 			if (data.value.hasOwnProperty(key)) {
	// 				key = Utility.toDashCase(key);
	// 				data.element.style.cssText += key + ':' + data.value[key] + ';';
	// 			}
	// 		}
	// 	}
	// };

	ViewInterface.prototype.sValue = function (data) {
		if (data.element.value !== data.value) data.element.value = data.value;
	};

	// ViewInterface.prototype.sSubmit = function (data) {
	// 	console.log(data);
	// };

	ViewInterface.prototype.sDefault = function (data) {
		data.attribute.name = data.attribute.name.replace(this.PREFIX, '');
		data.attribute.name = Utility.toCamelCase(data.attribute.name);
		Utility.setByPath(data.element, data.attribute.name, data.value);
	};

	ViewInterface.prototype.switch = function (data) {
		var self = this;

		data.binder = {
			cmd: Utility.toCamelCase(data.attribute.name.match(self.BINDER_CMD)[0]),
			opt: data.attribute.name.replace(self.BINDER_OPT, '')
		};

		data.adapter = {
			cmd: data.attribute.value.replace(self.ADAPTER_CMD, ''),
			opt: data.attribute.value.replace(self.ADAPTER_OPT, '')
		};

		data.value = self.ModelInterface.get(data.adapter.cmd);
		data.value = data.value === null || data.value === undefined ? data.attribute.value : data.value;

		if (data.binder.cmd in self) {
			self[data.binder.cmd](data);
		} else {
			self.sDefault(data);
		}
	};

	ViewInterface.prototype.update = function (view, pattern) {
		var self = this;

		view = view || self.view;
		pattern = pattern || self.ALL;

		Utility.forEachElement(view, self.REJECTS, null, pattern, function (element) {
			Utility.forEachAttribute(element, null, self.AT_SKIPS, self.ALL, function (attribute) {
				self.switch({ element: element, attribute: attribute });
			});
		});
	};

	ViewInterface.prototype.setup = function (ModelInterface) {
		var self = this, attributeValue;

		self.ModelInterface = ModelInterface;

		self.update();

		self.view.addEventListener('keyup', function (e) { //'change'
			attributeValue = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
			if (attributeValue) self.ModelInterface.set(attributeValue, e.target.value);
			e.preventDefault();
		}, false);

		// self.view.addEventListener('submit', function (e) {
		// 	console.log(e);
		// 	e.preventDefault();
		// }, false);
	};

	function ModelInterface (data) {
		this.model = data.model;
		this.isProxy = Proxy ? true : false;
	}

	ModelInterface.prototype.proxy = function (object, callback, prefix) {
		var self = this, value;

		if (!prefix) prefix = '';

		var handler = {
			get: function (target, property) {
				value = target[property];

				if (value !== null && value !== undefined && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
					return self.proxy(value, callback, prefix + property + '.');
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
	};

	ModelInterface.prototype.define = function (object, callback, prefix) {
		var self = this, newObject = {}, properties = {};

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
				newObject[key] = self.define(value, callback, prefixObject);
			} else {
				properties[key] = handler(object, key, prefixVariable);
			}
		}

		return Object.defineProperties(newObject, properties);
	};

	ModelInterface.prototype.get = function (path) {
		return Utility.getByPath(this.model, path);
	};

	ModelInterface.prototype.set = function (path, data) {
		Utility.setByPath(this.model, path, data);
	};

	ModelInterface.prototype.setup = function (ViewInterface) {
		var self = this;

		self.ViewInterface = ViewInterface;

		// value is provided maybe usefull
		function change (key) {
			key = Utility.getPathParent(key);
			key = '(((s-)|(data-s-))(.*?)="' + key +'(.*?)")';
			key = new RegExp(key);

			self.ViewInterface.update(null, key);
		}

		if (self.isProxy) {
			self.model = self.proxy(self.model, change);
		} else {
			self.model = self.define(self.model, change);
		}
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

		self.model = data.model;
		self.view = self.doc.querySelector(self.query);

		self.ModelInterface = new ModelInterface({
			model: self.model
		});

		self.ViewInterface = new ViewInterface({
			view: self.view
		});

		self.ModelInterface.setup(self.ViewInterface);
		self.ViewInterface.setup(self.ModelInterface);

		self.model = self.ModelInterface.model;
		self.view = self.ViewInterface.view;

		if (callback) callback(self);

		// window.addEventListener('DOMContentLoaded', function () {
		// 	self.viewdb = {};
		// 	var elements = self.view.getElementsByTagName('*');
		// 	for (var i = 0, l = elements.length; i < l; i++) {
		// 		var id = Utility.id();
		// 		elements[i].id = id;
		// 		self.viewdb[id] = { element: elements[i] };
		// 	}
		// 	console.log(self.viewdb);
		// });
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
		// for (var name in window.Swathe.controllers) {
		// 	if (window.Swathe.controllers.hasOwnProperty(name)) {
		// 		window.Swathe.controllers[name].view.classList.toggle('s-show-true');
		// 	}
		// }
	});

	return Swathe;

})));