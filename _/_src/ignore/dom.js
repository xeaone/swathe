
export default function Dom (data) {
	this.collection = {};
	this.scope = data.scope;
	// this.skips = data.skips;
	this.accepts = /(s-(.*?)=)/i;
	this.rejects = /(s-controller=)|(^iframe)|(^object)|(^script)/i;
}

Dom.prototype.uid = function () {
	return Math.random().toString(36).substr(2, 9);
};

Dom.prototype.stringify = function (element) {
	return element.outerHTML.replace(/>(.*?)$/, '').replace('<', '');
};

Dom.prototype.each = function (callback) {
	for (var id in this.collection) {
		callback(this.collection[id]);
	}
};

Dom.prototype.add = function (scope, rejects, accepts) {
	accepts = accepts || this.accepts;
	rejects = rejects || this.rejects;
	scope = scope || this.scope;

	var elements = scope.getElementsByTagName('*');
	var i = 0, l = elements.length, element, stringified, id;

	for (i; i < l; i++) {
		element = elements[i];
		stringified = this.stringify(element);

		if (rejects.test(stringified)) {
			i += element.children.length;
		} else if (accepts.test(stringified)) {
			id = this.uid();
			element.id = id;
			this.collection[id] = { id: id, stringified: stringified, element: element };
		}
	}
};

Dom.prototype.set = function (element) {
	this.collection[element.id] = element;
};

Dom.prototype.get = function (id) {
	return this.collection[id];
};

Dom.prototype.del = function (id) {
	delete this.collection[id];
};

Dom.prototype.setup = function () {
	this.add();
};
