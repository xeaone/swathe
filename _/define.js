
var Observer = {

	descriptor: function (k, v, c) {
		return {
			configurable: true,
			enumerable: true,
			get: function () {
				return v;
			},
			set: function (nv) {
				v = nv;
				c(k, v);
			}
		};
	},

	sInsert: function (observed, callback, prefix, key, value) {

		if (value.constructor.name === 'Object' || value.constructor.name === 'Array') {
			value = this.create(value, callback, prefix + key, true);
		}

		if (observed.constructor.name === 'Array' && key == -1) {
			key = 0;
			observed.splice(key, 0, value);
			observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
			key = observed.length-1;
			value = observed[key];
		}

		observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
		callback(prefix + key, value);
	},

	sRemove: function (observed, callback, prefix, key) {
		if (observed.constructor.name === 'Object') {
			delete observed[key];
		} else if (observed.constructor.name === 'Array') {
			var l = observed.length - 1;
			observed.splice(key, 1);
			key = l;
		}

		callback(prefix + key, undefined);
	},

	create: function (observable, callback, prefix, trigger) {
		var observed, key, value, type;

		if (!prefix) prefix = '';
		else prefix += '.';

		type = observable.constructor.name;
		observed = type === 'Object' ? {} : [];

		observed = Object.defineProperty(observed, 'sInsert', {
			value: this.sInsert.bind(this, observed, callback, prefix)
		});

		observed = Object.defineProperty(observed, 'sRemove', {
			value: this.sRemove.bind(this, observed, callback, prefix)
		});

		for (key in observable) {
			value = observable[key];
			type = value.constructor.name;

			if (type === 'Object' || type === 'Array') value = this.create(value, callback, prefix + key);
			observed = Object.defineProperty(observed, key, this.descriptor(prefix + key, value, callback));
			if (trigger) callback(prefix + key, value);
		}

		return observed;
	}

};

(function() {
	'use strict';
	var o = { num: 1, str: 'two', arr: ['zero', 'one', 'two', 'three', 'four'], obj: { hello: 'world'} };

	var observed = Observer.create(o, function (key, value) {
		console.log('|');
		console.log('cb k: ' + key);
		console.log('cb v: ' + value);
		console.log('|');
	});


	// Array Removes
	// console.log('original length: ' + observed.arr.length);
	// observed.arr.sRemove(0);
	// console.log('new length: ' + observed.arr.length);


	// Array Inserts
	// console.log('original length: ' + observed.arr.length);
	// observed.arr.sInsert(-1, 'new start');
	// observed.arr.sInsert(observed.arr.length, 'new end');
	// console.log(observed.arr);
	// console.log('new length: ' + observed.arr.length);


	// Object Removes
	// console.log('original length: ' + observed.arr.length);
	// observed.arr.sRemove(0);
	// console.log('new length: ' + observed.arr.length);


	// Object Inserts
	observed.obj.sInsert('moo', { doo: 'poo' });
	console.log('original value: ' + observed.obj.moo.doo);
	observed.obj.moo.doo = 'oop';
	console.log('new value: ' + observed.obj.moo.doo);

	// observed.obj.sInsert('foo', 'bar');
	// console.log('new value: ' + observed.obj.foo);

}());

/*

	['zero', 'one', 'two', 'three', 'four']
	   0       1      2      3        4

	['zero', 'one', 'three', 'four']
	   0       1       2       3

*/
