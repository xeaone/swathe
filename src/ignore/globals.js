
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

export { defineElementSwatheProperties, defineStringSwatheProperties };
