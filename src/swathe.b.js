/*
	title: swathe
	version: 1.2.0
	author: alexander elias
*/

import { sStyle } from './ignore/style.js';
import Utility from './ignore/utility.js';
import View from './ignore/view.js';
import Render from './ignore/render.js';
import Observe from './ignore/observe.js';

var ALL = '.*?';
var S = '(s-)|(data-s-)';
var VALUE = /(s-value)|(data-s-value)/;

function Controller (data) {
	var self = this;

	self.doc = data.doc;
	self.name = data.name;
	self.model = data.model;
	self.created = data.created;

	console.log(self.doc);
	console.log(self.name);

	self.scope = self.doc.querySelector('[s-controller=' + self.name + ']') || self.doc.querySelector('[data-s-controller=' + self.name + ']');
	self.scope.classList.toggle('s-opacity');

	self.view = new View({
		scope: self.scope
	});

	self.render = new Render({
		model: self.model,
		view: self.view
	});

	self.observe = new Observe({
		model: self.model,
		view: self.view,
		render: self.render
	});

	self.render.elements(self.model, self.view, S, ALL);

	self.inputs = self.view.findByAttribute(VALUE);

	self.model = self.observe.object(self.model, function (value) {
		self.render.elements(self.model, self.view, ALL, value);
	});

	self.inputs = self.observe.elements(self.inputs, function (name, value, newValue) {
		Utility.setByPath(self.model, value, newValue);
	});

	self.doc.addEventListener('DOMContentLoaded', function () {
		self.scope.classList.toggle('s-opacity');
	});

	if (self.created) self.created(self);
}

document.head.appendChild(
	document.createElement('style').appendChild(
		document.createTextNode(sStyle)
	)
);

var Swathe = {
	controllers: {},
	controller: function (options) {
		if (!options.name) throw new Error('Controller - name parameter required');
		if (!options.model) throw new Error('Controller - model parameter required');
		if (this.controllers[options.name]) throw new Error('Controller - name ' + options.name + ' exists');
		options.doc = options.doc || document;
		this.controllers[options.name] = new Controller(options);
		return this.controllers[options.name];
	}
};

export default Swathe;
