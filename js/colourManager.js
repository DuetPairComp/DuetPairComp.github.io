var ColourManager = {
	similarColour: "#83AF9B",
	differentColour: "#F67280",
	neitherSimilarNorDifferentColour: "#A9A9A9",
	redGreenCSS: null,
	colourBlindCSS: null,

	init: function() {
		var self = this;

		self.initColourStyleCSS();
		$('#color-style').html(self.redGreenCSS);
		$('#setting-menu .color-menu select').on('change', changeColour);

		function changeColour() {
			var currentColour = $('#setting-menu .color-menu select').val();
			var isRadialLayout = !d3.select(".node.selected").empty();
			var centreNodeID = isRadialLayout ? d3.select(".node.selected").datum().nodeID : null;

			if (currentColour == "red-green") {
				$("#color-style").html(self.redGreenCSS);
				self.similarColour = "#83AF9B";
				self.differentColour = "#F67280";
				GraphStructure.updateNodeData(centreNodeID);
				GraphVisualizer.Node.update();
			}

			if (currentColour == "colorblind-safe") {
				$("#color-style").html(self.colourBlindCSS);
				self.similarColour = "#67a9cf";
				self.differentColour = "#ef8a62";
				GraphStructure.updateNodeData(centreNodeID);
				GraphVisualizer.Node.update();
			}
		}
	},
	initColourStyleCSS: function() {
		var self = this;

		self.redGreenCSS = "#comparison-panel .card .more { color: #FE4365; }" +
						   "#relationship-map #stored-attributes-panel .footer .filters .button.d { background-color: #F67280; }" +
						   "#comparison-panel .card .front span.clickable.d { color: #F67280; }" +
						   "#comparison-panel .card .back .attribute.clickable.d .name text { fill: #F67280; }" +
						   "#comparison-panel .card .back .attribute.clickable.d .name line { stroke: #F67280; }" +
						   "#comparison-panel .card .back .different.content .count { fill: #FE4365; }" +
						   "#comparison-panel .card .front span.clickable.s { color: #83AF9B; }" +
						   "#comparison-panel .card .back .attribute.clickable.s .name text { fill: #83AF9B; }" +
						   "#comparison-panel .card .back .attribute.clickable.s .name line { stroke: #83AF9B; }" +
						   "#comparison-panel .card .similar .more { color: #83AF9B; }" +
						   "#relationship-map #stored-attributes-panel .footer .filters .button.s { background-color: #83AF9B; }" +
						   "#comparison-panel .card .back .similar.content .count { fill: #83AF9B; }";
		self.colourBlindCSS = "#comparison-panel .card .more { color: #ef8a62; }" +
							  "#relationship-map #stored-attributes-panel .footer .filters .button.d { background-color: #ef8a62; }" +
							  "#comparison-panel .card .front span.clickable.d { color: #ef8a62; }" +
							  "#comparison-panel .card .back .attribute.clickable.d .name text { fill: #ef8a62; }" +
						      "#comparison-panel .card .back .attribute.clickable.d .name line { stroke: #ef8a62; }" +
						      "#comparison-panel .card .back .different.content .count { fill: #ef8a62; }" +
						      "#comparison-panel .card .front span.clickable.s { color: #67a9cf; }" +
						      "#comparison-panel .card .back .attribute.clickable.s .name text { fill: #67a9cf; }" +
						      "#comparison-panel .card .back .attribute.clickable.s .name line { stroke: #67a9cf; }" +
						      "#comparison-panel .card .similar .more { color: #67a9cf; }" +
						      "#relationship-map #stored-attributes-panel .footer .filters .button.s { background-color: #67a9cf; }" +
						      "#comparison-panel .card .back .similar.content .count { fill: #67a9cf; }";
	}
}