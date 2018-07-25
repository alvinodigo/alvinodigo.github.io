/**
 * Insere a classe zoom no body
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarClique() {
	var contador = 0;
	document.querySelector('.botao').addEventListener('click', function(e) {
		var _body = document.body;

		_body.className = '';

		switch(contador) {
			case 0:
				_body.classList.add('zoom-1');
				break;
			case 1:
				_body.classList.add('zoom-2');
				break;
			case 2:
				_body.classList.add('zoom-3');
				break;
			default:
				contador = -1;
		}
		contador++;
	});
}