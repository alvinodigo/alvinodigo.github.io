/**
 * Insere a classe minecraft no body
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarClique() {
	var contador = 0;
	document.querySelector('.pokeball').addEventListener('click', function(e) {
		var _body = document.body,
			_title = document.querySelector('h1');

		_body.className = '';

		switch(contador) {
			case 0:
				_body.classList.add('great');
				_title.innerHTML = 'Great Ball';
				break;
			case 1:
				_body.classList.add('ultra');
				_title.innerHTML = 'Ultra Ball';
				break;
			case 2:
				_body.classList.add('safari');
				_title.innerHTML = 'Safari Ball';
				break;
			case 3:
				_body.classList.add('premier');
				_title.innerHTML = 'Premier Ball';
				break;
			case 4:
				_body.classList.add('cherish');
				_title.innerHTML = 'Cherish Ball';
				break;
			case 5:
				_body.classList.add('master');
				_title.innerHTML = 'Master Ball';
				break;
			default:
				_title.innerHTML = 'Poké Ball';
				contador = -1;
		}
		contador++;
	});
}