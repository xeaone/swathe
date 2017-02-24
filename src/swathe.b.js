/*
	title: swathe
	version: 1.2.0
	author: alexander elias
*/

// import Utility from './ignore/utility.js';

import { eStyle } from './ignore/style.js';
import ViewInterface from './ignore/view.js';
import ModelInterface from './ignore/model.js';

// HTMLElement.prototype.swathe = {};

function Controller (data, callback) {
	var self = this;

	self.doc = data.doc;
	self.name = data.name;
	self.query = '[s-controller="' + self.name + '"], [data-s-controller="' + self.name + '"]';

	self.model = data.model;
	self.view = self.doc.querySelector(self.query);

	self.ModelInterface = new ModelInterface({
		model: self.model
	});

	self.ViewInterface = new ViewInterface({
		view: self.view
	});

	self.ModelInterface.setup(self.ViewInterface);
	self.ViewInterface.setup(self.ModelInterface);

	self.model = self.ModelInterface.model;
	self.view = self.ViewInterface.view;

	if (callback) callback(self);

	// window.addEventListener('DOMContentLoaded', function () {
	// 	self.viewdb = {};
	// 	var elements = self.view.getElementsByTagName('*');
	// 	for (var i = 0, l = elements.length; i < l; i++) {
	// 		var id = Utility.id();
	// 		elements[i].id = id;
	// 		self.viewdb[id] = { element: elements[i] };
	// 	}
	// 	console.log(self.viewdb);
	// });
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
	// for (var name in window.Swathe.controllers) {
	// 	if (window.Swathe.controllers.hasOwnProperty(name)) {
	// 		window.Swathe.controllers[name].view.classList.toggle('s-show-true');
	// 	}
	// }
});

export default Swathe;
