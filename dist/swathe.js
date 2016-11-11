(function () {
	'use strict';

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
		return string.replace(']', '').replace('[', '.').split('.');
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
		var pattern = /(-.)/g; // |(\..)

		return string.replace(pattern, function (match) {
			return match[1].toUpperCase();
		});
	}

	function isSwatheAttribute (string) {
		return /(^s-)|(^data-s)/.test(string);
	}

	function normalizeAttribute (string) {
		string = string.replace(/^data-s-/, '');
		string = string.replace(/^s-/, '');
		string = toCamelCase(string);
		return string;
	}

	function DomCreate (self, scope, sElements, sPaths, sNames, sValues) {
		var attributeValue = '';
		var attributeName = '';
		var attribute = null;
		var element = null;
		var isNew = null;
		var index = null;
		var isController = null;

		sPaths = sPaths || {};
		sNames = sNames || {};
		sValues = sValues || {};
		sElements = sElements || [];

		index = sElements.length;

		// loop elements
		for (var i = 0, l = scope.children.length; i < l; i++) {
			element = scope.children[i];
			isNew = false;

			isController = element.getAttribute('s-controller') || element.getAttribute('data-s-controller');

			// loop attributes
			if (element.attributes.length > 0 && !isController) {
				for (var c = 0, t = element.attributes.length; c < t; c++) {
					attribute = element.attributes[c];

					if (isSwatheAttribute(attribute.name)) {
						attributeName = attribute.name;
						attributeName = normalizeAttribute(attributeName);

						attributeValue = attribute.value;

						if (!sNames[attributeName]) sNames[attributeName] = [];
						sNames[attributeName].push(index);

						if (!sValues[attributeValue]) sValues[attributeValue] = [];
						sValues[attributeValue].push(index);

						if (!sPaths[attributeName + ':' + attributeValue]) sPaths[attributeName + ':' + attributeValue] = [];
						sPaths[attributeName + ':' + attributeValue].push(index);

						isNew = true;
					}
				}
			}

			if (isNew) {
				index++;
				sElements.push(element);
			}

			// loop children
			if (element.children.length > 0 && !isController) {
				DomCreate(self, element, sElements, sPaths, sNames, sValues);
			}

		}

		self.sPaths = sPaths;
		self.sNames = sNames;
		self.sValues = sValues;
		self.sElements = sElements;
	}

	var Dom = function (scope) {
		var self = this;

		self.sElements = [];
		self.sPaths = {};
		self.sNames = {};
		self.sValues = {};
		self.scope = scope;

		DomCreate(self, scope);
	};

	Dom.prototype.findByName = function (sName) {
		var self = this;

		return self.sNames[sName].map(function (index) {
			return self.sElements[index];
		});
	};

	Dom.prototype.findByValue = function (sValue) {
		var self = this;

		return self.sValues[sValue].map(function (index) {
			return self.sElements[index];
		});
	};

	Dom.prototype.findByPath = function (sName, sValue) {
		var self = this;

		return self.sPaths[sName + ':' + sValue].map(function (index) {
			return self.sElements[index];
		});
	};

	function onElement (model, element, sName, sValue) {
		var eventName = sName;
		var sValues = sValue;

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

	function forElement (model, element, sName, sValue) {
		var sValues = sValue.split(' of ');
		var variable = sValues[0];
		var iterable = sValues[1];
		var iterableArray = getByPath(model, iterable);

		var fragment = document.createDocumentFragment();

		// clone child elements
		each(iterableArray.length, function () {
			each(element.children, function (child) {
				fragment.appendChild(child.cloneNode(true));
			});
		});

		var fragmentDom = new Dom(fragment);

		var iterableElements = fragmentDom.findByValue(variable);

		each(iterableElements, function (element, index) {
			each(element.attributes, function (attribute) {
				if (attribute.value === variable) {
					attribute.value = iterable + '.'+ index;
				}
			});
		});

		renderElements(model, fragmentDom.sElements);

		// replace children
		// element.swathe.removeChildren();
		element = removeChildren(element);
		element.appendChild(fragment);
	}

	// function ValueElement (element, sName, sValue) {
	// 	console.log(value);
	// }

	function defaultElement (model, element, sName, sValue, mValue) {
		mValue = mValue || getByPath(model, sValue);
		setByPath(element, sName, mValue);
	}

	function proxyElement (model, element, sName, sValue, mValue) {
		if (/(^on.*)|(^event.*)/.test(sName)) {
			onElement(model, element, sName, sValue);
		} else if (/for/.test(sName)) {
			forElement(model, element, sName, sValue);
		} else if (/value/.test(sName)) {
			// ValueElement(model, element, sName, sValue);
		} else {
			defaultElement(model, element, sName, sValue, mValue);
		}
	}

	function renderElements (model, elements, mValue) {
		each(elements, function (element) {
			each(element.attributes, function (attribute) {
				if (attribute && isSwatheAttribute(attribute.name)) {
					var sName = normalizeAttribute(attribute.name);
					var sValue = attribute.value;
					proxyElement(model, element, sName, sValue, mValue);
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

	var Controller = function (name, model, scope) {
		var observeObjects = window.Proxy ? observeObjectsProxy : observeObjectsDefine;
		var self = this;

		self.name = name;
		self.model = model;

		self.dom = new Dom(scope);

		self.valueElements = self.dom.findByName('value');

		self.model = observeObjects (self.model, function (sValue, mValue) {
			var sValueElements = self.dom.findByValue(sValue);
			renderElements(self.model, sValueElements, mValue);
		});

		self.view = observeElements (self.valueElements, function (sName, sValue, value) {
			setByPath(self.model, sValue, value);
		});

	};

	if (!window.Swathe)  {

		window.Swathe = {
			controllers: {},
			controller: function (name, model, scope) {
				if (!name) throw new Error('Controller - name parameter required');
				if (!model) throw new Error('Controller - model parameter required');

				scope = document.querySelector('[s-controller=' + name + ']') || document.querySelector('[data-s-controller=' + name + ']');

				if (!scope) throw new Error('Controller - missing or invalid "s-controller" attribute');

				this.controllers[name] = new Controller(name, model, scope);
				renderElements(this.controllers[name].model, this.controllers[name].dom.sElements);

				return this.controllers[name];
			}
		};

	}

}());