import Utility from './utility.js';
import Axa from 'axa';

export default function ViewInterface (data) {
	this.view = data.view;

	this.PREFIX = /(^(data-)?s-)/;
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

ViewInterface.prototype.sOn = function (data) {
	var self = this;

	if (typeof data.value !== 'function') return;

	if (!data.element.swathe) {
		data.element.swathe = {};
	} else {
		data.element.removeEventListener(data.binder.opt, data.element.swathe.originalEventListener);
	}

	data.element.swathe.originalEventListener = function (e) {
		var parameters = data.adapter.opt.split(', ').map(function (parameter) { // TODO fix split on all commas /,(\s)?/
			if (self.STRING.test(parameter)) {
				return parameter.replace(/(')|(")|(`)/g, '');
			} else if (self.NUMBER.test(parameter)) {
				return Number(parameter);
			} else if (self.BOOLEAN.test(parameter)) {
				return parameter === 'true';
			} else {
				return self.ModelInterface.get(parameter);
			}
		});

		parameters.push(e);
		data.value.apply(self.ModelInterface.model, parameters);
	};

	data.element.addEventListener(data.binder.opt, data.element.swathe.originalEventListener);
};

ViewInterface.prototype.sFor = function (data) {
	var self = this, originalInnerHtml;

	if (!data.element.swathe) {
		originalInnerHtml = data.element.innerHTML;
		data.element.swathe = {};
		data.element.swathe.originalInnerHTML = originalInnerHtml;
	} else {
		originalInnerHtml = data.element.swathe.originalInnerHTML;
	}

	var variable = new RegExp('="'+ data.binder.opt +'"', 'g');
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

ViewInterface.prototype.sHtml = function (data) {
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

ViewInterface.prototype.sIf = function (data) {
	data.element.hidden = !Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.sEnable = function (data) {
	data.element.disabled = !Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.sDisable = function (data) {
	data.element.disabled = Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.sShow = function (data) {
	data.element.hidden = !Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.sHide = function (data) {
	data.element.hidden = Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.sCheck = function (data) {
	data.element.checked = Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.sUncheck = function (data) {
	data.element.checked = !Utility.ensureBoolean(data.value);
};

ViewInterface.prototype.sClass = function (data) {
	data.value = Utility.ensureBoolean(data.value);
	data.element.classList.toggle(data.binder.opt, data.value);
};

ViewInterface.prototype.sText = function (data) {
	data.element.innerText = Utility.ensureString(data.value);
};

ViewInterface.prototype.sCss = function (data) {
	if (typeof data.value === 'string') {
		data.element.style.cssText = data.value;
	} else {
		for (var key in data.value) {
			if (data.value.hasOwnProperty(key)) {
				key = Utility.toDashCase(key);
				data.element.style.cssText += key + ':' + data.value[key] + ';';
			}
		}
	}
};

// ViewInterface.prototype._style = function (data) {
// 	if (typeof data.value === 'string') {
// 		data.element.style[Utility.toCamelCase(data.binder.opt)] = data.value;
// 	} else {
// 		for (var key in data.value) {
// 			if (data.value.hasOwnProperty(key)) {
// 				key = Utility.toDashCase(key);
// 				data.element.style.cssText += key + ':' + data.value[key] + ';';
// 			}
// 		}
// 	}
// };

ViewInterface.prototype.sValue = function (data) {
	if (data.element.value !== data.value) data.element.value = data.value;
};

// ViewInterface.prototype.sSubmit = function (data) {
// 	console.log(data);
// };

ViewInterface.prototype.sDefault = function (data) {
	data.attribute.name = data.attribute.name.replace(this.PREFIX, '');
	data.attribute.name = Utility.toCamelCase(data.attribute.name);
	Utility.setByPath(data.element, data.attribute.name, data.value);
};

ViewInterface.prototype.switch = function (data) {
	var self = this;

	data.binder = {
		cmd: Utility.toCamelCase(data.attribute.name.match(self.BINDER_CMD)[0]),
		opt: data.attribute.name.replace(self.BINDER_OPT, '')
	};

	data.adapter = {
		cmd: data.attribute.value.replace(self.ADAPTER_CMD, ''),
		opt: data.attribute.value.replace(self.ADAPTER_OPT, '')
	};

	data.value = self.ModelInterface.get(data.adapter.cmd);
	data.value = data.value === null || data.value === undefined ? data.attribute.value : data.value;

	if (data.binder.cmd in self) {
		self[data.binder.cmd](data);
	} else {
		self.sDefault(data);
	}
};

ViewInterface.prototype.update = function (view, pattern) {
	var self = this;

	view = view || self.view;
	pattern = pattern || self.ALL;

	Utility.forEachElement(view, self.REJECTS, null, pattern, function (element) {
		Utility.forEachAttribute(element, null, self.AT_SKIPS, self.ALL, function (attribute) {
			self.switch({ element: element, attribute: attribute });
		});
	});
};

ViewInterface.prototype.setup = function (ModelInterface) {
	var self = this, attributeValue;

	self.ModelInterface = ModelInterface;

	self.update();

	self.view.addEventListener('keyup', function (e) { //'change'
		attributeValue = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
		if (attributeValue) self.ModelInterface.set(attributeValue, e.target.value);
		e.preventDefault();
	}, false);

	// self.view.addEventListener('submit', function (e) {
	// 	console.log(e);
	// 	e.preventDefault();
	// }, false);
};
