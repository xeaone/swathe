import Utility from './utility.js';
import Axa from 'axa';

// this.IF = /(s-if(-?))/;
// this.FOR = /(s-for(-?))/;
// this.HTML = /(s-html(-?))/;
// this.TEXT = /(s-text(-?))/;
// this.STYLE = /(s-style(-?))/;
// this.VALUE = /(s-value(-?))/;
// this.ON = /(s-on(-?))|(s-event(-?))/;

export default function ViewInterface (data) {
	this.view = data.view;

	this.PREFIX = /(^data-s-)|(^s-)/;
	this.BINDER_CMD = /(^data-s-)|(^s-)|((-|\.)(.*?)$)/g;
	this.BINDER_OPT = /((^data-s-)|(^s-))(\w+(\.|-)?)/;
	this.ADAPTER_CMD = /\((.*?)$/;
	this.ADAPTER_OPT = /(^(.*?)\()|(\)(.*?)$)/g;

	this.NUMBER = /^\d{1,}$/;
	this.STRING = /(^')|(^")|(^`)/;
	this.BOOLEAN = /(^true$)|(^false$)/;

	this.ALL = /(s-(.*?)=)/;
	this.SKIPS = /(<input)/;
	this.REJECTS = /(<iframe)|(<script)|(<style)|(<link)|(<object)|(s-controller=)/;
}

ViewInterface.prototype._on = function (data) {
	var self = this;

	if (typeof data.value !== 'function') return;

	// TODO fix split on all commas /,(\s)?/
	var parameters = data.adapter.opt.split(', ').map(function (parameter) {
		if (self.STRING.test(parameter)) {
			return parameter.replace(/(')|(")|(`)/g, '');
		} else if (self.NUMBER.test(parameter)) {
			return Number(parameter);
		} else if (self.BOOLEAN.test(parameter)) {
			return Boolean(parameter);
		} else {
			return self.ModelInterface.get(parameter);
		}
	});

	// need for bind.apply not sure why
	parameters.splice(0, 0, null);

	if (!data.element.swathe) {
		data.element.swathe = {};
	} else {
		data.element.removeEventListener(data.binder.opt, data.element.swathe.oldEventListener);
	}

	data.value = data.value.bind.apply(data.value, parameters);
	data.element.addEventListener(data.binder.opt, data.value);
	data.element.swathe.oldEventListener = data.value;
};

ViewInterface.prototype._for = function (data) {
	var self = this, oldInnerHtml;

	if (!data.element.swathe) {
		oldInnerHtml = data.element.innerHTML;
		data.element.swathe = {};
		data.element.swathe.originalInnerHTML = oldInnerHtml;
	} else {
		oldInnerHtml = data.element.swathe.originalInnerHTML;
	}

	var variable = new RegExp('="'+ data.binder.opt +'"', 'g');
	var newInnerHtml = '';

	for (var i = 0, l = data.value.length; i < l; i++) {
		newInnerHtml += oldInnerHtml.replace(variable, '=\"' + data.attribute.value + '[' + i.toString() + ']\"');
	}

	data.element.innerHTML = newInnerHtml;
	self.update(self.ALL, data.element);
};

ViewInterface.prototype._html = function (data) {
	var self = this;

	if (/^</.test(data.value)) {
		data.element.innerHTML = data.value;
		self.update(self.ALL, data.element);
		// if (callback) callback();
	} else {
		Axa.request({
			action: data.value,
			success: function (xhr) {
				data.element.innerHTML = xhr.response;
				self.update(self.ALL, data.element);
				// if (callback) callback();
			},
			error: function (xhr) {
				throw xhr;
			}
		});
	}
};

ViewInterface.prototype._if = function (data) {
	if (typeof data.value === 'string') {
		data.value = Boolean(data.value);
	}

	data.element.hidden = !data.value;
};

ViewInterface.prototype._class = function (data) {
	if (typeof data.value === 'string') {
		data.value = new Boolean(data.value);
	}
	data.element.classList.toggle(data.binder.opt, data.value);
};

ViewInterface.prototype._text = function (data) {
	if (typeof data.value === 'object') {
		data.value = JSON.stringify(data.value);
	} else if (typeof value === 'number') {
		data.value = data.value.toString();
	}
	data.element.innerText = data.value.toString();
};

ViewInterface.prototype._style = function (data) {
	for (var key in data.value) {
		if (data.value.hasOwnProperty(key)) {
			key = Utility.toDashCase(key);
			data.element.style.cssText += key + ':' + data.value[key] + ';';
		}
	}
};

ViewInterface.prototype._value = function (data) {
	if (data.element.value !== data.value) data.element.value = data.value;
};

ViewInterface.prototype._this = function (data) {
	data.binder.opt = Utility.toCamelCase(data.binder.opt);
	Utility.setByPath(data.element, data.binder.opt, data.value);
};

ViewInterface.prototype._switch = function (data) {
	var self = this;

	data.binder = {
		cmd: data.attribute.name.replace(self.BINDER_CMD, ''),
		opt: data.attribute.name.replace(self.BINDER_OPT, '')
	};

	data.adapter = {
		cmd: data.attribute.value.replace(self.ADAPTER_CMD, ''),
		opt: data.attribute.value.replace(self.ADAPTER_OPT, '')
	};

	data.property = '_' + data.binder.cmd;
	data.value = self.ModelInterface.get(data.adapter.cmd);
	data.value = data.value === null || data.value === undefined ? data.attribute.value : data.value;

	// console.log(data);

	if (data.property in self) {
		self[data.property](data);
	} else {
		console.warn('Unreconized binder: ' + data.attribute.name);
	}
};

ViewInterface.prototype.update = function (pattern, view) {
	var self = this;

	view = view || self.view;
	pattern = pattern || self.ALL;

	Utility.forEachElement(view, self.REJECTS, self.SKIPS, self.ALL, function (element) {
		Utility.forEachAttribute(element, pattern, function (attribute) {
			// value = self.ModelInterface.get(attribute.value);
			// value = value === null || value === undefined ? attribute.value : value;
			self._switch({ element: element, attribute: attribute });
		});
	});
};

ViewInterface.prototype.setup = function (ModelInterface) {
	var self = this, value;

	self.ModelInterface = ModelInterface;

	self.update();

	self.view.addEventListener('change', function (e) {
		value = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
		if (value) self.ModelInterface.set(value, e.target.value);
	}, false);
};
