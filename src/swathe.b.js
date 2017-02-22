/*
	title: swathe
	version: 1.2.0
	author: alexander elias
*/

import { eStyle } from './ignore/style.js';
import Utility from './ignore/utility.js';
import View from './ignore/view.js';
import Model from './ignore/model.js';
import Render from './ignore/render.js';

function Controller (data, callback) {
	var self = this;

	self.doc = data.doc;
	self.name = data.name;
	self.query = '[s-controller="' + self.name + '"], [data-s-controller="' + self.name + '"]';

	self.View = new View({
		view: self.doc.querySelector(self.query)
	});

	self.Model = new Model({
		model: data.model
	});

	self.Render = new Render({
		doc: self.doc,
		view: self.View,
		model: self.Model
	});

	self.Model.change(function (name, value) {
		self.Render.update(name, value);
	});

	self.View.change(function (key, value) {
		Utility.setByPath(self.Model.model, key, value);
	});

	self.Render.setup();

	self.view = self.View.view;
	self.model = self.Model.model;

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
			window.Swathe.controllers[name].view.classList.toggle('s-show-true');
		}
	}
});

export default Swathe;
