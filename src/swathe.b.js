import { Dom } from './ignore/dom.js';
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
	self.view = new Dom(options);
	self.inputs = self.view.findByAttribute(PATTERN.VALUE);

	self.model = observeObjects (self.model, function (value) {
		Render(self.model, self.view, PATTERN.ALL, value);
	});

	// might need to have a way to add inputs
	self.observedElements = observeElements (self.inputs, function (name, value, newValue) {
		setByPath(self.model, value, newValue);
	});

	Render(self.model, self.view, PATTERN.S, PATTERN.ALL);

	if (callback) return callback(self);
};

if (!window.Swathe)  {
	window.Swathe = {};
	window.Swathe.controllers = {};
	window.Swathe.controller = function (name, model, callback) {
		if (!name) throw new Error('Controller - name parameter required');
		if (!model) throw new Error('Controller - model parameter required');

		this.controllers[name] = new Controller(name, model, callback);

		return this.controllers[name];
	};
}
