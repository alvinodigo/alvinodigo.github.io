/**
 * Insere a classe minecraft no body
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarClique() {
	document.addEventListener('click', function(e) {
		document.body.classList.toggle('darkness');
	});
}