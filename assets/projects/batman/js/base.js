/**
 * Insere a classe darkness no body
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarClique() {
	document.addEventListener('click', function(e) {
		document.body.classList.toggle('darkness');
	});
}