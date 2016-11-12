import { each, getByPath, setByPath, removeChildren } from './utilities.js';

var PATTERN = {
	FOR: /(^s-for.*)|(^s-for.*)/,
	VALUE: /(^s-value.*)|(^s-value.*)/,
	ON: /(^s-on.*)|(^s-event.*)|(^data-s-on.*)|(^data-s-event.*)/
};

function onElement (model, dom, name, value, element) {
	var eventName = name;
	var sValues = value;

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

function forElement (model, dom, name, value, element) {
	var sValues = value.split(' of ');
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

	each(fragment, function (element, index) {
		each(element.attributes, function (attribute) {
			if (attribute.value === variable) {
				attribute.value = iterable + '.'+ index;
			}
		});
	});


	element = removeChildren(element);
	element.appendChild(fragment);
	// Render(model, dom, );
}

// function valueElement (model, dom, name, value, element) {
// 	console.log(value);
// }

function defaultElement (model, dom, name, value, element) {
	value = getByPath(model, value);
	setByPath(element, name, value);
}

function proxy (model, dom, name, value, element) {
	if (PATTERN.ON.test(name)) {
		onElement(model, dom, name, value, element);
	} else if (PATTERN.FOR.test(name)) {
		// forElement(model, dom, name, value, element);
	} else if (PATTERN.VALUE.test(name)) {
		// valueElement(model, dom, name, value, element);
	} else {
		defaultElement(model, dom, name, value, element);
	}
}

export function Render (model, dom, name, value) {
	var elements = dom.findByAttribute({ name: name, value: value });
	var namePattern = new RegExp(name);
	// var valuePattern = new RegExp(value);

	elements.forEach(function (element) {
		each(element.attributes, function (attribute) {
			if (attribute && namePattern.test(attribute.name)) {
				proxy(model, dom, attribute.name, attribute.value, element);
			}
		});
	});
}
