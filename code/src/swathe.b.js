import { sStyle } from './ignore/style.js';
import { View } from './ignore/view.js';
import { setByPath } from './ignore/utilities.js';
import { Render } from './ignore/render.js';
import { observeObjectsProxy, observeObjectsDefine, observeElements } from './ignore/observe.js';

var PATTERN = {
	ALL: '.*',
	S: '(s-.*)|(data-s-.*)',
	VALUE: '(s-value.*)|(data-s-value.*)',
	TAGS: ['iframe', 'script', 'style', 'link', 'object'],
	ATTRIBUTES: ['(s-controller.*)|(data-s-controller.*)']
};

var Controller = function (name, model, callback) {
	var observeObjects = window.Proxy ? observeObjectsProxy : observeObjectsDefine;
	var self = this;

	var options = {
		scope: document.querySelector('[s-controller=' + name + ']') || document.querySelector('[data-s-controller=' + name + ']'),
		rejected: {
			tags: PATTERN.TAGS,
			attributes: PATTERN.ATTRIBUTES
		}
	};

	self.name = name;
	self.model = model;
	self.view = new View(options);
	self.inputs = self.view.findByAttribute(PATTERN.VALUE);

	self.model = observeObjects (self.model, function (value) {
		Render(self.model, self.view, PATTERN.ALL, value);
	});

	self.inputs = observeElements (self.inputs, function (name, value, newValue) {
		setByPath(self.model, value, newValue);
	});

	Render(self.model, self.view, PATTERN.S, PATTERN.ALL);

	document.addEventListener('DOMContentLoaded', function () {
		options.scope.style.opacity = '1';
	});

	if (callback) callback(self);
};

if (!window.Swathe)  {

	var eStyle = document.createElement('style');
	var nStyle = document.createTextNode(sStyle);
	eStyle.title = 'swathe';
	eStyle.appendChild(nStyle);
	document.head.appendChild(eStyle);

	window.Swathe = {
		controllers: {},
		controller: function (name, model, callback) {
			if (!name) throw new Error('Controller - name parameter required');
			if (!model) throw new Error('Controller - model parameter required');
			this.controllers[name] = new Controller(name, model, callback);
			return this.controllers[name];
		}
	};

}
