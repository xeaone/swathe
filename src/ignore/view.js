/*
	ids: Component Binder Data Base
		{Binder Value} > {ID} > [Binder Names]

	components: Component Identification Data Base
		{Identification} > {Component}
*/

import Utility from './utility.js';

export default function View () {
	this.ids = {};
	this.components = {};
	this.accepts = /(s-(.*?)=)/;
	this.rejects = /(s-controller=)|(iframe)|(object)|(script)/;
}

View.prototype.setComponent= function (id, component) {
	this.components[id] = component;
};

View.prototype.getComponent = function (id) {
	return this.components[id];
};

View.prototype.setId = function (id, value) {
	if (!this.ids[value]) this.ids[value] = [id];
	else this.ids[value].push(id);
};

View.prototype.getIds = function (value) {
	return this.ids[value];
};

View.prototype.setIds = function (id, element) {
	for (var i = 0, l = element.attributes.length, attribute; i < l; i++) {
		attribute = element.attributes[i];

		if (Utility.prefix.test(attribute.name)) {
			if (!this.ids[attribute.value]) this.ids[attribute.value] = [];
			this.ids[attribute.value].push(id);
			if (attribute.name === 's-css') console.log(attribute);
		}
	}
};

View.prototype.updateComponents = function (binderValue, modelValue) {
	var ids = this.getIds(binderValue), component, id;

	for (var i = 0, l = ids.length; i < l; i++) {
		id = ids[i];
		component = this.getComponent(id);
		component.renderByBinderValue(binderValue, modelValue);
	}
};

View.prototype.addComponents = function (element, callback) {
	var self = this, component, id;
	var elements = element.getElementsByTagName('*');

	Utility.eachElement(elements, self.rejects, null, self.accepts, function (element, index) {
		id = Utility.uid();
		element.id = id;

		component = callback(element);
		component.renderAll();
		self.setIds(id, element);
		self.setComponent(id, component);

		if (/s-for-(.*?)=/.test(Utility.glance(element))) return index++;

	});
};
