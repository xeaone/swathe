# Swathe #
**Swathe - Powerful | Small | Data Binding | No Virtual DOM | No Dirty Checks**

Swathe is a smart 2 way data binding library. It is extremely small and extremely powerful. Try it out and you will see for your self. Contributions suggestions welcome and appreciated! 2 Way data binding can be costly thus only elements with value properties are bi-directionally watched using the Input Event.


## Size ##
Approximately 1.7KB gzipped (4.3KB uncompressed)


## Performance ##
Performance seems to be extremely good. Running Chrome with **1,000** bi-directional elements changing simultaneously and a total of **10,000** elements being controlled by Swathe there is no apparent UI lag. If you want to check it out for your self pull up the example directory and view the performance html document.


## Browser Support ##
The code is in ES6 but is compiled down to ES5. Swathe uses ES6 Proxy and the browser support is not ideal. Swathe automatically will detect if the browser supports Proxy and if not will fall back to use Object.defineProperties. An important note to keep in mind is that Object.defineProperties does not allow for new properties to be added and watched. Therefore after the controller has been created new properties added to the model will not be watched. Proxies will allow dynamic properties. Either way it would be best practice to declare all properties on the model before creating the controller. Thus browser support is basically anything that can run ES5.

- IE 9+
- Edge
- Safari 6+
- Firefox
- Chrome


## Use ##
- Install `npm swathe`
- Chose `dist/swathe.min.js`


## View Example ##
```HTML
<div s-controller="app">
	<div s-style.background="color" s-inner-text="color">Color Me!</div>
	<input s-value="color" value="Color"/>

	<a href="#" s-href="i.am.nested">Link</a>
	<span s-inner-text="i.am.nested">Empty</span>
	<input s-value="i.am.nested"/>

	<button type="button" s-on-click="say(color, 'world', 1)" >Say</button>
</div>
```


## Model Example ##
```JavaScript
var model = {
	color: 'blue',
	i: {
		am: {
			nested: 'MAYBE'
		}
	},
	say: function (color, string, number, e) {
		console.log(color);
		console.log(string);
		console.log(number);
		console.log(e);
		console.log(this);
	}
};

var controller = Swathe.controller('app', model);

setTimeout(function () {
	controller.model.i.am.nested = 'YES';
}, 1500);
```


## Model ##
### Swathe ###
**Properties**
- `controllers` Object containing a list of controllers.
- `controller` Object to interact with the controller.

### controller ###
**Parameters**
- `name`  A controller name. **Required**
- `model` An observed interactable object. It is best to define all properties that will be observed at this point. **Required**

**Returns**
- `controller` A controller instance.

**Properties**
- `name`
- `model` The observed object.
- `dom` Object containing a reference to DOM elements.
- `view`

### controllers ###
**Returns**
- A list of controller objects.

## View ##
### Attribute Name ###
Attribute names are used for Swathe to detect elements to interact with. These names map directly to JavaScript element properties. The mapping pattern converts `-` toCamelCase. Dots or periods such as `s-style.background` are an acceptable syntax.

- `s-*`: The primary prefix for attribute names.
- `data-s-*`: The secondary prefix for attribute names.

### Attribute Values ###
Attribute values are used to access and register an element's property to it's Model. The attribute name `s-inner-text` could have a value set to `array.0`.

- `.`: Dot syntax can be used to access a properties on the model even array indexes.

### Special Attributes ###
- `s-on-*` This is the event attribute it is used instead of `addEventListener`. Example `s-on-click="say('hello')"`.
	- Function parameters can be `Model Variables`, `String`, and `Number`. Numbers are parsed to an actual integer.

- `s-for` This is basically a for of loop. Example `s-for="variable of iterable"`.
	- `for` Clones the first child element.
	- `variable` The value for the children elements to use.
	- `iterable` The path to an array/iterable on the model.


## License ##
Licensed Under MPL 2.0

Copyright 2016 [Alexander Elias](https://github.com/AlexanderElias/)
