/**
 * Insere a classe zoom no body
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarClique() {
	var contador = 0,
		_button = document.getElementById('audio-button'),
		_radar = document.getElementById('audio-radar'),
		_radarAtivado = document.getElementById('audio-radar-ativado');
		// _button.volume = 0.05;
		// _radarAtivado.volume = 0.1;

	document.querySelector('.botao').addEventListener('click', function() {
		_button.play();
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

	document.querySelector('.mute').addEventListener('click', function() {
		if (this.classList.contains('active')) {
			_radar.volume = 1;
			this.classList.remove('active');
		} else {
			_radar.volume = 0;
			this.classList.add('active');
		}
	});

	_radarAtivado.play();
	tocarRadar();
}

function tocarRadar() {
	var _radar = document.getElementById('audio-radar');
	// _radar.volume = 0.05;

	loopRadar = setTimeout(function() {
		_radar.play();
		tocarRadar();
	}, 3000);
}