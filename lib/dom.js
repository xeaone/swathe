(function() {
	'use strict';

	if (!window.Swathe) window.Swathe = {};

	var isSwatheAttribute = function (string) {
		return /^s\-/.test(string);
	};

	var getSwatheAttributeName = function (string) {
		return window.Swathe.toCamelCase(string.slice(2));
	};

	window.Swathe.Dom = function (scope) {
		this.scope = scope;
	};

	window.Swathe.Dom.prototype.create = function (scope, sArray, sObject) {
		var attributeName = '';
		var attribute = null;
		var element = null;

		sArray = sArray || [];
		sObject = sObject || {};
		scope = scope || this.scope;

		// loop elements
		for (var i = 0, l = scope.children.length; i < l; i++) {
			element = scope.children[i];

			// loop attributes
			if (element.attributes.length > 0) {
				for (var c = 0, t = element.attributes.length; c < t; c++) {
					attribute = element.attributes[c];

					if (isSwatheAttribute(attribute.name)) {
						attributeName = getSwatheAttributeName(attribute.name);

						if (!sObject[attributeName]) sObject[attributeName] = {};
						if (!sObject[attributeName][attribute.value]) sObject[attributeName][attribute.value] = [];

						sObject[attributeName][attribute.value].push(sArray.length);
						sArray.push(element);

						break;
					}
				}
			}

			// loop children
			if (element.children.length > 0) {
				this.create(element, sArray, sObject);
			}
		}

		this.arr = sArray;
		this.obj = sObject;
	};

	window.Swathe.Dom.prototype.findOne = function (index) {
		var self = this;
		return self.arr[index];
	};

	window.Swathe.Dom.prototype.findAll = function (sName, sValue) {
		var self = this;

		return self.obj[sName][sValue].map(function (index) {
			return self.findOne(index);
		});
	};

}());
