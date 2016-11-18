function serialize (data) {
	var string = '';

	for (var name in data) {
		string = string.length > 0 ? string + '&' : string;
		string = string + encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
	}

	return string;
}

export function ajax (options) {
	if (!options) throw new Error('ajax: requires options');

	if (!options.action) options.action = window.location.pathname;
	if (!options.enctype) options.enctype = 'text/plain';
	if (!options.method) options.method = 'GET';

	options.method = options.method.toUpperCase();

	if (options.data) {
		if (options.method === 'GET') {
			options.action = options.action + '?' + serialize(options.data);
			options.data = null;
		} else {
			if (options.enctype.search('application/x-www-form-urlencoded') !== -1) options.data = serialize(options.data);
			else if (options.enctype.search('application/json') !== -1) options.data = JSON.stringify(options.data);
		}
	}

	var xhr = new XMLHttpRequest();
	xhr.open(options.method, options.action, true, options.username, options.password);

	if (options.mimeType) xhr.overrideMimeType(options.mimeType);
	if (options.withCredentials) xhr.withCredentials = options.withCredentials;

	if (options.headers) {
		for (var name in options.headers) {
			xhr.setRequestHeader(name, options.headers[name]);
		}
	}

	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status >= 200 && xhr.status < 300) {
				if (options.success) return options.success(xhr);
			} else {
				if (options.error) return options.error(xhr);
			}
		}
	};

	xhr.send(options.data);
}
