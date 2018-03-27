var OneGroupCard = {
	newCardData: null, // for initializing card content
	newCardEl: null,

	draw: function() {
		var self = this;

		Card.setCard(self);
		self.add();
		self.bindData();

		// summary description (front)
		self.displaySummaryDesc();
		self.initBottomButtons();
		self.initMouseenterGroupBehaviour();
		self.initFrontClickInfoBehaviour();
		self.setFrontClickableHighlight(self.newCardEl);
		self.adjustHeight();

		// group list (back)
		self.drawGroupList();
	},
	add: function() {
		var cardHTML = "<div class='card' style='display:none'>" + 
							"<div class='card-wrapper'>" +
								"<div class='card-side front active'></div>" +
								"<div class='card-side back'></div>" +
							"</div>" +
							"<span class='button fa fa-remove'></span>" + 
							"<span class='button fa fa-exchange'></span>" + 
					   "</div>";

		Card.addCardHTML(cardHTML);
	},
	bindData: function() {
		Card.bindData(OneGroupOperator);
	},
	displaySummaryDesc: function() {
		var summaryDesc = TextGenerator.generateSummary["oneGroup"](this.newCardData);
		Card.SummaryDescription.display(summaryDesc);
	},
	adjustHeight: function() {
		var self = this;
		var cardHeight = $(self.newCardEl).find(".front").height();
		$(self.newCardEl).css("height", cardHeight);
	},
	initBottomButtons: function() {
		Card.initFlipCardBehaviour();
		Card.initRemoveButton();
	},
	initMouseenterGroupBehaviour: function() {
		var self = this;

		$(self.newCardEl)
			.find(".front .groups span")
			.mouseenter(function() {
				var parentCardEl = $(this).closest(".card")[0];
				var cardData = d3.select(parentCardEl).datum();
				var cardPosition = $(parentCardEl).offset();
				var groupName = $(this).text();
				var similarOrDifferent = $(this).hasClass("d") ? "different" : "similar";
				var data = { groupName: groupName, similarOrDifferent: similarOrDifferent };

				SystemReasoningPanel.clear();
				SystemReasoningPanel["AttrCount"].show();
				SystemReasoningPanel["AttrCount"].showDescription(cardData, "oneGroup", data);
				SystemReasoningPanel.move(cardPosition.top - 10, cardPosition.left - 10);
			});

		$(self.newCardEl)
			.find(".front .groups span")
			.mouseleave(function() {
				SystemReasoningPanel.hide();
			});
	},
	initFrontClickInfoBehaviour: function() { // changing text appearance by adding class and adding click behaviour
		var self = this;

		$(self.newCardEl).find(".front .groups span")
			.each(function() {
				var similarIsParent = $(this).closest("span.similar").length != 0;

				if (similarIsParent)
					$(this).addClass("clickable s");
				else
					$(this).addClass("clickable d");
			});

		Card.ClickableAttr.initClick(this.newCardEl, "front", getGroupConfigAndNames, getAttrToBeStoredOrRemoved);

		function getGroupConfigAndNames(clickedEl) { // this func defines the mapping between top/bottom and group1/2
			var parentCardEl = $(clickedEl).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();
			var occupiedShelfName = (cardData.configOnShelves["top"].length == 0) ? "bottom" : "top";

			// make sure group 1 is always top and group 2 is always bottom
			if (occupiedShelfName == "top") {
				var group1Name = cardData.groupNamesOnShelves["top"];
				var group1Config = cardData.configOnShelves["top"];
				var group2Name = $(clickedEl).text();
				var group2Config = [ $(clickedEl).text() ];
			}
			if (occupiedShelfName == "bottom") {
				var group1Name = $(clickedEl).text();
				var group1Config = [ $(clickedEl).text() ];
				var group2Name = cardData.groupNamesOnShelves["bottom"];
				var group2Config = cardData.configOnShelves["bottom"];
			}
			
			var group1Info = { name: group1Name, config: group1Config, everythingElse: false }; // only one group, must not be everything else
			var group2Info = { name: group2Name, config: group2Config, everythingElse: false };

			return {
				group1: group1Info,
				group2: group2Info
			};
		}

		function getAttrToBeStoredOrRemoved(clickedEl) {
			var parentCardEl = $(clickedEl).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();
			var clickedGroupName = $(clickedEl).text();
			var isSimilarGroup = $(clickedEl).hasClass("s");
			var attributeList = isSimilarGroup ? cardData.similarAttr[clickedGroupName] : cardData.differentAttr[clickedGroupName];
			var probabilityDistributionsStoreToLink = {};

			for (var i = 0; i < attributeList.length; i++) { // only get the required distributions
				var currentAttr = attributeList[i];
				var currentProbabilityDistribution = cardData.probabilityDistributions[clickedGroupName][currentAttr];
				probabilityDistributionsStoreToLink[currentAttr] = currentProbabilityDistribution;
			}

			return probabilityDistributionsStoreToLink;
		}
	},
	setFrontClickableHighlight: function(cardEl) {
		var cardData = d3.select(cardEl).datum();
		var occupiedShelfName = (cardData.configOnShelves["top"].length == 0) ? "bottom" : "top";
		var group1Config = cardData.configOnShelves[occupiedShelfName];
		var clickableNode1Info = { config: group1Config, everythingElse: false };
		var node1ID = GraphStructure.getNodeID(clickableNode1Info, true);

		// remove selected class
		$(cardEl).find(".front .clickable").removeClass("selected");

		// add the class back
		$(cardEl).find(".front .clickable").each(function() {
			var group2Name = $(this).text();
			var group2Config = [ group2Name ];
			var clickableNode2Info = { config: group2Config, everythingElse: false };
			var node2ID = GraphStructure.getNodeID(clickableNode2Info, true);
			var similarOrDifferent = Card.ClickableAttr.getSimilarOrDifferent(this);
			var clickableAttributeCount = cardData[similarOrDifferent + "Attr"][group2Name].length;
			var linkID = GraphStructure.getLinkID(node1ID, node2ID);

			if (linkID in GraphStructure.linkInfoDict) {
				if (similarOrDifferent in GraphStructure.linkInfoDict[linkID]) {
					var linkAttributeCount = Object.keys(GraphStructure.linkInfoDict[linkID][similarOrDifferent]).length;
					var sameAttributeCount = clickableAttributeCount == linkAttributeCount;

					if (sameAttributeCount)
						$(this).addClass("selected");
				}
			}
		});
	},
	drawGroupList: function() {
		Card.GroupList.drawContainer();
		Card.GroupList.drawHeaders();
		Card.GroupList.drawContents();
	},
	setBackClickableHighlight: function(cardEl) {
		Card.Back.setClickableHighlight["OneGroup"](cardEl)
	}
}