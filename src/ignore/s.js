import { is, each } from './utilities.js';

var Query = {
	forElements: '[data-s^="for:"]',
	sElements: '[data-s]:not(input):not(select):not(textarea):not([data-s^="for:"])',
	inputElements: 'input[data-s^="value:"], select[data-s^="value:"], textarea[data-s^="value:"]'
};

function GetSElements (scope) {
	var sElements = {};

	each(scope.querySelectorAll('[data-s]'), function (elements) {
		if (!sElements[elements.swathe.parameterLast]) sElements[elements.swathe.parameterLast] = [];
		sElements[elements.swathe.parameterLast].push(elements);
	});

	return sElements;
}

function GetSInputElements (scope) {
	return scope.querySelectorAll(Query.inputElements);
}

function ObserveSObjects (object, callback, prefix) {
	if (!prefix) prefix = '';

	var handler = {
		get: function (target, property) {
			if (is('Object', target[property]) || is('Array', target[property])) {
				return ObserveSObjects(target[property], callback, prefix + property + '.');
			} else {
				return target[property];
			}
		},
		set: function (target, property, value) {
			if (target[property] !== value) { // send change if value is different
				target[property] = value;
				callback(prefix + property, value, target);
			}

			return true;
		}
	};

	return new Proxy(object, handler);
}

function ObserveSElements (elements, callback) {

	var handler = function (e) { // event input works on: input, select, textarea
		var target = e.target;
		var value = target.value;

		var sName = null;
		var sValue = null;

		if (target.hasAttribute('s-value')) sName = 's-value';
		else if (target.hasAttribute('data-s-value')) sName = 'data-s-value';

		sValue = target.getAttribute(sName);

		callback(sName, sValue, value, target);
	};

	each(elements, function (element) {
		element.addEventListener('input', handler);
	});

	return elements;
}

// function ObserveSElements (elements, callback) {
//
// 	var handler = function (e) { // event input works on: input, select, textarea
// 		var target = e.target;
// 		var value = target.value;
// 		var attribute = target.getAttribute('data-s');
//
// 		var sValue = attribute.split(':')[1].trim();
//
// 		callback(sValue, value, target);
// 	};
//
// 	each(elements, function (element) {
// 		element.addEventListener('input', handler, false);
// 	});
//
// 	return elements;
// }

export { GetSElements, GetSInputElements, ObserveSObjects, ObserveSElements };
