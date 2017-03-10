# Swathe #
**Swathe - Data Binding | No Dirty Checks | No Virtual DOM | Powerful | Small**

**the documentation is a little out of date please see the examples on the website it is the most current**

Swathe is a smart 2 way data binding library. It is extremely small and extremely powerful. Try it out and you will see for your self. Contributions suggestions welcome and appreciated!


## Size ##
Approximately 1.7KB gzipped (4.3KB uncompressed)


## Performance ##
Performance seems to be extremely good. Running Chrome with **1,000** elements changing simultaneously and over **5,000** elements being controlled by Swathe there is no apparent UI lag. Check out the [performance page](https://alexanderelias.github.io/swathe/performance/).


## Compatibility ##
The code is in ES6 and ES5 but is compiled down to ES5. Swathe uses ES6 Proxy and the browser support is almost there but not ideal yet. Swathe automatically will detect if the browser supports Proxy and if not will fall back to use Object.defineProperties. An important note to keep in mind is that Object.defineProperties does not allow for new properties to be added and watched. Therefore after the controller has been created new properties added to the model will not be watched. Proxies will allow dynamic properties. Either way it would be best practice to declare all properties on the model before creating the controller. Thus browser support is basically anything that can run ES5.

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
- `doc` The default `document` for each controller.
	- `document` **default**
- `prefix` The default prefix for the attribute names
	- `s-` **default**
- `rejects` String of rejected elements or attributes it is converted to RegExp.
	- `iframe|object|script` **default**
- `controllers` Object containing a list of controllers.
- `controller` Returns a new controller.

### controller ###
**Parameters**
- `name`  A controller name. **Required**
- `model` A observed object. It is best to define all properties that will be observed at this point.
- `callback` A callback for the controller with the instance of the controller passed as a parameter.

**Returns**
- `controller` A controller instance.

**Properties**
- `name`
- `model` The observed object.

### controllers ###
**Returns**
- A list of controller objects.

## View ##
### Attribute Name ###
Attribute names are used for Swathe to detect elements to interact with. These names map directly to JavaScript element properties. **All** JavaScript element properties are available for usage. The mapping pattern typically converts `-` to camel case and leaves dots delimited unchanged. For example `s-style.background` is an acceptable syntax. Although please note that the dot for the `s-style` is not necessary. Both `s-style.background` and `s-style-background` are acceptable because `s-style` is a special attribute.

- `s-*`: The primary prefix for attribute names.
- `data-s-*`: The secondary prefix for attribute names.

### Attribute Values ###
Attribute values are used to access and register an element's property to it's Model. The attribute name `s-inner-text` could have a value set to `array.0`.

- `.`: Dot syntax can be used to access any nested property on the model including arrays.

### Special Attributes ###
- `s-text` Maps to `innerText`
- `s-html` Maps to `innerHtml`
- `s-css` Maps to `cssText`
- `s-css-[style name]` Same as `Element.style[style name]`
- `s-on-[event name]` This is the event attribute it is used instead of `addEventListener`. Example `s-on-click="say"`. If an event is added the original is removed.
- `s-each-[variable]` A for of loop. Example `s-each-variable="iterable"`.
	- `each` Clones the first child element.
	- `variable` The value for each variable it is the same as `iterable[i]`.
	- `iterable` The path to an array on the model. (objects not supported yet)


## License ##
Licensed Under MPL 2.0

Copyright 2016 [Alexander Elias](https://github.com/AlexanderElias/)
