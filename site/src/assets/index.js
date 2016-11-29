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
