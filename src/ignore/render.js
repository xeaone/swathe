import Utility from './utility.js';
import Axa from 'axa';

var ALL = /((data)?)(-?)s-/;
var IF = /((data)?)(-?)s-if(-?)/;
var FOR = /((data)?)(-?)s-for(-?)/;
var HTML = /((data)?)(-?)s-html(-?)/;
// var VIEW = /(s-view)|(data-s-view)/;
var TEXT = /((data)?)(-?)s-text(-?)/;
var STYLE = /((data)?)(-?)s-style(-?)/;
var VALUE = /((data)?)(-?)s-value(-?)/;
var ON = /(((data)?)(-?)s-on(-?))|(((data)?)(-?)s-event(-?))/;

export default function Render (data) {
	this.doc = data.doc;
	this.view = data.view;
	this.model = data.model;
}

Render.prototype._on = function (element, attribute, path, value) {
	var self = this;

	value = value.replace(/\(/g, ', ');
	value = value.replace(/\)/g, '');
	value = value.split(', ');

	// attribute.name = attribute.name.replace(/(data-)|(s-)|(on-)|(event-)|(-)/g, '');
	path = path.toLowerCase();

	var methodPath = value[0];
	var methodParameters = value;
	var method = Utility.getByPath(self.model.model, methodPath);

	// if (!method) return null;

	methodParameters.splice(0, 1);

	// convert parameters
	methodParameters.forEach(function (parameter, index) {
		if (/^[0-9]*$/.test(parameter)) {
			methodParameters[index] = parseInt(parameter);
		} else if (!/(')|(")|(`)/.test(parameter)) {
			methodParameters[index] = Utility.getByPath(self.model.model, parameter);
		}
	});

	var methodBound = method.bind.apply(method, [node].concat(methodParameters));

	node.addEventListener(path, methodBound);
};

Render.prototype._if = function (element, attribute, path, value) {
	if (typeof value === 'string') {
		value = new Boolean(value);
	}

	element.hidden = !value;
};

Render.prototype._for = function (element, attribute, path, value) {
	var self = this;

	var variable = path.split('-').pop();
	var iterable = value;

	var iterableArray = Utility.getByPath(self.model.model, iterable);
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

	// change _for child variable names
	Utility.each(elements, function (element) {
		Utility.each(element.attributes, function (attribute) {
			if (value === variable) {
				value = iterable + '.'+ index;
				index++;
			}
		});
	});

	// TODO impoment better loop
	// self._elements (element, attribute, path, values, namePattern, valuePattern);

	// element = removeChildren(element);
	element.appendChild(fragment);
};

Render.prototype._html = function (element, attribute, path, value) {
	var self = this;

	if (/^</.test(value)) {
		element.innerHTML = value;
		self.each(element.children, ALL);
	} else {
		Axa.request({
			action: value,
			success: function (xhr) {
				element.innerHTML = xhr.response;
				self.each(element.children, ALL);
			},
			error: function (xhr) {
				throw xhr;
			}
		});
	}
};

Render.prototype._text = function (element, attribute, path, value) {
	if (typeof value === 'object') {
		value = JSON.stringify(value);
	} else if (typeof value === 'number') {
		value = value.toString();
	}
	element.innerText = value.toString();
};

Render.prototype._style = function (element, attribute, path, value) {
	if (typeof value === 'string') {
		path = Utility.toCamelCase(path).replace('.', '');
		element.style[path] = value;
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				key = Utility.toDashCase(key);
				element.style.cssText += key + ':' + value[key] + ';';
			}
		}
	}
};

Render.prototype._value = function (element, attribute, path, value) {
	if (element.value !== value) element.value = value;
};

Render.prototype._default = function (element, attribute, path, value) {
	Utility.setByPath(element, path, value);
};

Render.prototype._switch = function (element, attribute, value) {
	if (ON.test(attribute.name)) this._on(element, attribute, attribute.name.replace(ON, ''), value);
	else if (IF.test(attribute.name)) this._if(element, attribute, attribute.name.replace(IF, ''), value);
	else if (FOR.test(attribute.name)) this._for(element, attribute, attribute.name.replace(FOR, ''), value);
	else if (HTML.test(attribute.name)) this._html(element, attribute, attribute.name.replace(HTML, ''), value);
	else if (TEXT.test(attribute.name)) this._text(element, attribute, attribute.name.replace(TEXT, ''), value);
	else if (STYLE.test(attribute.name)) this._style(element, attribute, attribute.name.replace(STYLE, ''), value);
	else if (VALUE.test(attribute.name)) this._value(element, attribute, attribute.name.replace(VALUE, ''), value);
	else this._default(element, attribute, attribute.name, value);
};

Render.prototype.each = function (elements, pattern, value) {
	var self = this;

	// var isValue = value === null || value === undefined ? false : true;

	self.view.each(elements, pattern, function (element, attribute) {
		// value = isValue ? value : Utility.getByPath(self.model.model, attribute.value);
		value = Utility.getByPath(self.model.model, attribute.value);
		value = value === null || value === undefined ? attribute.value : value;
		self._switch(element, attribute, value);
	});
};

Render.prototype.update = function (name) {
	name = Utility.getPathParent(name);
	name = '(((s-)|(data-s-))(.*?)="' + name +'(.*?)")';
	this.each(this.view.elements, name);
};

Render.prototype.setup = function () {
	this.each(this.view.elements, ALL);
};
