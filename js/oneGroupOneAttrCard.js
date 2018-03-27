var OneGroupOneAttrCard = {
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
		self.initMouseenterGroupBehaviour(self.newCardEl);
		self.initFrontClickInfoBehaviour(self.newCardEl);
		self.setFrontClickableHighlight(self.newCardEl);
		self.adjustHeight();

		// attribute list (back)
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
		Card.bindData(OneGroupOneAttrOperator);
	},
	displaySummaryDesc: function() {
		var summaryDesc = TextGenerator.generateSummary["oneGroupOneAttr"](this.newCardData);
		Card.SummaryDescription.display(summaryDesc);
	},
	adjustHeight: function() {
		var self = this;
		var cardHeight = $(self.newCardEl).find(".front").height();
		$(self.newCardEl).css("height", cardHeight);
	},
	initMoreButton: function() {
		var self = this;

		// create event
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
				toolTipText = cardData[similarOrDifferent + "Groups"].length > Card.numberOfItemsShown // list too long 
		                    ? "There are " + cardData[similarOrDifferent + "Groups"].length + " " + similarOrDifferent + " groups. Click to show all."
		                    : "There are " + cardData[similarOrDifferent + "Groups"].length + " " + similarOrDifferent + " groups.";
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
			var groupList = cardData[similarOrDifferent + "Groups"];

			// expand
			if (!$(this).hasClass("expanded")) {
				// change description
				var fullGroupList = TextGenerator.generateLongListContentHTML(groupList);
				$(this).parent().find(".groups").html(fullGroupList);
				self.initMouseenterGroupBehaviour(parentCardEl, similarOrDifferent);
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
				// change text
				var shortGroupList = TextGenerator.generateShortListContentHTML(groupList);
				$(this).parent().find(".groups").html(shortGroupList);
				self.initMouseenterGroupBehaviour(parentCardEl, similarOrDifferent);
				self.initFrontClickInfoBehaviour(parentCardEl);
				self.setFrontClickableHighlight(parentCardEl);

				// change button text and hide tooltip
				$(this).removeClass("expanded");
				$(this).parent().find(".and").css("display", "");
				$(this).html((cardData[similarOrDifferent + "Groups"].length - Card.numberOfItemsShown) + " more");
				$("#tooltip").removeClass("show");
			}
		}
	},
	initBottomButtons: function() {
		Card.initFlipCardBehaviour();
		Card.initRemoveButton();
	},
	initMouseenterGroupBehaviour: function(cardEl, similarOrDifferent = null) {
		var similarOrDifferentClassName = similarOrDifferent ?  " ." + similarOrDifferent : "";

		$(cardEl).find(".front" + similarOrDifferentClassName + " .groups span")
			.mouseenter(function() {
				var parentCardEl = $(this).closest(".card")[0];
				var cardData = d3.select(parentCardEl).datum();
				var groupName = $(this).text();
				var cardPosition = $(parentCardEl).offset();
				var barChartData = cardData.probabilityDistributions[groupName];
				var numberOfBarCharts = Object.keys(barChartData).length;

				SystemReasoningPanel.clear();
				SystemReasoningPanel["MultipleCharts"].show(numberOfBarCharts);
				SystemReasoningPanel["MultipleCharts"].renderBarCharts(cardData, groupName);
				SystemReasoningPanel["MultipleCharts"].showDescriptions(cardData, groupName);
				SystemReasoningPanel.move(cardPosition.top - 10, cardPosition.left - 10);
			});

		$(cardEl).find(".front" + similarOrDifferentClassName + " .groups span")
			.mouseleave(function() {
				SystemReasoningPanel.hide();
			});
	},
	initFrontClickInfoBehaviour: function(cardEl) { // changing text appearance by adding class and adding click behaviour
		// set clickabale class
		// unbind click to prevent multiple binding on click more
		$(cardEl).find(".front .groups span")
			.each(function() {
				var similarIsParent = $(this).closest("span.similar").length != 0;

				if (similarIsParent)
					$(this).addClass("clickable s").unbind("click");
				if (!similarIsParent)
					$(this).addClass("clickable d").unbind("click");
			});

		Card.ClickableAttr.initClick(cardEl, "front", getGroupConfigAndNames, getAttrToBeStoredOrRemoved);

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

			var group1Info = { name: group1Name, config: group1Config, everythingElse: false };
			var group2Info = { name: group2Name, config: group2Config, everythingElse: false }; // only one group, must not be everything else

			return {
				group1: group1Info,
				group2: group2Info
			};
		}

		function getAttrToBeStoredOrRemoved(clickedEl) {
			var parentCardEl = $(clickedEl).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();
			var clickedGroupName = $(clickedEl).text();
			var probabilityDistributionsStoreToLink = cardData.probabilityDistributions[clickedGroupName];

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
			var attributesOnShelves = cardData.probabilityDistributions[group2Name];
			var linkID = GraphStructure.getLinkID(node1ID, node2ID);

			if (linkID in GraphStructure.linkInfoDict) {
				if (similarOrDifferent in GraphStructure.linkInfoDict[linkID]) {
					var allAttributeOnShelvesInLink = true;

					for (var currentAttr in attributesOnShelves)
						if (!(currentAttr in GraphStructure.linkInfoDict[linkID][similarOrDifferent]))
							allAttributeOnShelvesInLink = false;
					if (allAttributeOnShelvesInLink)
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