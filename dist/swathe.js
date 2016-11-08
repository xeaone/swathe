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

	function getByPath (object, path) {
		var keys = path.swathe.pathKeys();
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
		var keys = path.swathe.pathKeys();
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
		var pattern = /(-.)|(\..)/g;

		return string.replace(pattern, function (match) {
			return match[1].toUpperCase();
		});
	}

	function toDotCase (string) {
		var pattern = /[A-Z]/g;

		return string.replace(pattern, function (match) {
			return '.' + match.toLowerCase();
		});
	}

	function isSAttribute (string) {
		return /(^s-)|(^data-s)/.test(string);
	}

	function toCleanAttribute (string) {
		string = string.replace(/^data-s-/, '');
		string = string.replace(/^s-/, '');
		return string;
	}

	var Dom = function (scope) {
		this.sElements = [];
		this.sPaths = {};
		this.sNames = {};
		this.sValues = {};
		this.scope = scope;
	};

	Dom.prototype.create = function (scope, sElements, sPaths, sNames, sValues) {
		var attributeValue = '';
		var attributeName = '';
		var attribute = null;
		var element = null;

		sElements = sElements || [];
		sPaths = sPaths || {};
		sNames = sNames || {};
		sValues = sValues || {};
		scope = scope || this.scope;

		// loop elements
		for (var i = 0, l = scope.children.length; i < l; i++) {
			element = scope.children[i];

			// loop attributes
			if (element.attributes.length > 0) {
				for (var c = 0, t = element.attributes.length; c < t; c++) {
					attribute = element.attributes[c];

					if (!isSAttribute(attribute.name)) continue;

					attributeName = attribute.name;
					attributeName = toCleanAttribute(attributeName);
					attributeName = toCamelCase(attributeName);

					attributeValue = attribute.value;

					if (!sNames[attributeName]) sNames[attributeName] = [];
					sNames[attributeName].push(sElements.length);

					if (!sValues[attributeValue]) sValues[attributeValue] = [];
					sValues[attributeValue].push(sElements.length);

					// TODO: decided what path style to use
					if (!sPaths[attributeName + '/' + attributeValue]) sPaths[attributeName + '/' + attributeValue] = [];
					sPaths[attributeName + '/' + attributeValue].push(sElements.length);

					sElements.push(element);
				}
			}

			// loop children
			if (element.children.length > 0) {
				this.create(element, sElements, sPaths, sNames, sValues);
			}
		}

		this.sElements = sElements;
		this.sPaths = sPaths;
		this.sNames = sNames;
		this.sValues = sValues;
	};

	Dom.prototype.findOneByPath = function (sName, sValue) {
		var self = this;

		var index = self.obj[sName][sValue];

		return self.sElements[index];

	};

	Dom.prototype.findOneByIndex = function (index) {
		var self = this;
		return self.sElements[index];
	};

	Dom.prototype.findAll = function (sName, sValue) {
		var self = this;

		var nameObject = self.obj[sName];

		if (sValue) {
			return nameObject[sValue].map(function (index) {
				return self.sElements[index];
			});
		} else {
			var array = [];

			for (var value in nameObject) {
				array = array.concat(nameObject[value]);
			}

			return array.map(function (index) {
				return self.sElements[index];
			});
		}
	};

	var RGS = {
		comma: '(\\s*)\\,(\\s*)',
		collon: '(\\s*)\\:(\\s*)',
		bracketOpen: '(\\s*)\\((\\s*)',
		bracketClose: '(\\s*)\\)(\\s*)'
	};

	var RG = {
		parameters: new RegExp(
			'(' + RGS.comma + ')|' +
			'(' + RGS.collon + ')|' +
			'(' + RGS.bracketOpen + ')|' +
			'(' + RGS.bracketClose + ')',
			'g'
		)
	};

	function defineStringSwatheProperties () {
		Object.defineProperty(String.prototype, 'swathe', {
			writeable: false,
			configurable: true,
			get: function () {
				return {
					string: this,
					pathKeys: function () {
						return this.string.replace('[', '.').replace(']', '').split('.');
					}
				};
			}
		});
	}

	function defineElementSwatheProperties () {
		Element.prototype.swatheData = {};

		Object.defineProperty(Element.prototype, 'swathe', {
			enumerable: true,
			configurable: true,
			get: function () {
				var element = this;

				return Object.defineProperties({ element: element }, {
					type: {
						enumerable: true,
						configurable: true,
						get: function () {
							return element.constructor.name;
						}
					},
					attributes: {
						enumerable: true,
						configurable: true,
						get: function () {
							var attributes = [];

							for (var i = 0, l = element.attributes.length; i < l; i++) {
								var attribute = element.attributes[i];
								var value = attribute.value;
								var name = attribute.name;

								if (this.isAttribute(name)) {
									value = value.replace(RG.parameters, ' ').trim().split(' ');
									attributes.push(value);
								}
							}

							return attributes;
						}
					},
					attribute: {
						enumerable: true,
						configurable: true,
						get: function () {
							return element.getAttribute('data-s') || '';
						}
					},
					parameters: {
						enumerable: true,
						configurable: true,
						get: function () {
							return this.attribute
							.replace(RG.parameters, ' ')
							.trim()
							.split(' ');
						}
					},
					parameterFirst: {
						enumerable: true,
						configurable: true,
						get: function () {
							return this.parameters[0];
						}
					},
					parameterLast: {
						enumerable: true,
						configurable: true,
						get: function () {
							return this.parameters[this.parameters.length - 1];
						}
					},
					eventMethodParameters: {
						enumerable: true,
						configurable: true,
						get: function () {
							return this.parameters.splice(2);
						}
					},
					eventMethod: {
						enumerable: true,
						configurable: true,
						get: function () {
							return this.parameters[1];
						}
					},
					eventName: {
						enumerable: true,
						configurable: true,
						get: function () {
							return this.parameterFirst.slice(2).toLowerCase();
						}
					},
					isFor: {
						value: function (string) {
							return /^for/.test(string);
						}
					},
					isEvent: {
						value: function (string) {
							return /^on/.test(string);
						}
					},
					isValue: {
						value: function (string) {
							return /^value/.test(string);
						}
					},
					isAttribute: {
						value: function (string) {
							return /^data-s/.test(string);
							// return /^s\-/.test(string);
						}
					},
					toCamelCase: {
						value: function (string) {
							var nextIndex = string.search('-') + 1;
							var nextLetter = string.charAt(nextIndex).toString();
							var r = '-' + nextLetter;
							var n = nextLetter.toUpperCase();
							return string.replace(r, n);
						}
					},
					data: {
						value: function (key, value) {
							if (!value) return element.swatheData[key];
							else element.swatheData[key] = value;
						}
					},
					removeChildren: {
						value: function () {
							while (element.firstChild) {
								element.removeChild(element.firstChild);
							}
						}
					}
				});
			}
		});
	}

	function ObserveSObjects (object, callback, prefix) {
		if (!prefix) prefix = '';

		var handler = {
			get: function (target, property) {
				if (is('Object', target[property]) || is('Array', target[property])) {
					return ObserveSObjects(target[property], callback, prefix + property + '.');
				} else {
					return target[property];
				}
			},
			set: function (target, property, value) {
				if (target[property] !== value) { // send change if value is different
					target[property] = value;
					callback(prefix + property, value, target);
				}

				return true;
			}
		};

		return new Proxy(object, handler);
	}

	function ObserveSElements (elements, callback) {

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

	// var renderGroup = function (model, elements, path, value) {
	// 	each(elements, function (element) {
	// 		path = path || element.swathe.parameterLast;
	// 		value = value || getByPath(model, path);
	// 		renderSingle(model, element, path, value);
	// 	});
	// };
	//
	// var renderAll = function (sElements, model) {
	// 	each(sElements, function (elements, path) {
	// 		renderGroup(model, elements, path);
	// 	});
	// };

	var renderOne = function (model, dom, sValue, value) {
		console.log(sValue);
		console.log(value);

		var element = dom.findOneByPath(path);
		// console.log(element);

		// var element = dom.arr[index];
		// var value = getByPath(model, pathName);
		// setByPath(element, commandName, value);
	};

	var renderAll = function (dom, model) {
		each(dom.obj, function (sNameObj, sName) {
			each(sNameObj, function (sValueArray, sValue) {
				each(sValueArray, function (index) {
					var element = dom.arr[index];

					sValue = toDotCase(sValue);
					sName = toDotCase(sName);

					var value = getByPath(model, sValue);
					setByPath(element, sName, value);
				});
			});
		});
	};

	var Controller = function (name, model, scope) {
		var self = this;

		self.name = name;
		self.model = model;
		self.scope = scope;

		// self.sElements = GetSElements(self.scope);
		// self.sInputElements = GetSInputElements(self.scope);

		self.dom = new Dom(self.scope);
		self.dom.create(self.scope);

		self.valueElements = self.dom.findAll('value');

		self.model = ObserveSObjects (self.model, function (sValue, value) {
			// renderGroup(self.model, self.sElements[path], path, value);
			renderOne(self.model, self.dom, sValue, value);
		});

		// self.sInputElements
		self.view = ObserveSElements (self.valueElements, function (sName, sValue, value) {
			setByPath(self.model, sValue, value);
		});

	};

	if (!window.Swathe)  {

		defineStringSwatheProperties();
		defineElementSwatheProperties();

		window.Swathe = {
			dom: Dom,
			controllers: {},
			controller: function (name, model, scope) {
				if (!name) throw new Error('Controller: name parameter required');
				if (!model) throw new Error('Controller: model parameter required');

				scope = document.querySelector('s-controller=' + name) || document.querySelector('data-s-controller=' + name);

				if (!scope) throw new Error('Controller: scope missing or invalid "s-controller" attribute');

				this.controllers[name] = new Controller(name, model, scope);
				renderAll(this.controllers[name].dom, this.controllers[name].model);

				return this.controllers[name];
			}
		};

	}

	// function addEventListeners (target, props) {
	// 	Object.keys(props).forEach(name, function () {
	// 		if (isEvent(name)) {
	// 			target.addEventListener(getEventName(name), props[name]);
	// 		}
	// 	});
	// }

}());