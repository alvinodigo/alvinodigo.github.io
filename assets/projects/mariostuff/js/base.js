/**
 * Toca sons ao clique
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarSons() {
	var audioVida = document.getElementById('audio-cogumelo-vida'),
		audioCrescer = document.getElementById('audio-cogumelo-crescer'),
		audioFlorzinha = document.getElementById('audio-florzinha'),
		audioPeninha = document.getElementById('audio-peninha'),
		audioEstrela = document.getElementById('audio-estrela'),
		audioLua = document.getElementById('audio-lua');

	tocarSons('cogumelo-vida',audioVida);
	tocarSons('cogumelo-crescer',audioCrescer);
	tocarSons('florzinha',audioFlorzinha);
	tocarSons('peninha',audioPeninha);
	tocarSons('estrela',audioEstrela);
	tocarSons('lua',audioLua);
}

function tocarSons(elemento,audio) {
	var _elemento = document.getElementById(elemento);

	_elemento.addEventListener('click', function() {
		var _this = this;

		if ((audio.duration > 0) && (!audio.paused)) {
			audio.pause();
			audio.currentTime = 0;

			_this.classList.remove('ativa');
		} else {
			audio.play(_this.classList.add('ativa'));

			audio.addEventListener('ended', function() {
				_this.classList.remove('ativa');
			});
		}
	});
}