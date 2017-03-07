import Utility from './utility.js';
import Axa from 'axa';

export default function Component (element, model, view) {
	this.view = view;
	this.model = model;
	this.element = element;

	this.innerHTML;
	this.listeners = {};

	this.SKIPS = /(s-value=)/;
	this.ACCEPTS = /(s-(.*?)=)/;
	this.REJECTS = /s-controller=/;
}

Component.prototype.on = function (data) {
	var self = this;
	var eventName = data.cmds[1];
	var methodName = data.opts[data.opts.length-1];

	if (typeof data.value !== 'function') return;

	self.element.removeEventListener(eventName, self.listeners[methodName], false);

	self.listeners[methodName] = function (e) {
		e.preventDefault();
		data.value.call(self.model.collection, e);
	};

	self.element.addEventListener(eventName, self.listeners[methodName], false);
};

// TODO improve perfomace
Component.prototype.for = function (data) {
	var self = this;

	if (!self.for_child) self.for_child = self.element.children[0];

	var variable = data.cmds.slice(1);
	var child = self.for_child.cloneNode(true);
	var inner = '';

	child = child.outerHTML;
	variable = Utility.toCamelCase(variable);
	variable = new RegExp('="'+ variable +'"', 'g');


	for (var i = 0, l = data.value.length; i < l; i++) {
		inner += child.replace(variable, '="' + data.binder.value + '.' + i.toString() + '"');
	}

	self.renderInnerHTML(inner, self.element);
};

Component.prototype.html = function (data) {
	var self = this;

	if (/^</.test(data.value)) {
		self.renderInnerHTML(data.value);
	} else {
		Axa.request({
			action: data.value,
			success: function (xhr) { self.renderInnerHTML(xhr.response); },
			error: function (xhr) { throw xhr.response; }
		});
	}
};

Component.prototype.css = function (data) {
	var cssText = this.element.style.cssText;

	if (typeof data.value === 'object') {
		for (var key in data.value) {
			if (data.value.hasOwnProperty(key)) {
				key = Utility.toDashCase(key);
				cssText += key + ':' + data.value[key] + ';';
			}
		}
	} else {
		cssText += data.value;
	}

	this.element.style.cssText = cssText;
};

Component.prototype.class = function (data) {
	var className = data.cmds.slice(1).join('-');
	data.value = Utility.ensureBoolean(data.value);
	this.element.classList.toggle(className, data.value);
};

Component.prototype.enable = function (data) {
	this.element.disabled = !Utility.ensureBoolean(data.value);
};

Component.prototype.disable = function (data) {
	this.element.disabled = Utility.ensureBoolean(data.value);
};

Component.prototype.show = function (data) {
	this.element.hidden = !Utility.ensureBoolean(data.value);
};

Component.prototype.hide = function (data) {
	this.element.hidden = Utility.ensureBoolean(data.value);
};

Component.prototype.check = function (data) {
	this.element.checked = Utility.ensureBoolean(data.value);
};

Component.prototype.uncheck = function (data) {
	this.element.checked = !Utility.ensureBoolean(data.value);
};

Component.prototype.text = function (data) {
	this.element.innerText = Utility.ensureString(data.value);
};

Component.prototype.default = function (data) {
	var path = Utility.toCamelCase(data.cmds);
	Utility.setByPath(this.element, path, data.value);
};

Component.prototype.renderInnerHTML = function (inner) {
	var self = this;

	self.element.innerHTML = inner;
	self.view.addComponents(self.element, function (element) {
		return new Component(element, self.model, self.view);
	});
};

Component.prototype.render = function (binder) {
	var self = this, data = {};

	if (binder.name === 's-value') return;

	data.opts = binder.value.split('.');
	data.cmds = binder.name.replace(Utility.prefix, '').split('-');

	data.value = self.model.get(binder.value);
	data.value = data.value === null || data.value === undefined ? binder.value : data.value;
	data.binder = binder;

	if (data.cmds[0] in self) {
		self[data.cmds[0]](data);
	} else {
		self.default(data);
	}
};

Component.prototype.renderAll = function () {
	var self = this;

	Utility.eachAttribute(self.element.attributes, Utility.prefix, function (attribute) {
		self.render(attribute);
	});
};

Component.prototype.renderByBinderValue = function (binderValue, modelValue) {
	var self = this;

	Utility.eachAttribute(this.element.attributes, new RegExp(binderValue), function (attribute) {
		self.render(attribute, modelValue);
	});
};
