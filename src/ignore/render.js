import { each, getByPath, setByPath, removeChildren } from './utilities.js';

var PATTERN = {
	FOR: /(^s-for.*)|(^data-s-for.*)/,
	VALUE: /(^s-value.*)|(^data-s-value.*)/,
	ON: /(^s-on.*)|(^s-event.*)|(^data-s-on.*)|(^data-s-event.*)/
};

function onElement (model, dom, name, value, element) {

	value = value.replace(/\(/g, ', ');
	value = value.replace(/\)/g, '');
	value = value.split(', ');

	name = name.replace(/(s-)|(on-)|(event-)|(-)/g, '');
	name = name.toLowerCase();

	var methodPath = value[0];
	var methodParameters = value;

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

	element.addEventListener(name, methodBound);
}

function forElement (model, dom, name, value, element) {
	var values = value.split(' of ');
	var variable = values[0];
	var iterable = values[1];
	var iterableArray = getByPath(model, iterable);
	var fragment = document.createDocumentFragment();

	// clone child elements
	each(iterableArray.length, function () {
		each(element.children, function (child) {
			fragment.appendChild(child.cloneNode(true));
		});
	});

	var elements = fragment.querySelectorAll('*');
	var namePattern = /(^s-.*)|(^data-s-.*)/;
	var valuePattern = /.*/;
	var index = 0;

	// change variable name
	each(elements, function (element) {
		each(element.attributes, function (attribute) {
			if (attribute.value === variable) {
				attribute.value = iterable + '.'+ index;
				index++;
			}
		});
	});

	handleElements (model, dom, name, value, elements, namePattern, valuePattern);

	element = removeChildren(element);
	element.appendChild(fragment);
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
		forElement(model, dom, name, value, element);
	// } else if (PATTERN.VALUE.test(name)) {
		// valueElement(model, dom, name, value, element);
	} else {
		defaultElement(model, dom, name, value, element);
	}
}

function handleElements (model, dom, name, value, elements, namePattern, valuePattern) {
	elements.forEach(function (element) {
		each(element.attributes, function (attribute) {
			if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
				proxy(model, dom, attribute.name, attribute.value, element);
			}
		});
	});
}

export function Render (model, dom, name, value) {
	var elements = dom.findByAttribute(name + '="' + value + '"');
	var namePattern = new RegExp(name);
	var valuePattern = new RegExp(value);

	handleElements(model, dom, name, value, elements, namePattern, valuePattern);
}
