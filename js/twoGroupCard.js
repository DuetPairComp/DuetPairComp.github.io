var TwoGroupCard = {
	newCardData: null, // for initializing card content
	newCardEl: null,

	draw: function() {
		var self = this;

		Card.setCard(self);
		self.add();
		self.bindData();

		// summary description (front)
		self.displaySummaryDesc();
		self.initMoreButton();
		self.initBottomButtons();
		self.initMouseenterAttrBehaviour(self.newCardEl);
		self.initMouseenterSimilarAndDifferentText();
		self.initFrontClickInfoBehaviour(self.newCardEl);
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
		Card.bindData(TwoGroupOperator);
	},
	displaySummaryDesc: function() {
		var summaryDesc = TextGenerator.generateSummary["twoGroup"](this.newCardData);
		Card.SummaryDescription.display(summaryDesc);
	},
	adjustHeight: function() {
		var self = this;
		var cardHeight = $(self.newCardEl).find(".front").height();
		$(self.newCardEl).css("height", cardHeight);
	},
	initMoreButton: function() {
		var self = this;

		$(self.newCardEl).find(".front .more").mouseenter(mouseenterMoreButton);
		$(self.newCardEl).find(".front .more").mouseleave(mouseleaveMoreButton);
		$(self.newCardEl).find(".front .more").click(clickMoreButton);

		function mouseenterMoreButton() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();
			var similarOrDifferent = $(this).attr("similarOrDifferent");
			var parentCardEl = $(this).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();

			// set attribute text
			var toolTipText = ""
			if (!$(this).hasClass("expanded"))
				toolTipText = cardData[similarOrDifferent + "Attr"].length > Card.numberOfItemsShown // list too long 
		                    ? "There are " + cardData[similarOrDifferent + "Attr"].length + " " + similarOrDifferent + " attributes. Click to show all."
		                    : "There are " + cardData[similarOrDifferent + "Attr"].length + " " + similarOrDifferent + " attributes.";
			else 
				toolTipText = "Hide some attributes.";
			
			$("#tooltip").attr("data-tooltip", toolTipText);

			// show tooltip
			$("#tooltip")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2 + 5)
				.addClass("show");
		}

		function mouseleaveMoreButton() {
			$("#tooltip").removeClass("show");
		}

		function clickMoreButton() {
			var similarOrDifferent = $(this).attr("similarOrDifferent");
			var parentCardEl = $(this).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();
			var attributeList = cardData[similarOrDifferent + "Attr"];

			// expand
			if (!$(this).hasClass("expanded")) {
				// change description
				var fullAttributeList = TextGenerator.generateLongListContentHTML(attributeList);
				$(this).parent().find(".attributes").html(fullAttributeList);
				self.initMouseenterAttrBehaviour(parentCardEl, similarOrDifferent);
				self.initFrontClickInfoBehaviour(parentCardEl);
				self.setFrontClickableHighlight(parentCardEl);

				// change button text and hide tooltip
				$(this).addClass("expanded");
				$(this).parent().find(".and").css("display", "none");
				$(this).html("hide");
				$("#tooltip").removeClass("show");
			}
				
			// collapse
			else {
				// change description
				var shortAttributeList = TextGenerator.generateShortListContentHTML(attributeList);
				$(this).parent().find(".attributes").html(shortAttributeList);
				self.initMouseenterAttrBehaviour(parentCardEl, similarOrDifferent);
				self.initFrontClickInfoBehaviour(parentCardEl);
				self.setFrontClickableHighlight(parentCardEl);

				// change button text and hide tooltip
				$(this).removeClass("expanded");
				$(this).parent().find(".and").css("display", "");
				$(this).html((cardData[similarOrDifferent + "Attr"].length - Card.numberOfItemsShown) + " more");
				$("#tooltip").removeClass("show");
			}
		}
	},
	initBottomButtons: function() {
		Card.initFlipCardBehaviour();
		Card.initRemoveButton();
	},
	initMouseenterAttrBehaviour: function(cardEl, similarOrDifferent = null) {
		var similarOrDifferentClassName = similarOrDifferent ?  " ." + similarOrDifferent : "";

		$(cardEl).find(".front" + similarOrDifferentClassName + " .attributes span")
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

		$(cardEl).find(".front" + similarOrDifferentClassName + " .attributes span")
			.mouseleave(function() {
				SystemReasoningPanel.hide();
			});
	},
	initMouseenterSimilarAndDifferentText: function() {
		var self = this;

		$(self.newCardEl).find(".front .similar-text").mouseenter(mouseenterSimilarDifferentText);
		$(self.newCardEl).find(".front .similar-text").mouseleave(mouseleaveSimilarDifferentText);
		$(self.newCardEl).find(".front .different-text").mouseenter(mouseenterSimilarDifferentText);
		$(self.newCardEl).find(".front .different-text").mouseleave(mouseleaveSimilarDifferentText);

		function mouseenterSimilarDifferentText() {
			var parentCardEl = $(this).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();
			var hoveredText = $(this).text();
			var cardPosition = $(parentCardEl).offset();
			var data = { similarOrDifferent: hoveredText };

			SystemReasoningPanel.clear();
			SystemReasoningPanel["AttrCount"].show();
			SystemReasoningPanel["AttrCount"].showDescription(cardData, "twoGroups", data);
			SystemReasoningPanel.move(cardPosition.top - 10, cardPosition.left - 10);
		}

		function mouseleaveSimilarDifferentText() {
			SystemReasoningPanel.hide();
		}
	},
	// changing text appearance by adding class and adding click behaviour
	initFrontClickInfoBehaviour: function(cardEl) {
		// set clickabale class
		// unbind click to prevent multiple binding on click more
		$(cardEl).find(".front .similar-text")
			.addClass("clickable s")
			.unbind("click");
		$(cardEl).find(".front .different-text")
			.addClass("clickable d")
			.unbind("click");
		$(cardEl).find(".front .attributes span")
			.each(function() {
				var similarIsParent = $(this).closest("span.similar").length != 0;

				if (similarIsParent)
					$(this).addClass("clickable s").unbind("click");
				if (!similarIsParent)
					$(this).addClass("clickable d").unbind("click");
			});

		// add click event
		Card.ClickableAttr.initClick(cardEl, "front", getGroupConfigAndNames, getAttrToBeStoredOrRemoved);

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
			var probabilityDistributionsStoreToLink = {};

			if ($(clickedEl).hasClass("similar-text")) {
				for (var i = 0; i < cardData.similarAttr.length; i++) {
					var currentSimilarAttr = cardData.similarAttr[i];
					probabilityDistributionsStoreToLink[currentSimilarAttr] = cardData.probabilityDistribution[currentSimilarAttr];
				}
			}
			else if ($(clickedEl).hasClass("different-text")) {
				for (var i = 0; i < cardData.differentAttr.length; i++) {
					var currentDifferentAttr = cardData.differentAttr[i];
					probabilityDistributionsStoreToLink[currentDifferentAttr] = cardData.probabilityDistribution[currentDifferentAttr];
				}
			}
			else {
				var clickedAttributeName = $(clickedEl).text();
				probabilityDistributionsStoreToLink[clickedAttributeName] = cardData.probabilityDistribution[clickedAttributeName];
			}

			
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
				if ($(this).hasClass("similar-text")) {
					if ("similar" in GraphStructure.linkInfoDict[linkID]) {
						var totalSimilarAttrCount = cardData.similarAttr.length;
						var similarAttrInLinkCount = Object.keys(GraphStructure.linkInfoDict[linkID]["similar"]).length;
						var sameAttributeCount = totalSimilarAttrCount == similarAttrInLinkCount;

						if (sameAttributeCount)
							$(this).addClass("selected");
					}
				}
				else if ($(this).hasClass("different-text")) {
					if ("different" in GraphStructure.linkInfoDict[linkID]) {
						var totalDifferentAttrCount = cardData.differentAttr.length;
						var differentAttrInLinkCount = Object.keys(GraphStructure.linkInfoDict[linkID]["different"]).length;
						var sameAttributeCount = totalDifferentAttrCount == differentAttrInLinkCount;

						if (sameAttributeCount)
							$(this).addClass("selected");
					}
				}
				else { // normal attribute
					var currentAttr = $(this).text();
					var similarOrDifferent = Card.ClickableAttr.getSimilarOrDifferent(this);

					if (similarOrDifferent in GraphStructure.linkInfoDict[linkID])
						if (currentAttr in GraphStructure.linkInfoDict[linkID][similarOrDifferent])
							$(this).addClass("selected");
				}
			});
		}
	},
	drawAttributeList: function() {
		Card.AttributeList.drawContainer();
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