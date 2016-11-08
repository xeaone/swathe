import { toCamelCase, isSAttribute, toCleanAttribute } from './utilities.js';

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

export { Dom };

// Dom.prototype.create = function (scope, sArray, sObject) {
// 	var attributeName = '';
// 	var attribute = null;
// 	var element = null;
//
// 	sArray = sArray || [];
// 	sObject = sObject || {};
// 	scope = scope || this.scope;
//
// 	// loop elements
// 	for (var i = 0, l = scope.children.length; i < l; i++) {
// 		element = scope.children[i];
//
// 		// loop attributes
// 		if (element.attributes.length > 0) {
// 			for (var c = 0, t = element.attributes.length; c < t; c++) {
// 				attribute = element.attributes[c];
//
// 				if (isAttribute(attribute.name)) {
// 					attributeName = attribute.name;
// 					attributeName = toCleanAttribute(attributeName);
// 					attributeName = toCamelCase(attributeName);
//
// 					if (!sObject[attributeName]) sObject[attributeName] = {};
// 					if (!sObject[attributeName][attribute.value]) sObject[attributeName][attribute.value] = [];
//
// 					sObject[attributeName][attribute.value].push(sArray.length);
// 					sArray.push(element);
//
// 					break;
// 				}
// 			}
// 		}
//
// 		// loop children
// 		if (element.children.length > 0) {
// 			this.create(element, sArray, sObject);
// 		}
// 	}
//
// 	this.sElements = sArray;
// 	this.obj = sObject;
// };


// Dom.prototype.findAll = function (sName, sValue) {
// 	var self = this;
//
// 	return self.obj[sName][sValue].map(function (index) {
// 		return self.sElements[index];
// 	});
// };
