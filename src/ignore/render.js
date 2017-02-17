import Utility from './utility.js';
import Axa from 'axa';

var IF = /(s-if)|(data-s-if)/;
var FOR = /(s-for)|(data-s-for)/;
var CSS = /(s-css)|(data-s-css)/;
var HTML = /(s-html)|(data-s-html)/;
// var VIEW = /(s-view)|(data-s-view)/;
var TEXT = /(s-text)|(data-s-text)/;
var STYLE = /(s-style)|(data-s-style)/;
// var VALUE = /(s-value)|(data-s-value)/;
var ON = /(s-on)|(s-event)|(data-s-on)|(data-s-event)/;

export default function Render (data) {
	this.doc = document;
	this.view = data.view;
	this.model = data.model;
}

Render.prototype.eOn = function (model, view, name, value, element) {
	var self = this;

	value = value.replace(/\(/g, ', ');
	value = value.replace(/\)/g, '');
	value = value.split(', ');

	name = name.replace(/(data-)|(s-)|(on-)|(event-)|(-)/g, '');
	name = name.toLowerCase();

	var methodPath = value[0];
	var methodParameters = value;
	var method = Utility.getByPath(model, methodPath);

	// if (!method) return null;

	methodParameters.splice(0, 1);

	// convert parameters
	methodParameters.forEach(function (parameter, index) {
		if (/^[0-9]*$/.test(parameter)) {
			methodParameters[index] = parseInt(parameter);
		} else if (!/(')|(")|(`)/.test(parameter)) {
			methodParameters[index] = Utility.getByPath(model, parameter);
		}
	});

	var methodBound = method.bind.apply(method, [element].concat(methodParameters));

	element.addEventListener(name, methodBound);
};

Render.prototype.eFor = function (model, view, name, value, element) {
	var self = this;

	var variable = name.split('-').pop();
	var iterable = value;

	var iterableArray = Utility.getByPath(model, iterable);
	var fragment = self.doc.createDocumentFragment();

	// clone child elements
	iterableArray.forEach(function () {
		Utility.each(element.children, function (child) {
			fragment.appendChild(child.cloneNode(true));
		});
	});

	var elements = fragment.querySelectorAll('*');
	// var namePattern = /(^s-.*)|(^data-s-.*)/;
	// var valuePattern = /.*/;
	var index = 0;

	// change eFor child variable names
	Utility.each(elements, function (element) {
		Utility.each(element.attributes, function (attribute) {
			if (attribute.value === variable) {
				attribute.value = iterable + '.'+ index;
				index++;
			}
		});
	});

	// TODO impoment better loop
	// self._elements (model, view, name, value, elements, namePattern, valuePattern);

	// element = removeChildren(element);
	element.appendChild(fragment);
};

Render.prototype.eCss = function (model, view, name, value, element) {
	var self = this;

	var styles = value.replace(/\s/g, '').split(';');
	var cssText = null;
	var viewValue = null;
	var modelValue = null;
	var viewValueClean = null;

	styles.forEach(function (style) {
		viewValue = style.split(':').pop();

		if (/^\$/.test(viewValue)) {
			viewValueClean = viewValue.replace('$', '');
			modelValue = Utility.getByPath(model, viewValueClean);

			if (modelValue) {
				style = style.replace(viewValue, modelValue);
				cssText = Utility.getByPath(element, 'style.cssText');
				Utility.setByPath(element, 'style.cssText', cssText + style);
			}
		}
	});
};

Render.prototype.eIf = function (model, view, name, value, element) {
	var self = this;

	value = Utility.getByPath(model, value);
	if (value) element.classList.remove('s-if-false');
	else element.classList.add('s-if-false');
};

Render.prototype.eStyle = function (model, view, name, value, element) {
	var self = this;

	name = name.replace(/(s-style-)|(data-s-style-)/, 'style.');
	name = Utility.toCamelCase(name);
	self.eDefault(model, view, name, value, element);
};

Render.prototype.eHtml = function (model, view, name, value, element) {
	var self = this;

	name = 'innerHTML';

	// TODO handle all external resources
	if (/^\//.test(value)) {
		Axa.request({
			action: '/partial/index.html',
			success: function (xhr) {
				console.log(xhr);
			},
			error: function (xhr) {
				console.log(xhr);
			}
		});
	} else {
		self.eDefault(model, view, name, value, element);
	}
};

Render.prototype.eText = function (model, view, name, value, element) {
	var self = this;
	name = 'innerText';
	self.eDefault(model, view, name, value, element);
};

// function valueElement (model, view, name, value, element) {
// 	var self = this;
// 	value = getByPath(model, value);
// 	setByPath(element, name, value);
// }

Render.prototype.eDefault = function (model, view, name, value, element) {
	var self = this;
	// value = getByPath(model, value) || value;
	value = Utility.getByPath(model, value);
	Utility.setByPath(element, name, value);
};

Render.prototype._switch = function (model, view, name, value, element) {
	var self = this;

	if (ON.test(name)) {
		self.eOn(model, view, name, value, element);
	} else if (IF.test(name)) {
		self.eIf(model, view, name, value, element);
	} else if (FOR.test(name)) {
		self.eFor(model, view, name, value, element);
	} else if (CSS.test(name)) {
		self.eCss(model, view, name, value, element);
	} else if (HTML.test(name)) {
		self.eHtml(model, view, name, value, element);
	} else if (TEXT.test(name)) {
		self.eText(model, view, name, value, element);
	} else if (STYLE.test(name)) {
		self.eStyle(model, view, name, value, element);
	} else {
		self.eDefault(model, view, name, value, element);
	}
};

// Render.prototype._elements = function (model, view, name, value, elements, namePattern, valuePattern) {
// 	var self = this;
//
// 	each(elements, function (element) {
// 		each(element.attributes, function (attribute) {
// 			if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
// 				self._switch(model, view, attribute.name, attribute.value, element);
// 			}
// 		});
// 	});
// };

Render.prototype.elements = function (model, view, name, value) {
	var self = this;

	var dollarPattern = '(\\$' + value + ')';
	var regularPattern = '(' + name + '=\"' + value + '\")';
	var elements = view.findByAttribute(regularPattern + '|' + dollarPattern);

	var namePattern = new RegExp(name);
	var valuePattern = new RegExp(value);

	Utility.each(elements, function (element) {
		Utility.each(element.attributes, function (attribute) {
			if (attribute && (namePattern.test(attribute.name) && valuePattern.test(attribute.value))) {
				self._switch(model, view, attribute.name, attribute.value, element);
			}
		});
	});
};
