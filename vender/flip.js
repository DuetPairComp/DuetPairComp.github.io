'use strict';

function flip($card) {
	var cardTransitionTime = 300;

   	$card.toggleClass('switched');
   	window.setTimeout(function () {
      	$card.children().children().toggleClass('active');
   	}, cardTransitionTime / 2);
}