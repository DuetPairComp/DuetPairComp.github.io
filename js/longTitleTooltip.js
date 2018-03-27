var LongTitleTooltip = {
	 init: function() {
	 	$("#long-title-tooltip").mouseout(function() {
	 		$(this).css("display", "none");
	 	});
	 },
	 show: function(top, left, longTitle) {
	 	$("#long-title-tooltip")
			.css("display", "block")
			.css("top", top)
			.css("left", left)
			.html(longTitle);
	 },
	 remove: function() {
	 	$("#long-title-tooltip").css("display", "none");
	 }
}