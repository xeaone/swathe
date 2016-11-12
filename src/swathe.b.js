import { Dom } from './ignore/dom.js';
import { setByPath } from './ignore/utilities.js';
import { Render } from './ignore/render.js';
import { observeObjectsProxy, observeObjectsDefine, observeElements } from './ignore/observe.js';

var PATTERN = {
	S: '(s-.*)|(data-s-.*)',
	VALUE: '(s-value)|(data-s-value)'
};

var Controller = function (name, model, dom) {
	var observeObjects = window.Proxy ? observeObjectsProxy : observeObjectsDefine;
	var self = this;

	self.dom = dom;
	self.name = name;
	self.model = model;
	self.view = self.dom.findByAttribute({ name: 's-controller', value: name });

	// TODO: find s-value elements
	// TODO: and change the query abilties from Dom to new View

	self.model = observeObjects (self.model, function (value) { // mValue
		Render(self.model, self.view, null, value);
	});

	self.observedElements = observeElements (self.inputs, function (name, value, newValue) {
		setByPath(self.model, value, newValue);
	});

	Render(self.model, self.view, PATTERN.S);
};

if (!window.Swathe)  {
	document.addEventListener('DOMContentLoaded', function () {

		window.Swathe = {};
		window.Swathe.controllers = {};
		window.Swathe.dom = new Dom(document.body);
		window.Swathe.controller = function (name, model) {
			if (!name) throw new Error('Controller - name parameter required');
			if (!model) throw new Error('Controller - model parameter required');

			this.controllers[name] = new Controller(name, model, this.dom);

			return this.controllers[name];
		};

	});
}
