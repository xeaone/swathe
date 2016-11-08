import { Dom } from './ignore/dom.js';
import { is, each, getByPath, setByPath, toDotCase } from './ignore/utilities.js';
import { defineElementSwatheProperties, defineStringSwatheProperties } from './ignore/globals.js';
import { GetSElements, GetSInputElements, ObserveSObjects, ObserveSElements } from './ignore/s.js';

var forElement = function (model, element, name, value) {
	var parameters = element.swathe.attributes[name];
	var parameterLast =  parameters[parameters.length-1];
	var fragment = document.createDocumentFragment();

	// clone child elements
	each(value.length, function () {
		each(element.children, function (child) {
			fragment.appendChild(child.cloneNode(true));
		});
	});

	var children = fragment.querySelectorAll('[data-s$="'+ parameters[1] +'"]');

	// update child element's parameterFirst
	each(children, function (child, index) {
		// FIXME: needs to be in a loop over the attributes;
		var childParameters = child.swathe.attributes[name];
		var childKey = childParameters[0];
		// var childKey = child.swathe.parameterFirst;

		var childAttribute = childKey +': '+ parameterLast +'.'+ index;
		child.setAttribute('data-s', childAttribute);

		var path = child.swathe.parameterLast; // FIXME: start
		var value = getByPath(model, path);
		self.renderSingle(model, child, path, value);

		// add to sElements
		if (!self.sElements[path]) self.sElements[path] = [];
		self.sElements[path].push(child);
	});

	element.swathe.removeChildren();
	element.appendChild(fragment);
};

var eventElement = function (model, element) {
	var eventMethodParameters = element.swathe.eventMethodParameters;
	var eventMethod = element.swathe.eventMethod;
	var eventName = element.swathe.eventName;

	var method = getByPath(model, eventMethod);
	var methodBound = method.bind.apply(method, [element].concat(eventMethodParameters));

	// TODO: need to handle non function error

	element.addEventListener(eventName, methodBound);
};

var defaultElement = function (element, name, value) {
	setByPath(element, name, value);
};

var renderSingle = function (model, element, path, value) {
	var parameters = element.swathe.parameters;
	var command = parameters[0];

	switch (command) {
		case 'value': {
			console.log('value');
		}
			break;
		case 'for': {
			console.log('for');
			// forElement(model, element, name, value);
		}
			break;
		case 'on': {
			console.log('event');
			eventElement(model, element);
		}
			break;
		default: {
			defaultElement(element, command, value);
		}
	}

	// for (name in attribute) {
	// 	if (element.swathe.isEvent(attribute[name])) eventElement(model, element);
	// 	else if (!element.swathe.isValue(attribute[name])) otherElement(element, name, value);
	// 	else if (element.swathe.isFor(attribute[name])) forElement(model, element, name, value);
	// }

	// if (element.swathe.isEvent) self.eventElement(model, element);
	// else if (element.swathe.isFor) self.forElement(model, element, value);
	// else if (!element.swathe.isValue) self.otherElement(element, value);
};

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
