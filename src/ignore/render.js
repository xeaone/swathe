import { Dom } from './dom.js';
import { each, getByPath, setByPath, removeChildren, normalizeAttribute, isSwatheAttribute } from './utilities.js';

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

export function renderElements (model, elements, mValue) {
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
