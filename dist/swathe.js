(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('Swathe', factory) :
	(global.Swathe = factory());
}(this, (function () { 'use strict';

	var Utility = {
		GET: 2,
		SET: 3,

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

		// ensureBoolean: function (value) {
		// 	if (typeof value === 'string') return value === 'true';
		// 	else return value;
		// },
		//
		// ensureString: function (value) {
		// 	if (typeof value === 'object') return JSON.stringify(value);
		// 	else return value.toString();
		// },

		/*
			object
		*/

		interact: function (type, collection, path, value) {
			// var keys = this.toCamelCase(path).split('.');
			var keys = path.split('.');
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

		eachElement: function (elements, reject, skip, accept, callback) {
			for (var index = 0, element, glance; index < elements.length; index++) {
				element = elements[index];
				glance = this.glance(element);

				if (reject && reject.test(glance)) {
					index += element.children.length;
				} else if (skip && skip.test(glance)) {
					continue;
				} else if (accept && accept.test(glance)) {
					callback(element, index);
				}
			}
		}

	};

	// uid: function () {
	// 	return Math.random().toString(36).substr(2, 9);
	// },

	// eachAttribute: function (attributes, pattern, callback) {
	// 	for (var index = 0, attribute; index < attributes.length; index++) {
	// 		attribute = {
	// 			name: attributes[index].name,
	// 			value: attributes[index].value,
	// 			full: attributes[index].name + '="' + attributes[index].value + '"'
	// 		};
	//
	// 		if (pattern && pattern.test(attribute.full)) {
	// 			callback(attribute, index);
	// 		}
	// 	}
	// },

	function Component (element, controller) {
		this.isChangeEventAdded = false;
		this.controller = controller;
		this.isChanging = false;
		this.element = element;
		this.listeners = {};
		this.clone;
	}

	Component.prototype.on = function (data) {
		if (typeof data.value !== 'function') return;

		var self = this;
		var eventName = data.cmds[1];
		var methodName = data.opts[data.opts.length-1];

		self.element.removeEventListener(eventName, self.listeners[methodName], false);

		self.listeners[methodName] = function (e) {
			e.preventDefault();
			data.value.call(self.controller.model, e);
		};

		self.element.addEventListener(eventName, self.listeners[methodName], false);
	};

	Component.prototype.each = function (data) {
		var self = this;

		if (!self.clone) self.clone = self.element.children[0];

		var variable = data.cmds.slice(1);
		var child = self.clone.cloneNode(true);
		var inner = '';

		child = child.outerHTML;
		variable = Utility.toCamelCase(variable);
		variable = new RegExp('="'+ variable, 'g');

		for (var i = 0, l = data.value.length; i < l; i++) {
			inner += child.replace(variable, '="' + data.attribute.value + '.' + i.toString());
		}

		self.element.innerHTML = inner;
		self.controller.insert(self.element.getElementsByTagName('*'));
	};

	Component.prototype.value = function (data) {
		var self = this;

		if (self.element.type === 'checkbox' || self.element.type === 'radio') {
			data.value = self.modifiers(data.attribute.value, data.value);
			self.element.value = data.value;
			self.element.checked = data.value;
		}

		if (self.isChangeEventAdded) return;
		else self.isChangeEventAdded = true;

		var change = function (e) {
			if (self.isChanging) return;
			else self.isChanging = true;

			var element = e.target;
			var value = element.type === 'checkbox' || element.type === 'radio' ? element.checked : element.value;
			var path = element.getAttribute(self.controller.sValue);

			value = self.modifiers(path, value);
			path = path.replace(self.controller.rPath, '');

			// if (element.multiple) {
			// 	var v = Utility.getByPath(self.controller.model, path);
			// 	v.push();
			// 	value = v;
			// }

			Utility.setByPath(self.controller.model, path, value);
			self.isChanging = false;
		};

		self.element.addEventListener('change', change);
		self.element.addEventListener('keyup', change);
	};

	Component.prototype.html = function (data) {
		this.element.innerHTML = data.value;
		this.controller.insert(this.element.getElementsByTagName('*'));
	};

	Component.prototype.css = function (data) {
		if (data.cmds.length > 1) data.value = data.cmds.slice(1).join('-') + ': ' +  data.value + ';';
		this.element.style.cssText += data.value;
	};

	Component.prototype.class = function (data) {
		var className = data.cmds.slice(1).join('-');
		this.element.classList.toggle(className, data.value);
	};

	Component.prototype.enable = function (data) {
		this.element.disabled = !data.value;
	};

	Component.prototype.disable = function (data) {
		this.element.disabled = data.value;
	};

	Component.prototype.show = function (data) {
		this.element.hidden = !data.value;
	};

	Component.prototype.hide = function (data) {
		this.element.hidden = data.value;
	};

	Component.prototype.write = function (data) {
		this.element.readOnly = !data.value;
	};

	Component.prototype.read = function (data) {
		this.element.readOnly = data.value;
	};

	Component.prototype.selected = function (data) {
		this.element.selectedIndex = data.value;
	};

	Component.prototype.text = function (data) {
		this.element.innerText = data.value;
	};

	Component.prototype.default = function (data) {
		var path = Utility.toCamelCase(data.cmds);
		Utility.setByPath(this.element, path, data.value);
	};

	Component.prototype.modifiers = function (string, value) {
		if (string.indexOf('|') === -1) return value;

		var self = this;
		var modifiers = string.replace(self.controller.rModifier, '').split(' ');

		for (var i = 0, l = modifiers.length; i < l; i++) {
			if (modifiers[i] in self.controller.modifiers) {
				value = self.controller.modifiers[modifiers[i]].call(value);
			}
		}

		return value;
	};

	Component.prototype.render = function (attribute) {
		var self = this, data = { attribute: attribute };

		data.attribute.value = data.attribute.value.trim();
		data.path = data.attribute.value.replace(self.controller.rPath, '');
		data.command = data.attribute.name.replace(self.controller.rPrefix, '');

		data.opts = data.path.split('.');
		data.cmds = data.command.split('-');

		data.value = Utility.getByPath(self.controller.model, data.path);
		data.value = self.modifiers(data.attribute.value, data.value);

		if (data.value === null || data.value === undefined) return;
		else if (data.cmds[0] in self) self[data.cmds[0]](data);
		else self.default(data);
	};

	Component.prototype.eachAttribute = function (pattern, callback) {
		var attributes = this.element.attributes;
		var index = 0, length = attributes.length, attribute;

		if (typeof pattern === 'string') pattern = new RegExp(pattern);

		for (index; index < length; index++) {
			attribute = {
				name: attributes[index].name,
				value: attributes[index].value,
				full: attributes[index].name + '="' + attributes[index].value + '"'
			};

			if (pattern && pattern.test(attribute.full)) {
				callback(attribute, index);
			}
		}
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

	/*
		@preserve
		title: swathe
		version: 2.0.3
		license: mpl-2.0
		author: alexander elias
	*/

	function Controller (data, callback) {
		this.callback = callback;
		this.doc = data.doc;
		this.name = data.name;
		this.view = data.view || {};
		this.model = data.model || {};
		this.modifiers = data.modifiers || {};

		this.sPrefix = data.prefix + '-';
		this.sValue = data.prefix + '-value';
		this.sFor = data.prefix + '-for-(.*?)="';
		this.sAccepts = data.prefix + '-' + '(.*?)="';
		this.sRejects = data.prefix + '-controller=|' + data.rejects;
		this.query = '[' + data.prefix + '-controller=' + data.name + ']';

		this.rPath = /(\s)?\|(.*?)$/;
		this.rModifier = /^(.*?)\|(\s)?/;

		this.rFor = new RegExp(this.sFor);
		this.rPrefix = new RegExp(this.sPrefix);
		this.rAccepts = new RegExp(this.sAccepts);
		this.rRejects = new RegExp(this.sRejects);

		this.scope = data.doc.querySelector(this.query);
		if (!this.scope) throw new Error('missing attribute s-controller ' + data.name);
	}

	Controller.prototype.insert = function (elements) {
		var self = this;

		Utility.eachElement(elements, self.rRejects, null, self.rAccepts, function (element, index) {
			var component = new Component(element, self);

			component.eachAttribute(self.rAccepts, function (attribute) {
				if (self.rFor.test(attribute.name)) index = index + 1;
				if (self.view[attribute.value]) self.view[attribute.value].push(component);
				else self.view[attribute.value] = [component];
				component.render(attribute);
			});
		});
	};

	Controller.prototype.setup = function () {
		var self = this;

		self.model = obsr(self.model, function (path) {
			var paths = path.split('.');
			if (paths.length > 1 && !isNaN(paths.slice(-1))) {
				path = paths.slice(0, -1).join('.');
			}

			var components = self.view[path];
			if (components) {
				for (var i = 0, l = components.length, component; i < l; i++) {
					component = components[i];

					component.eachAttribute(self.sAccepts + path, function (attribute) {
						component.render(attribute);
					});
				}
			}
		});

		self.insert(self.scope.getElementsByTagName('*'));
		if (self.callback) self.callback.call(this);
	};

	var swathe_b = {
		prefix: 's',
		doc: document,
		controllers: {},
		rejects: 'iframe|object|script',
		controller: function (data, callback) {
			if (!data.name) throw new Error('Controller - name parameter required');
			// if (data.name in this.controllers) throw new Error('Controller - name ' + data.name + ' exists');

			data.doc = data.doc || this.doc;
			data.prefix = data.prefix || this.prefix;
			data.rejects = data.rejects || this.rejects;

			var controller = new Controller(data, callback);
			controller.setup();
			this.controllers[data.name] = controller;
			return controller;
		}
	};

	return swathe_b;

})));
