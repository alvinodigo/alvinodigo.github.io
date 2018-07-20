/**
 * Insere a classe minecraft no body
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarClique() {
	document.querySelector('.chapeu').addEventListener('click', function(e) {
		document.body.classList.toggle('odyssey');
	});
}