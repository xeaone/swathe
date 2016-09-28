'use strict';

/*
	globals
*/

var ID = 0;
var TEXT = 3;
var ELEMENT = 1;

/*
	virtual
*/

var isSame = function (vNode) {
	var self = this;
	return self.id !== vNode.id ||
	self.name !== vNode.name ||
	self.type !== vNode.type ||
	self.value !== vNode.value;
};

var vNode = function (node) {
	var self = this;

	if (!node.nodeType) node.nodeType = 1;
	if (!node.nodeName) node.nodeName = 'div';
	if (!node.childNodes) node.childNodes = [];

	self.isSame = isSame;

	self.id = ++ID;
	self.childNodes = [];
	self.type = node.nodeType;
	self.name = node.nodeName;
	self.value = node.nodeValue;

	for (var i = 0, l = node.childNodes.length; i < l; i++) {
		self.childNodes.push(new vNode(node.childNodes[i]));
	}
};

/*
	physical
*/

var createNode = function (vNode) {
	var node = null;

	if (vNode.type === TEXT) {
		node = document.createTextNode(vNode.value);
	} else if (vNode.type === ELEMENT) {
		node = document.createElement(vNode.name);
		if (vNode.value) node.appendChild(document.createTextNode(vNode.value));
		vNode.childNodes.map(createNode).forEach(node.appendChild.bind(node));
	}

	return node;
};

var updateNode = function (node, vNodeNew, vNodeOld, index) {
	if (!index) index = 0;

	if (!vNodeOld) {

		// console.log('appendChild');
		node.parentNode.appendChild(createNode(vNodeNew));

	} else if (!vNodeNew) {

		// console.log('removeChild');
		node.parentNode.removeChild(node.parentNode.childNodes[index]);

	} else if (vNodeNew.isSame(vNodeOld)) {

		// console.log('replaceChild');
		node.parentNode.replaceChild(createNode(vNodeNew), node);

	} else {

		var nl = vNodeNew.childNodes.length;
		var ol = vNodeOld.childNodes.length;
		var l = nl >= ol ? nl : ol;

		for (var i = 0; i < l; i++) {
			updateNode(node.childNodes[i] || node, vNodeNew.childNodes[i], vNodeOld.childNodes[i], i);
		}

	}
};

/*
	dev
*/

var dom = document.querySelector('.scope');
var i = 0;

// setInterval(function () {
var vNowDom = new vNode(dom);
var vNewDom = new vNode(dom);

// append
var newNode = new vNode({ nodeValue: 'look' });
vNewDom.childNodes.push(newNode);

// change/swap/patch/mend/alter
vNewDom.childNodes[3].childNodes[0].value = i;
vNewDom.childNodes[3].name = 'strong';

// remove
vNewDom.childNodes[1].childNodes.splice(1, 1);

updateNode(dom, vNewDom, vNowDom);
i++;
// }, 500);

//
function append (vNode) {
	var self = this;

	self.childNodes.push(vNode);

	updateNode(document.querySelector('.scope'), vNewDom, vNowDom);
}




/*
var vNode = Object.defineProperties({}, {
	type: {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.data.type;
		},
		set: function (type) {
			this.data.type = type;
		}
	},
	name: {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.data.name;
		},
		set: function (name) {
			this.data.name = name;
		}
	},
	value: {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.data.value;
		},
		set: function (value) {
			this.data.value = value;
		}
	},
	childNodes: {
		enumerable: true,
		configurable: true,
		get: function () {
			return this.data.childNodes;
		},
		set: function (childNodes) {
			this.data.childNodes = childNodes;
		}
	},
	data: {
		value: {
			type: node.nodeType,
			name: node.nodeName,
			value: node.nodeValue,
			childNodes: []
		}
	}
});
*/
