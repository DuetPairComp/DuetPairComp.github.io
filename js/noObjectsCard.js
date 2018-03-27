var NoObjectsCard = {
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
		var cardHTML = "<div class='card no-objects' style='display:none'>" + 
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
		var summaryDesc = "At least one group has one objects.";
		$("#comparison-panel .results .card:first-child").find(".front")
			.html(summaryDesc);
	},
	initRemoveButton: function() {
		Card.initRemoveButton();
	},
	atLeastOneShelfHaveNoObjects: function(configOnShelves) {
		var topShelfOccupied = configOnShelves["top"].length != 0;
		var bottomShelfOccupied = configOnShelves["bottom"].length != 0;

		if (topShelfOccupied) {
			var isEverythingElse = (configOnShelves["top"][0] == "Everything Else");
			var configList = !isEverythingElse ? configOnShelves["top"] : configOnShelves["bottom"];
			var numberOfObjects = Helper.retrieveGroups(configList, isEverythingElse).length;

			if (numberOfObjects == 0)
				return true;
		}
		if (bottomShelfOccupied) {
			var isEverythingElse = (configOnShelves["bottom"][0] == "Everything Else");
			var configList = !isEverythingElse ? configOnShelves["bottom"] : configOnShelves["top"];
			var numberOfObjects = Helper.retrieveGroups(configList, isEverythingElse).length;

			if (numberOfObjects == 0)
				return true;
		}

		return false;
	}
}