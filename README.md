# Swathe #
**Swathe - Powerful, Small, 2 Way Data Binding**

Swathe is a 2 way data binding library. It is extremely small and extremely powerful. Try it out and you will see for your self. Contributions suggestions welcome and appreciated! 2 Way data binding can be costly thus only elements with value properties are bi-directionally watched using the Input Event.

Browsers support any ES5 spec compliant, such as IE9+ and Safari 6+. Firefox, Chrome and Edge.

## Performance ##
Performance seems to be pretty good. I am not sure how it compares to other frameworks though. Running Chrome with a single bi-directional element changing **25,000** divs simultaneously changing the UI lag is only slightly apparent. When using 50/50 div and bi-directional inputs **10,000** has minor lag. check out the demo directory and see for your self.

Improvements can be made currently `eval` is being used to map the string path to an object. This is not ideal, suggestions would be great. I was thinking of maybe creating an object which maps to the model object using string keys. Them using `Object.defineProperty` to be able to interact get/set the model.


## Use ##
- Install `npm swathe`
- Chose either `swathe.js` or `swathe-next.js`
- If using `swathe-next.js` you will need to include the `proxy.min.js`
- Minify `swathe.js` or bundle `proxy.min.js` and `swathe-next.js` then Minify


## Model ##
### Swathe.controller ###
**Parameters**
- `scope`: Object `window.document` or querySelector string `body`
- `model`: Object `{}` (define all properties that will be observed)

**Return**
- `controller`: A controller instance.

### Controller ###
An instance of `Swathe.controller`.

**Properties**
- `model`: The observed object. Get `model.data`. Set `model.data = 'text'`
- `elements`: The observed elements.


## View ##
### Attributes ###
- `data-bind`: Single attribute for all operations.

### Values ###
- `key:`: Maps to JavaScript property of DOM element e.g. `innerText:`.
- `value`: Maps to path of model object `i.am.a.path`

### View Example ###
```HTML
<a href="#" data-bind="href: i.am.deep">Link</a>
<div data-bind="innerText: i.am.deep"></div>
<input data-bind="value: i.am.deep" value="Initial"/>
```


## Examples ##
Check out the demo directory. More examples coming soon.


## License ##
Licensed Under MPL 2.0

Copyright (c) 2016 [Alexander Elias](https://github.com/AlexanderElias/)
