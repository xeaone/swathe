// http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url

function isPushStateAvailable() {
	return !!(
		typeof window !== 'undefined' &&
		window.history &&
		window.history.pushState
	);
}

function isHashChangeAvailable() {
	return !!(
		typeof window !== 'undefined' &&
		'onhashchange' in window
	);
}

function clearSlashes (path) {
	path = path.toString();
	path = path.replace(/\/$/, '');
	path = path.replace(/^\//, '');
	return path;
}

window.Server = {
	_routes: [],
	mode: null,
	root: '/',
	useHash: false,
	isPushStateAvailable: isPushStateAvailable(),
	isHashChangeAvailable: isHashChangeAvailable(),
	usePushState: !this.useHash && this.isPushStateAvailable,

	config: function(options) {
		var self = this;

		if (options) {
			if (options.root) self.root = options.root;
			if (options.useHash) self.useHash = options.useHash;
		}

		self.mode = self.usePushState ? 'history' : 'hash';
	},

	getFragment: function() {
		var self = this;
		var fragment = '';

		if (self.useHash) {
			var match = window.location.href.match(/#(.*)$/);
			fragment = match ? match[1] : '';
		} else {
			fragment = clearSlashes(decodeURI(location.pathname + location.search));
			fragment = fragment.replace(/\?(.*)$/, '');
			fragment = self.root != '/' ? fragment.replace(self.root, '') : fragment;
		}

		return clearSlashes(fragment);
	},

	routes: function (routes) {
		var self = this;
		self._routes = self._routes.concat(routes);
	},

	add: function (route) {
		var self = this;
		self._routes.push(route);
	},

	remove: function(path) {
		var self = this;
		var i = 0;
		var route = null;
		var l = self._routes.length;

		for (i; i < l; i++) {
			route = self._routes[i];
			if (route.path === path) self._routes.splice(i, 1);
		}
	},

	flush: function() {
		var self = this;
		self._routes = [];
		self.mode = null;
		self.root = '/';
	},

	check: function(f) {
		var self = this;
		var fragment = f || self.getFragment();

		for (var i = 0, l = self._routes.length; i < l; i++) {
			var match = fragment.match(self._routes[i].re);
			if (match) {
				match.shift();
				self._routes[i].handler.apply({}, match);
			}
		}
	},

	listen: function() {
		var self = this;

		if (this.usePushState) {
			window.onpopstate = function () {
				self.resolve();
			};
		} else if (this.isHashChangeAvailable) {
			window.onhashchange = function () {
				self.resolve();
			};
		} else {
			var current = self.getFragment();
			var fn = function () {
				if (current !== self.getFragment()) {
					current = self.getFragment();
					self.check(current);
				}
			};
			clearInterval(self.interval);
			self.interval = setInterval(fn, 200);
			// 	var cached = self._cLoc(), current, check;
			//
			// 	check = function () {
			// 		current = self._cLoc();
			//
			// 		if (cached !== current) {
			// 			cached = current;
			// 			self.resolve();
			// 		}
			//
			// 		self._listenningInterval = setTimeout(check, 200);
			// 	};
			//
			// 	check();
		}
	},

	// _cLoc: function () {
	// 	if (typeof window !== 'undefined') {
	// 		return clean(window.location.href);
	// 	}
	// 	return '';
	// },

	navigate: function(path) {
		path = path ? path : '';

		if (this.useHash) {
			window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
		} else {
			history.pushState(null, null, this.root + clearSlashes(path));
		}
	}
};
