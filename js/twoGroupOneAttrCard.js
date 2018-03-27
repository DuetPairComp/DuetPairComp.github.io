var TwoGroupOneAttrCard = {
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
		self.initMouseenterAttrBehaviour();
		self.initFrontClickInfoBehaviour();
		self.setFrontClickableHighlight(self.newCardEl);
		self.adjustHeight();

		// attribute list (back)
		self.drawAttributeList();
		self.initBackClickInfoBehaviour(self.newCardEl);
		self.setBackClickableHighlight(self.newCardEl);
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
		Card.bindData(TwoGroupOneAttrOperator);
	},
	displaySummaryDesc: function() {
		var summaryDesc = TextGenerator.generateSummary["twoGroupOneAttr"](this.newCardData);
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
	initMouseenterAttrBehaviour: function() {
		var self = this;

		$(self.newCardEl)
			.find(".front .attributes span")
			.mouseenter(function() {
				var parentCardEl = $(this).closest(".card")[0];
				var cardData = d3.select(parentCardEl).datum();
				var attributeName = $(this).text();
				var barChartData = cardData.probabilityDistribution[attributeName];
				var cardPosition = $(parentCardEl).offset();

				SystemReasoningPanel.clear();
				SystemReasoningPanel["OneChart"].show();
				SystemReasoningPanel["OneChart"].renderBarChart(barChartData, attributeName);
				SystemReasoningPanel["OneChart"].showDescription(cardData, attributeName);
				SystemReasoningPanel.move(cardPosition.top - 10, cardPosition.left - 10); // 10 are margins
			});

		$(self.newCardEl)
			.find(".front .attributes span")
			.mouseleave(function() {
				SystemReasoningPanel.hide();
			});
	},
	initFrontClickInfoBehaviour: function() { // changing text appearance by adding class and adding click behaviour
		var self = this;

		$(self.newCardEl)
			.find(".front .attributes span")
			.each(function() {
				var similarIsParent = $(this).closest("span.similar").length != 0;
				var differentIsParent = $(this).closest("span.different").length != 0;

				if (similarIsParent)
					$(this).addClass("clickable s");
				else if (differentIsParent)
					$(this).addClass("clickable d");
				else
					$(this).addClass("clickable n");
			});

		Card.ClickableAttr.initClick(this.newCardEl, "front", getGroupConfigAndNames, getAttrToBeStoredOrRemoved);

		function getGroupConfigAndNames(clickedEl) {
			var parentCardEl = $(clickedEl).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();

			// get group 1 info
			var isGroup1EverythingElse = cardData.configOnShelves["top"][0] == "Everything Else";
			var group1Name = "";
			var group1Config = [];

			if (isGroup1EverythingElse) {
				group1Name = "NOT " + cardData.groupNamesOnShelves["bottom"];
				group1Config = cardData.configOnShelves["bottom"];
			}
			else {
				group1Name = cardData.groupNamesOnShelves["top"];
				group1Config = cardData.configOnShelves["top"];
			}

			// get group 2 info
			var isGroup2EverythingElse = cardData.configOnShelves["bottom"][0] == "Everything Else";
			var group2Name = "";
			var group2Config = [];

			if (isGroup2EverythingElse) {
				group2Name = "NOT " + cardData.groupNamesOnShelves["top"];
				group2Config = cardData.configOnShelves["top"];
			}
			else {
				group2Name = cardData.groupNamesOnShelves["bottom"];
				group2Config = cardData.configOnShelves["bottom"];
			}
			
			// store
			var group1Info = { name: group1Name, config: group1Config, everythingElse: isGroup1EverythingElse };
			var group2Info = { name: group2Name, config: group2Config, everythingElse: isGroup2EverythingElse };

			return {
				group1: group1Info,
				group2: group2Info
			};
		}

		function getAttrToBeStoredOrRemoved(clickedEl) {
			var parentCardEl = $(clickedEl).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();
			var clickedAttributeName = $(clickedEl).text();
			var probabilityDistributionsStoreToLink = {};
			probabilityDistributionsStoreToLink[clickedAttributeName] = cardData.probabilityDistribution[clickedAttributeName];

			return probabilityDistributionsStoreToLink;
		}
	},
	setFrontClickableHighlight: function(cardEl) {
		// get nodeInfo
		var cardData = d3.select(cardEl).datum();
		var isGroup1EverythingElse = cardData.configOnShelves["top"][0] == "Everything Else";
		var group1Config = isGroup1EverythingElse ? cardData.configOnShelves["bottom"] : cardData.configOnShelves["top"];
		var clickableNode1Info = { config: group1Config, everythingElse: isGroup1EverythingElse };
		var isGroup2EverythingElse = cardData.configOnShelves["bottom"][0] == "Everything Else";
		var group2Config = isGroup2EverythingElse ? cardData.configOnShelves["top"] : cardData.configOnShelves["bottom"];
		var clickableNode2Info = { config: group2Config, everythingElse: isGroup2EverythingElse };
		
		// get linkID
		var node1ID = GraphStructure.getNodeID(clickableNode1Info, true);
		var node2ID = GraphStructure.getNodeID(clickableNode2Info, true);
		var linkID = GraphStructure.getLinkID(node1ID, node2ID);

		// remove selected class
		$(cardEl).find(".front .clickable").removeClass("selected");

		// add the class back
		if (linkID in GraphStructure.linkInfoDict) {
			$(cardEl).find(".front .clickable").each(function() {
				var currentAttr = $(this).text();
				var similarOrDifferent = Card.ClickableAttr.getSimilarOrDifferent(this);

				if (similarOrDifferent in GraphStructure.linkInfoDict[linkID])
					if (currentAttr in GraphStructure.linkInfoDict[linkID][similarOrDifferent])
						$(this).addClass("selected");
			});
		}
	},
	drawAttributeList: function() {
		Card.AttributeList.drawContainer(true); // draw neither similar nor different attributes
		Card.AttributeList.drawHeaders();
		Card.AttributeList.drawContents();
	},
	initBackClickInfoBehaviour: function(cardEl) {
		Card.Back.initClickInfoBehaviour(cardEl);
	},
	setBackClickableHighlight: function(cardEl) {
		Card.Back.setClickableHighlight["TwoGroups"](cardEl)
	}
}