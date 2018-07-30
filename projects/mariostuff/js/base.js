/**
 * Toca sons ao clique
 *
 * @return	void
 * @author	Alvino Rodrigues
 */

function ativarSons() {
	var audio = document.getElementById('audio-cogumelo-vida');

	document.getElementById('cogumelo-vida').addEventListener('click', function(e) {
		audio.play();
	});
	document.getElementById('cogumelo-crescer').addEventListener('click', function(e) {
		document.getElementById('audio-cogumelo-crescer').play();
	});
	document.getElementById('florzinha').addEventListener('click', function(e) {
		document.getElementById('audio-florzinha').play();
	});
	document.getElementById('peninha').addEventListener('click', function(e) {
		document.getElementById('audio-peninha').play();
	});
	document.getElementById('estrela').addEventListener('click', function(e) {
		document.getElementById('audio-estrela').play();
	});
	document.getElementById('lua').addEventListener('click', function(e) {
		audio.play();
		setTimeout(function() { audio.play(); }, 1000);
		setTimeout(function() { audio.play(); }, 2000);
	});
}