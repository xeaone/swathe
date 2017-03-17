/*
	@preserve
	title: swathe
	version: 2.0.1
	license: mpl-2.0
	author: alexander elias
*/

import Component from './component.i.js';
import Utility from './utility.i.js';
import Obsr from 'obsr';

function Controller (data, callback) {
	this.callback = callback;
	this.doc = data.doc;
	this.name = data.name;
	this.view = data.view || {};
	this.model = data.model || {};
	this.modifiers = data.modifiers || {};

	this.sPrefix = data.prefix + '-';
	this.sValue = data.prefix + '-value';
	this.sFor = data.prefix + '-for-(.*?)="';
	this.sAccepts = data.prefix + '-' + '(.*?)="';
	this.sRejects = data.prefix + '-controller=|' + data.rejects;
	this.query = '[' + data.prefix + '-controller=' + data.name + ']';

	this.rPath = /(\s)?\|(.*?)$/;
	this.rModifier = /^(.*?)\|(\s)?/;

	this.rFor = new RegExp(this.sFor);
	this.rPrefix = new RegExp(this.sPrefix);
	this.rAccepts = new RegExp(this.sAccepts);
	this.rRejects = new RegExp(this.sRejects);

	this.scope = data.doc.querySelector(this.query);
	if (!this.scope) throw new Error('missing attribute s-controller ' + data.name);
}

Controller.prototype.insert = function (elements) {
	var self = this;

	Utility.eachElement(elements, self.rRejects, null, self.rAccepts, function (element, index) {
		var component = new Component(element, self);

		component.eachAttribute(self.rAccepts, function (attribute) {
			if (self.rFor.test(attribute.name)) index = index + 1;
			if (self.view[attribute.value]) self.view[attribute.value].push(component);
			else self.view[attribute.value] = [component];
			component.render(attribute);
		});
	});
};

Controller.prototype.setup = function () {
	var self = this;

	self.model = Obsr(self.model, function (path) {
		var paths = path.split('.');
		if (paths.length > 1 && !isNaN(paths.slice(-1))) {
			path = paths.slice(0, -1).join('.');
		}

		var components = self.view[path];
		if (components) {
			for (var i = 0, l = components.length, component; i < l; i++) {
				component = components[i];

				component.eachAttribute(self.sAccepts + path, function (attribute) {
					component.render(attribute);
				});
			}
		}
	});

	self.insert(self.scope.getElementsByTagName('*'));
	if (self.callback) self.callback.call(this);
};

export default {
	prefix: 's',
	doc: document,
	controllers: {},
	rejects: 'iframe|object|script',
	controller: function (data, callback) {
		if (!data.name) throw new Error('Controller - name parameter required');
		if (data.name in this.controllers) throw new Error('Controller - name ' + data.name + ' exists');

		data.doc = data.doc || this.doc;
		data.prefix = data.prefix || this.prefix;
		data.rejects = data.rejects || this.rejects;

		var controller = new Controller(data, callback);
		controller.setup();
		this.controllers[data.name] = controller;
		return controller;
	}
};
