/**
 * Faz a rolagem suave da página
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function activateSmoothScrolling() {
	var elements = document.querySelector('.navigation-menu').querySelectorAll('a');

	for (var i = 0; i < elements.length; i++) {
		elements[i].addEventListener('click', function(e) {
			var target = this.getAttribute('href'),
				distance = document.querySelector(target).offsetTop;

			scrollTo(distance);

			e.preventDefault();
		});
	}

	document.querySelector('.button-top').addEventListener('click', function() {
		scrollTo(0);
	});
}

function scrollTo(distance) {
	window.scroll({
		top: distance,
		behavior: 'smooth'
	});
}