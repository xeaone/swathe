/*
	title: swathe
	version: 1.2.0
	author: alexander elias
*/

import { eStyle } from './ignore/style.js';
import Utility from './ignore/utility.js';
import View from './ignore/view.js';
import Render from './ignore/render.js';
import Observe from './ignore/observe.js';

var ALL = '.*?';
var S = '(s-)|(data-s-)';
var VALUE = /(s-value)|(data-s-value)/;

function Controller (data, callback) {
	var self = this;

	self.doc = data.doc;
	self.name = data.name;
	self.model = data.model;

	self.scope = self.doc.querySelector('[s-controller=' + self.name + ']') || self.doc.querySelector('[data-s-controller=' + self.name + ']');

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

	self.model = self.observe.object(function (value) {
		self.render.elements(self.model, self.view, ALL, value);
	});

	self.inputs = self.observe.elements(self.inputs, function (name, value, newValue) {
		Utility.setByPath(self.model, value, newValue);
	});

	if (callback) callback(self);
}

var Swathe = {
	controllers: {},
	controller: function (data, callback) {
		if (!data.name) throw new Error('Controller - name parameter required');
		if (!data.model) throw new Error('Controller - model parameter required');
		if (this.controllers[data.name]) throw new Error('Controller - name ' + data.name + ' exists');
		data.doc = data.doc || document;
		this.controllers[data.name] = new Controller(data, callback);
		return this.controllers[data.name];
	}
};

window.addEventListener('DOMContentLoaded', function () {
	document.head.appendChild(eStyle);
	for (var name in window.Swathe.controllers) {
		if (window.Swathe.controllers.hasOwnProperty(name)) {
			window.Swathe.controllers[name].scope.classList.toggle('s-show-true');
		}
	}
});

export default Swathe;
