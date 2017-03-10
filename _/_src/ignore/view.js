import Utility from './utility.js';
import Axa from 'axa';

export default function ViewInterface (data) {
	this.view = data.view;

	this.listeners = {};
	this.inners = {};
	this.elements = {};

	this.PREFIX = /(data-)?s-/;
	// this.BINDER_CMD = /(^data-s-)|(^s-)|((-|\.)(.*?)$)/g;
	this.BINDER_CMD = /s-\w+/;
	this.BINDER_OPT = /((^data-s-)|(^s-))(\w+(\.|-)?)/;
	this.ADAPTER_CMD = /\((.*?)$/;
	this.ADAPTER_OPT = /(^(.*?)\()|(\)(.*?)$)/g;

	this.NUMBER = /^\d{1,}$/;
	this.STRING = /(^')|(^")|(^`)/;
	this.BOOLEAN = /(^true$)|(^false$)/;

	this.ALL = /(s-(.*?)=)/;
	this.REJECTS = /(<iframe)|(<script)|(<style)|(<link)|(<object)|(s-controller=)/;

	this.AT_SKIPS = /(s-value=)/;
}

ViewInterface.prototype.on = function (data) {
	var self = this;
	var eventName = data.cmds[1];
	var methodName = data.opts[data.opts.length-1];

	if (typeof data.value !== 'function') return;

	data.element.removeEventListener(eventName, self.listeners[methodName], false);

	self.listeners[methodName] = function (e) {
		e.preventDefault();
		data.value.call(self.ModelInterface.model, e);
	};

	data.element.addEventListener(eventName, self.listeners[methodName], false);
};

ViewInterface.prototype.for = function (data) {
	var self = this, originalInnerHtml;
	var variableName = Utility.toCamelCase(data.cmds.slice(1));

	if (!data.element.swathe) {
		originalInnerHtml = data.element.innerHTML;
		data.element.swathe = {};
		data.element.swathe.originalInnerHTML = originalInnerHtml;
	} else {
		originalInnerHtml = data.element.swathe.originalInnerHTML;
	}

	// self.inners[]

	var variable = new RegExp('="'+ variableName +'"', 'g');
	var newInnerHtml = '';

	if (data.value === null || data.value === undefined) {
		throw 's-for-[variable name] requires an iterable';
	} else {
		for (var i = 0, l = data.value.length; i < l; i++) {
			newInnerHtml += originalInnerHtml.replace(variable, '=\"' + data.attribute.value + '[' + i + ']\"');
		}
	}

	data.element.innerHTML = newInnerHtml;
	self.update(data.element);
};

ViewInterface.prototype.html = function (data) {
	var self = this;

	if (/^</.test(data.value)) {
		data.element.innerHTML = data.value;
		self.update(data.element);
	} else {
		Axa.request({
			action: data.value,
			success: function (xhr) {
				data.element.innerHTML = xhr.response;
				self.update(data.element);
			},
			error: function (xhr) {
				throw xhr;
			}
		});
	}
};

ViewInterface.prototype.css = function (data) {
	var cssText = data.element.style.cssText;

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

	data.element.style.cssText = cssText;
};

ViewInterface.prototype.class = function (data) {
	var className = data.cmds.slice(1).join('-');
	data.value = Utility.ensureBoolean(data.value);
	data.element.classList.toggle(className, data.value);
};

ViewInterface.prototype.enable = function (data) {
	data.element.disabled = !Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.disable = function (data) {
	data.element.disabled = Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.show = function (data) {
	data.element.hidden = !Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.hide = function (data) {
	data.element.hidden = Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.check = function (data) {
	data.element.checked = Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.uncheck = function (data) {
	data.element.checked = !Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.text = function (data) {
	data.element.innerText = Utility.ensureString(data.value);
};

ViewInterface.prototype.default = function (data) {
	var path = Utility.toCamelCase(data.cmds);
	Utility.setByPath(data.element, path, data.value);
};

ViewInterface.prototype.switch = function (data) {
	var self = this;

	data.opts = data.attribute.value.split('.');
	data.cmds = data.attribute.name.replace(self.PREFIX, '').split('-');

	data.value = self.ModelInterface.get(data.attribute.value);
	data.value = data.value === null || data.value === undefined ? data.attribute.value : data.value;

	if (data.cmds[0] in self) {
		self[data.cmds[0]](data);
	} else {
		self.default(data);
	}
};

ViewInterface.prototype.update = function (view, pattern) {
	var self = this;

	view = view || self.view;
	pattern = pattern || self.ALL;

	Utility.forEachElement(view, self.REJECTS, null, pattern, function (element) {
		Utility.forEachAttribute(element, null, self.AT_SKIPS, pattern, function (attribute) {
			self.switch({ element: element, attribute: attribute });
		});
	});
};

ViewInterface.prototype.setup = function (ModelInterface) {
	var self = this, attributeValue;

	self.ModelInterface = ModelInterface;

	self.update();

	self.view.addEventListener('keyup', function (e) {
		console.log(e);
		attributeValue = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');

		if (attributeValue !== null && attributeValue !== undefined) {
			self.ModelInterface.set(attributeValue, e.target.value);
		}
	}, false);

	// self.view.addEventListener('submit', function (e) {
	// 	console.log(e);
	// 	e.preventDefault();
	// }, false);
};
