# Swathe #
**Swathe - Powerful, Small, 2 Way Data Binding**

Swathe is a 2 way data binding library. It is extremely small and extremely powerful. Try it out and you will see why. Contributions welcome!

Browsers support any ES5 spec compliant, such as IE9+ and Safari 6+. Firefox, Chrome and Edge.


## Use ##
- Install `npm swathe`
- Include `<script src="swathe.min.js"></script>`


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
