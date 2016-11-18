var Model = {
	count: 0,
	isTrue: true,
	isFalse: false,
	isDisabled: true,
	link: 'Empty',
	text: 'text stuff',
	html: '<div>Hello World</div>',
	textColor: 'white',
	backgroundColor: 'red',
	i: {
		am: {
			nested: 'NO',
			nestedLink: 'www.google.com'
		}
	},
	iterable: ['zero', 'one', 'two', 'three'],
	onClick: function (modelVariable, string, number, e) {
		console.log(modelVariable);
		console.log(string);
		console.log(number + ' ' + typeof number);
		console.log(e);
		console.log(this);
	},
	eventClick: function (modelVariable, string, number, e) {
		console.log(modelVariable);
		console.log(string);
		console.log(number + ' ' + typeof number);
		console.log(e);
		console.log(this);
	}
};
