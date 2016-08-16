// proxy polyfill
(function(d){function k(a){return a?"object"==typeof a||"function"==typeof a:!1}if(!d.Proxy){var l=null;d.a=function(a,c){function d(){}if(!k(a)||!k(c))throw new TypeError("Cannot create proxy with a non-object as target or handler");l=function(){d=function(b){throw new TypeError("Cannot perform '"+b+"' on a proxy that has been revoked");}};var f=c;c={get:null,set:null,apply:null,construct:null};for(var g in f){if(!(g in c))throw new TypeError("Proxy polyfill does not support trap '"+g+"'");c[g]=
f[g]}"function"==typeof f&&(c.apply=f.apply.bind(f));var e=this,m=!1,n="function"==typeof a;if(c.apply||c.construct||n)e=function(){var b=this&&this.constructor===e;d(b?"construct":"apply");if(b&&c.construct)return c.construct.call(this,a,arguments);if(!b&&c.apply)return c.apply(a,this,arguments);if(n)return b?(b=Array.prototype.slice.call(arguments),b.unshift(a),new (a.bind.apply(a,b))):a.apply(this,arguments);throw new TypeError(b?"not a constructor":"not a function");},m=!0;var p=c.get?function(b){d("get");
return c.get(this,b,e)}:function(b){d("get");return this[b]},r=c.set?function(b,a){d("set");c.set(this,b,a,e)}:function(a,c){d("set");this[a]=c},q={};Object.getOwnPropertyNames(a).forEach(function(b){m&&b in e||(Object.defineProperty(e,b,{enumerable:!!Object.getOwnPropertyDescriptor(a,b).enumerable,get:p.bind(a,b),set:r.bind(a,b)}),q[b]=!0)});f=!0;Object.setPrototypeOf?Object.setPrototypeOf(e,Object.getPrototypeOf(a)):e.__proto__?e.__proto__=a.__proto__:f=!1;if(c.get||!f)for(var h in a)q[h]||Object.defineProperty(e,
h,{get:p.bind(a,h)});Object.seal(a);Object.seal(e);return e};d.a.b=function(a,c){return{proxy:new d.a(a,c),revoke:l}};d.a.revocable=d.a.b;d.Proxy=d.a}})("undefined"!==typeof module&&module.exports?global:window);

// swathe
(function() {
	'use strict';

	function SyncView (data, valueBind) {
		var dataBindElements = document.querySelectorAll('[data-bind~=\"' + valueBind + '\"]');

		dataBindElements.forEach(function (dataBindElement) {
			var keyBindElement = dataBindElement.getAttribute('data-bind').split(':')[0].trim();
			var valueBindElement = dataBindElement.getAttribute('data-bind').split(':')[1].trim();
			if (valueBind === valueBindElement) dataBindElement[keyBindElement] = data;
		});
	}

	function ObserveElements (elements, callback) {
		elements.forEach(function (element) {
			element.addEventListener('keyup', function (e) {
				var target = e.target;
				var value = target.value;
				var dataBind = target.getAttribute('data-bind');

				var keyBind = dataBind.split(':')[0].trim();
				var valueBind = dataBind.split(':')[1].trim();

				callback(keyBind, valueBind, value);
			}, false);
		});

		return elements;
	}

	function ObserveObject(object, callback, prefix) {
		if (!prefix) prefix = '';

		return new Proxy(object, {
			set: function(target, property, value) {
				if (target[property] === value) return true; // do not send change if value is not different
				target[property] = value;
				callback(prefix + property, value);
				return true;
			},
			get: function(target, property) {
				if (isObject(target[property])) return ObserveObject(target[property], callback, prefix + property + '.');
				else return target[property];
			}
		});
	}

	function Controller(scope, model) {
		var self = this;

		if (!scope) throw new Error('Controller: scope parameter required');
		if (!model) throw new Error('Controller: model parameter required');

		scope = typeof scope === 'string' ? document.querySelector(scope) : scope;

		self._scope = scope;
		self._model = model;
		self._elements = scope.querySelectorAll('[data-bind^=\"value\"]');

		self.model = ObserveObject(self._model, function (path, value) {
			SyncView(value, path);
		});

		self.view = ObserveElements(self._elements, function (keyBind, valueBind, value) {
			eval('self.model.' + valueBind + ' = value');
		});
	}


	window.Swathe = {
		controller: function (scope, model) {
			return new Controller(scope, model);
		}
	};

	/*
		internal
	*/

	function isObject (value) {
		if (value === null || value === undefined) return false;
		else return value.constructor === Object;
	}

}());
