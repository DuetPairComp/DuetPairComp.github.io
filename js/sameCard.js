var SameCard = {
	newCardData: null, // useless
	newCardEl: null,
	
	draw: function() {
		var self = this;

		Card.setCard(self);
		self.add();
		self.bindData();

		self.displaySummaryDescInCard();
		self.initRemoveButton();
	},
	add: function() {
		var cardHTML = "<div class='card same' style='display:none'>" + 
							"<div class='card-wrapper'>" +
								"<div class='card-side front active'></div>" +
								"<div class='card-side back'></div>" +
							"</div>" +
							"<span class='button fa fa-remove'></span>" +
					   "</div>";

		Card.addCardHTML(cardHTML);
	},
	bindData: function() {
		var dummyOperator = {
			getResults: function() {
				return {};
			}
		};

		Card.bindData(dummyOperator);
	},
	displaySummaryDescInCard: function() {
		var summaryDesc = TextGenerator.generateSummary["same"](ComparisonShelves.groupNamesOnShelves);
		$("#comparison-panel .results .card:first-child").find(".front")
			.html(summaryDesc);
	},
	initRemoveButton: function() {
		Card.initRemoveButton();
	},
	isExactlyTheSameConfig: function(configOnShelves) {
		var duplicateCount = 0;
		for (var i = 0; i < configOnShelves["top"].length; i++) {
			if (configOnShelves["bottom"].indexOf(configOnShelves["top"][i]) != -1)
				duplicateCount++;
		}

		if (configOnShelves["top"].length == configOnShelves["bottom"].length && 
			configOnShelves["bottom"].length == duplicateCount)
			return true;

		return false;
	}
}