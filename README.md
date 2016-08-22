# Swathe #
**Swathe - Powerful, Small, 2 Way Data Binding**

Swathe is a 2 way data binding library. It is extremely small and extremely powerful. Try it out and you will see for your self. Contributions suggestions welcome and appreciated! 2 Way data binding can be costly thus only elements with value properties are bi-directionally watched using the Input Event.

Browsers support any ES5 spec compliant, such as IE9+ and Safari 6+. Firefox, Chrome and Edge.


## Size ##
Approximately 670 bytes gzipped (1.35KB uncompressed).


## Performance ##
Performance seems to be pretty good. I am not sure how it compares to other frameworks though. Running Chrome with a single bi-directional element changing **25,000** divs simultaneously the UI lag is only slightly apparent. When using 50/50 div and bi-directional inputs **10,000** begins to have noticeable lag. Check out the example  directory and see for your self.


## Use ##
- Install `npm swathe`
- Chose either `swathe.js` or `swathe-next.js`
- If using `swathe-next.js` you will need to include the `proxy.min.js`
- Minify `swathe.js` or bundle `proxy.min.js` and `swathe-next.js` then Minify


## View Example ##
```HTML
<div data-bind="style.background: color">Color Me!</div>
<input data-bind="value: color" value="Color"/>
<div data-bind="innerText: color">None</div>

<a href="#" data-bind="href: i.am.nested">Link</a>
<input class="input" data-bind="value: i.am.nested" value="Initial"/>
<div class="data" data-bind="innerText: i.am.nested">None</div>
```


## Model Example ##
```JavaScript
var model = {
	color: 'blue',
	i: {
		am: {
			nested: 'no'
		}
	}
};

var controller = Swathe('body', model);

setTimeout(function () {
	controller.model.i.am.nested = 'YES';
}, 1500);
```


## Model ##
### Swathe ###
**Parameters**
- `scope`: Object `window.document` or querySelector string e.g. `body`
- `model`: Object `{}` (define all properties that will be observed)

**Returns**
- `controller`: A controller instance.

### Controller ###
An instance of `Swathe`. The return value.

**Properties**
- `model`: The observed object. Get `model.data`. Set `model.data = 'text'`
- `elements`: The observed elements.


## View ##
### Attributes ###
- `data-bind`: Single attribute for all operations.

### Values ###
- `key:`: Maps to JavaScript property of DOM element e.g. `innerText:`.
- `value`: Maps to path of model object `i.am.a.path`


## License ##
Licensed Under MPL 2.0

Copyright 2016 [Alexander Elias](https://github.com/AlexanderElias/)
