import { Dom } from './ignore/dom.js';
import { setByPath } from './ignore/utilities.js';
import { renderElements } from './ignore/render.js';
import { observeObjectsProxy, observeObjectsDefine, observeElements } from './ignore/observe.js';

var Controller = function (name, model, scope) {
	var observeObjects = window.Proxy ? observeObjectsProxy : observeObjectsDefine;
	var self = this;

	self.name = name;
	self.model = model;

	self.dom = new Dom(scope);

	self.valueElements = self.dom.findByName('value');

	self.model = observeObjects (self.model, function (sValue, mValue) {
		var sValueElements = self.dom.findByValue(sValue);
		renderElements(self.model, sValueElements, mValue);
	});

	self.view = observeElements (self.valueElements, function (sName, sValue, value) {
		setByPath(self.model, sValue, value);
	});

};

if (!window.Swathe)  {

	window.Swathe = {
		controllers: {},
		controller: function (name, model, scope) {
			if (!name) throw new Error('Controller - name parameter required');
			if (!model) throw new Error('Controller - model parameter required');

			scope = document.querySelector('[s-controller=' + name + ']') || document.querySelector('[data-s-controller=' + name + ']');

			if (!scope) throw new Error('Controller - missing or invalid "s-controller" attribute');

			this.controllers[name] = new Controller(name, model, scope);
			renderElements(this.controllers[name].model, this.controllers[name].dom.sElements);

			return this.controllers[name];
		}
	};

}
