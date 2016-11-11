import { isSwatheAttribute, normalizeAttribute } from './utilities.js';

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

export var Dom = function (scope) {
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
