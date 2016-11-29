import { each, getByPath, setByPath, removeChildren, toCamelCase } from './utilities.js';
import { ajax } from './ajax.js';

var PATTERN = {
	IF: /(^s-if.*)|(^data-s-if.*)/,
	FOR: /(^s-for.*)|(^data-s-for.*)/,
	CSS: /(^s-css.*)|(^data-s-css.*)/,
	HTML: /(^s-html.*)|(^data-s-html.*)/,
	// VIEW: /(^s-view.*)|(^data-s-view.*)/,
	TEXT: /(^s-text.*)|(^data-s-text.*)/,
	STYLE: /(^s-style.*)|(^data-s-style.*)/,
	VALUE: /(^s-value.*)|(^data-s-value.*)/,
	ON: /(^s-on.*)|(^s-event.*)|(^data-s-on.*)|(^data-s-event.*)/
};

function onElement (model, dom, name, value, element) {

	value = value.replace(/\(/g, ', ');
	value = value.replace(/\)/g, '');
	value = value.split(', ');

	name = name.replace(/(data-)|(s-)|(on-)|(event-)|(-)/g, '');
	name = name.toLowerCase();

	var methodPath = value[0];
	var methodParameters = value;
	var method = getByPath(model, methodPath);

	// if (!method) return null;

	methodParameters.splice(0, 1);

	// convert parameters
	methodParameters.forEach(function (parameter, index) {
		if (/^[0-9]*$/.test(parameter)) {
			methodParameters[index] = parseInt(parameter);
		} else if (!/(')|(")|(`)/.test(parameter)) {
			methodParameters[index] = getByPath(model, parameter);
		}
	});

	var methodBound = method.bind.apply(method, [element].concat(methodParameters));

	element.addEventListener(name, methodBound);
}

function forElement (model, dom, name, value, element) {
	var variable = name.split('-').pop();
	var iterable = value;

	var iterableArray = getByPath(model, iterable);
	var fragment = document.createDocumentFragment();

	// clone child elements
	iterableArray.forEach(function () {
		each(element.children, function (child) {
			fragment.appendChild(child.cloneNode(true));
		});
	});

	var elements = fragment.querySelectorAll('*');
	var namePattern = /(^s-.*)|(^data-s-.*)/;
	var valuePattern = /.*/;
	var index = 0;

	// change forElement child variable names
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

function cssElement (model, dom, name, value, element) {
	var styles = value.replace(/\s/g, '').split(';');
	var cssText = null;
	var viewValue = null;
	var modelValue = null;
	var viewValueClean = null;

	styles.forEach(function (style) {
		viewValue = style.split(':').pop();

		if (/^\$/.test(viewValue)) {
			viewValueClean = viewValue.replace('$', '');
			modelValue = getByPath(model, viewValueClean);

			if (modelValue) {
				style = style.replace(viewValue, modelValue);
				cssText = getByPath(element, 'style.cssText');
				setByPath(element, 'style.cssText', cssText + style);
			}
		}
	});
}

function ifElement (model, dom, name, value, element) {
	value = getByPath(model, value);
	if (value) element.classList.remove('s-if-false');
	else element.classList.add('s-if-false');
}

function styleElement (model, dom, name, value, element) {
	name = name.replace(/(s-style-)|(data-s-style-)/, 'style.');
	name = toCamelCase(name);
	defaultElement(model, dom, name, value, element);
}

function htmlElement (model, dom, name, value, element) {
	name = 'innerHTML';

	if (/^\//.test(value)) {
		ajax({
			action: '/partial/index.html',
			success: function (xhr) {
				console.log(xhr);
			},
			error: function (xhr) {
				console.log(xhr);
			}
		});
	} else {
		defaultElement(model, dom, name, value, element);
	}
}

function textElement (model, dom, name, value, element) {
	name = 'innerText';
	defaultElement(model, dom, name, value, element);
}

// function valueElement (model, dom, name, value, element) {
// 	value = getByPath(model, value);
// 	setByPath(element, name, value);
// }

function defaultElement (model, dom, name, value, element) {
	// value = getByPath(model, value) || value;
	value = getByPath(model, value);
	setByPath(element, name, value);
}

function proxyElement (model, dom, name, value, element) {
	if (PATTERN.ON.test(name)) {
		onElement(model, dom, name, value, element);
	} else if (PATTERN.IF.test(name)) {
		ifElement(model, dom, name, value, element);
	} else if (PATTERN.FOR.test(name)) {
		forElement(model, dom, name, value, element);
	} else if (PATTERN.CSS.test(name)) {
		cssElement(model, dom, name, value, element);
	} else if (PATTERN.HTML.test(name)) {
		htmlElement(model, dom, name, value, element);
	} else if (PATTERN.TEXT.test(name)) {
		textElement(model, dom, name, value, element);
	} else if (PATTERN.STYLE.test(name)) {
		styleElement(model, dom, name, value, element);
	} else {
		defaultElement(model, dom, name, value, element);
	}
}

function handleElements (model, dom, name, value, elements, namePattern, valuePattern) {
	each(elements, function (element) {
		each(element.attributes, function (attribute) {
			if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
				proxyElement(model, dom, attribute.name, attribute.value, element);
			}
		});
	});
}

export function Render (model, dom, name, value) {
	var dollarPattern = '(\\$' + value + ')';
	var regularPattern = '(' + name + '=\"' + value + '\")';
	var elements = dom.findByAttribute(regularPattern + '|' + dollarPattern);

	handleElements(model, dom, name, value, elements, new RegExp(name), new RegExp(value));
}
