/*
	title: swathe
	version: 1.2.0
	license: mpl-2.0
	author: alexander elias
*/

import { eStyle } from './ignore/style.js';
import Component from './ignore/component.js';
import Model from './ignore/model.js';
import View from './ignore/view.js';

function Controller (data, callback) {
	var self = this;

	self.doc = data.doc;
	self.name = data.name;
	self.query = '[s-controller="' + self.name + '"], [data-s-controller="' + self.name + '"]';

	self.model = data.model;
	self.scope = self.doc.querySelector(self.query);

	self.Model = new Model({
		collection: self.model
	});

	self.View = new View();

	self.Model.toView(function (path, value) {
		if (!isNaN(path.split('.').slice(-1))) {
			path = path.split('.').slice(0, -1).join('.');
		}

		self.View.updateComponents(path, value);
	});

	self.View.addComponents(self.scope, function (element) {
		return new Component(element, self.Model, self.View);
	});

	self.scope.addEventListener('keyup', function (e) {
		var component = self.View.getComponent(e.target.id);
		var value = component.element.getAttribute('s-value') || component.element.getAttribute('data-s-value');
		if (value) self.Model.set(value, component.element.value);
	}, false);

	// self.scope.addEventListener('submit', function (e) {
	// 	if (self.View.get(e.target.id)) {
	// 		var value = e.target.getAttribute('s-value') || e.target.getAttribute('data-s-value');
	// 		self.Model.set(value, e.target.value);
	// 	}
	// 	e.preventDefault();
	// }, false);

	self.model = self.Model.collection;

	if (callback) return callback.call(this);
}

window.addEventListener('DOMContentLoaded', function () {
	document.head.appendChild(eStyle);
	// for (var name in window.Swathe.controllers) {
	// 	if (window.Swathe.controllers.hasOwnProperty(name)) {
	// 		window.Swathe.controllers[name].view.classList.toggle('s-show-true');
	// 	}
	// }
});

export default {
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
