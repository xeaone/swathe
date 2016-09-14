function isObject (value) {
	if (value === null || value === undefined) return false;
	else return value.constructor === Object;
}

function isArray (value) {
	if (value === null || value === undefined) return false;
	else return value.constructor === Array;
}

function Observe (object, callback, prefix) {
	if (!prefix) prefix = '';

	return new Proxy(object, {
		get: function(target, property) {
			if (isObject(target[property]) || isArray(target[property])) {
				return Observe(target[property], callback, prefix + property + '.');
			}
			else {
				return target[property];
			}
		},
		set: function(target, property, value) {
			if (target[property] === value) {
				return true; // do not send change if value is not different
			} else {
				callback(value, prefix + property, target);
				target[property] = value;
				return true;
			}
		}
	});
}

function ObserveDom (scope, callback) {
	var elements = document.querySelectorAll(scope);

	var mutationObserver = new MutationObserver(function(mutations) {
		// mutations.forEach(function(mutation) {
		//   console.log(mutation.type);
		// });
		callback(mutations);
	});

	var options = { attributes: true, childList: true, characterData: true, subtree: true };

	for (var i = 0; i < elements.length; i++) {
		mutationObserver.observe(elements[i], options);
	}

	return mutationObserver;
}
