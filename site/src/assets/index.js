var RandomHex = function () {
	return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
};

(function() {

	window.addEventListener('DOMContentLoaded', function () {
		var codes = document.querySelectorAll('code');

		for (var i = 0; i < codes.length; i++) {
			var element = codes[i];
			var html = element.innerHTML;

			html = html.replace(/\</g, '&lt;');
			html = html.replace(/\>/g, '&gt;');

			element.innerHTML = html;
		}
	});

}());
