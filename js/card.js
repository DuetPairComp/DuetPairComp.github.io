var Card = {
	currentCard: null,
	numberOfItemsShown: 3,

	draw: function() {
		var self = this;
		var topShelfOccupied = ComparisonShelves.configOnShelves["top"].length != 0;
		var attributeShelfOccupied = ComparisonShelves.configOnShelves["attribute"].length != 0;
		var bottomShelfOccupied = ComparisonShelves.configOnShelves["bottom"].length != 0;
		var bothShelvesHaveSameConfig = SameCard.isExactlyTheSameConfig(ComparisonShelves.configOnShelves);
		var atLeastOneShelfHaveNoObjects = NoObjectsCard.atLeastOneShelfHaveNoObjects(ComparisonShelves.configOnShelves);

		// draw exception cards
		if (topShelfOccupied && bottomShelfOccupied && bothShelvesHaveSameConfig) {
			SameCard.draw();
			return;
		}
		if (atLeastOneShelfHaveNoObjects) {
			NoObjectsCard.draw();
			return;
		}

		// draw more meaningful cards
		if (topShelfOccupied && bottomShelfOccupied && attributeShelfOccupied) {
			TwoGroupOneAttrOperator.compute();
			TwoGroupOneAttrCard.draw();
		}
		else if (topShelfOccupied && bottomShelfOccupied) {
			TwoGroupOperator.compute();
			TwoGroupCard.draw();
		}
		else if (topShelfOccupied && attributeShelfOccupied || bottomShelfOccupied && attributeShelfOccupied) {
			OneGroupOneAttrOperator.compute();
			OneGroupOneAttrCard.draw();
		}
		else if (topShelfOccupied || bottomShelfOccupied) {
			OneGroupOperator.compute();
			OneGroupCard.draw();
		}

		// show everything else if needed
		if (topShelfOccupied || bottomShelfOccupied)
			DataTable.showFooter();
		else
			DataTable.hideFooter();
	},
	removeAll: function() {
		$("#comparison-panel .results .card").remove();
	},
	resetAllClickableHighLights: function() {
		$("#comparison-panel .results .card:not(.same)")
			.each(function() {
				var cardData = d3.select(this).datum();
				var topShelfOccupied = cardData.configOnShelves["top"].length != 0;
				var attributeShelfOccupied = cardData.configOnShelves["attribute"].length != 0;
				var bottomShelfOccupied = cardData.configOnShelves["bottom"].length != 0;

				if (topShelfOccupied && bottomShelfOccupied && attributeShelfOccupied) {
					TwoGroupOneAttrCard.setFrontClickableHighlight(this);
					TwoGroupOneAttrCard.setBackClickableHighlight(this);
				}
				else if (topShelfOccupied && bottomShelfOccupied) {
					TwoGroupCard.setFrontClickableHighlight(this);
					TwoGroupCard.setBackClickableHighlight(this);
				}
				else if (topShelfOccupied && attributeShelfOccupied || bottomShelfOccupied && attributeShelfOccupied) {
					OneGroupOneAttrCard.setFrontClickableHighlight(this);
					OneGroupOneAttrCard.setBackClickableHighlight(this);
				}
				else if (topShelfOccupied || bottomShelfOccupied)  {
					OneGroupCard.setFrontClickableHighlight(this);
					OneGroupCard.setBackClickableHighlight(this);
				}
			});
	},
	setCard: function(card) {
		var self = this;

		self.currentCard = card;
	},
	addCardHTML: function(cardHTML) {
		var self = this;
		var card = self.currentCard;
		var firstChildHasSelectedClickable = $("#comparison-panel .results .card:first-child").find(".clickable.selected").length != 0;
		var result = ComparisonShelves.previousConfigIsSubsetOfNewConfig();
		var isPreviousConfigSubsetOfNewConfig = result.isPreviousSubsetOfNew;
		var isPreviousConfigSameAsNewConfig = result.isPreviousSameAsNew;
		var needReplacement = (isPreviousConfigSubsetOfNewConfig && !firstChildHasSelectedClickable) || isPreviousConfigSameAsNewConfig;

		// remove previous card for replacement
		if (needReplacement)
			$("#comparison-panel .results .card:first-child").remove();
		$("#comparison-panel .results .card.no-objects").remove();
		$("#comparison-panel .results .card.same").remove();

		// scroll to top and slowly display the card
		$("#comparison-panel .results")
			.scrollTop(0);
		$("#comparison-panel .results")
			.prepend(cardHTML);
		$("#comparison-panel .results .card:first-child")
			.resizable({ handles: "s" });
		$("#comparison-panel .results .card:first-child")
			.fadeIn("slow");

		// store the new card element
		card.newCardEl = $("#comparison-panel .results .card:first-child")[0];
	},
	bindData: function(operator) {
		var self = this;
		var card = self.currentCard;

		var computationResult = operator.getResults();
		var configOnShelves = ComparisonShelves.getConfigurations();
		var groupNamesOnShelves = ComparisonShelves.getGroupNames();
		computationResult.configOnShelves = configOnShelves;
		computationResult.groupNamesOnShelves = groupNamesOnShelves;

		d3.select(card.newCardEl)
			.datum(computationResult); // for retrieving

		card.newCardData = computationResult; // for initializing
	},
	initFlipCardBehaviour: function() {
		var self = this;
		var card = self.currentCard;

		$(card.newCardEl).find(".fa-exchange").click(function() {
			var parentCardEl = $(this).closest(".card")[0];

			// change tooltip text (users' mouse on tooltip)
			if ($(parentCardEl).find(".front").hasClass("active"))
				$("#tooltip").attr("data-tooltip", "Flip to See Summary");
			else
				$("#tooltip").attr("data-tooltip", "Flip to See Details");

			// flip and highlight text
			flip($(parentCardEl));
		});

		$(card.newCardEl).find(".fa-exchange").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();
			var parentCardEl = $(this).closest(".card")[0];

			// set attribute text
			if ($(parentCardEl).find(".front").hasClass("active"))
				$("#tooltip").attr("data-tooltip", "Flip to See Details");
			else
				$("#tooltip").attr("data-tooltip", "Flip to See Summary");

			// show tooltip
			$("#tooltip")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$(card.newCardEl).find(".fa-exchange").mouseleave(function() {
			$("#tooltip")
				.removeClass("show");
		});
	},
	initRemoveButton: function() {
		var self = this;
		var card = self.currentCard;

		$(card.newCardEl).find(".fa-remove").click(function() {
			var parentCardEl = $(this).closest(".card")[0];
			$(parentCardEl).remove();
			$("#tooltip").removeClass("show");
		});

		$(card.newCardEl).find(".fa-remove").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();
			var parentCardEl = $(this).closest(".card")[0];

			// set attribute text
			$("#tooltip").attr("data-tooltip", "Remove Card");

			// show tooltip
			$("#tooltip")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$(card.newCardEl).find(".fa-remove").mouseleave(function() {
			$("#tooltip").removeClass("show");
		});
	},
	Back: {
		initClickInfoBehaviour: function(cardEl) {
			var self = Card;

			// set clickabale class
			$(cardEl).find(".back .similar.content .attribute")
				.addClass("clickable s")
				.unbind("click");
			$(cardEl).find(".back .different.content .attribute")
				.addClass("clickable d")
				.unbind("click");

			// add click event
			Card.ClickableAttr.initClick(cardEl, "back", Card.Back.getGroupConfigAndNames, Card.Back.getAttrStoreToLink);
		},
		getGroupConfigAndNames: function(clickedEl) {
			var parentCardEl = $(clickedEl).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();

			// modify the card data for attribute which belongs to groups
			var isAttributeListOfGroup = "similarGroups" in cardData;
			if (isAttributeListOfGroup)
				cardData = Helper.convertOneGroupCardDataToTwoGroupCardData(cardData, clickedEl);
			
			// get group 1 info
			var isGroup1EverythingElse = cardData.configOnShelves["top"][0] == "Everything Else";
			var group1Name = "";
			var group1Config = [];
			if (isGroup1EverythingElse) {
				group1Name = "NOT " + cardData.groupNamesOnShelves["bottom"];
				group1Config = cardData.configOnShelves["bottom"];
			}
			if (!isGroup1EverythingElse) {
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
			if (!isGroup2EverythingElse) {
				group2Name = cardData.groupNamesOnShelves["bottom"];
				group2Config = cardData.configOnShelves["bottom"];
			}
			
			// store and return
			var group1Info = { name: group1Name, config: group1Config, everythingElse: isGroup1EverythingElse };
			var group2Info = { name: group2Name, config: group2Config, everythingElse: isGroup2EverythingElse };
			return { group1: group1Info, group2: group2Info };
		},
		getAttrStoreToLink: function(clickedEl) {
			var parentCardEl = $(clickedEl).closest(".card")[0];
			var cardData = d3.select(parentCardEl).datum();
			var probabilityDistributionsStoreToLink = {};
			var clickedAttributeName = d3.select(clickedEl).datum();

			// modify the card data for attribute which belongs to groups
			var isAttributeListOfGroup = "similarGroups" in cardData;
			if (isAttributeListOfGroup)
				cardData = Helper.convertOneGroupCardDataToTwoGroupCardData(cardData, clickedEl);

			// get probability distribution of the selected attribute
			probabilityDistributionsStoreToLink[clickedAttributeName] = cardData.probabilityDistribution[clickedAttributeName];
			return probabilityDistributionsStoreToLink;
		},
		setClickableHighlight: {
			OneGroup: function(cardEl) {
				// remove selected class
				$(cardEl).find(".back .clickable").removeClass("selected");

				// add the class back
				$(cardEl).find(".back .attributes").each(function() {
					var oldCardData = d3.select(cardEl).datum();
					var cardData = Helper.convertOneGroupCardDataToTwoGroupCardData(oldCardData, this);
					
					// get nodeInfo
					var isGroup1EverythingElse = cardData.configOnShelves["top"][0] == "Everything Else";
					var group1Config = isGroup1EverythingElse ? cardData.configOnShelves["bottom"] : cardData.configOnShelves["top"];
					var clickableNode1Info = { config: group1Config, everythingElse: isGroup1EverythingElse };
					var isGroup2EverythingElse = cardData.configOnShelves["bottom"][0] == "Everything Else";
					var group2Config = isGroup2EverythingElse ? cardData.configOnShelves["top"] : cardData.configOnShelves["bottom"];
					var clickableNode2Info = { config: group2Config, everythingElse: isGroup2EverythingElse };
					
					// get linkID from nodeInfo
					var node1ID = GraphStructure.getNodeID(clickableNode1Info, true);
					var node2ID = GraphStructure.getNodeID(clickableNode2Info, true);
					var linkID = GraphStructure.getLinkID(node1ID, node2ID);

					if (linkID in GraphStructure.linkInfoDict) {
						$(this).find(".clickable").each(function() {
							var currentAttr = d3.select(this).datum();
							var similarOrDifferent = Card.ClickableAttr.getSimilarOrDifferent(this);

							if (similarOrDifferent in GraphStructure.linkInfoDict[linkID])
								if (currentAttr in GraphStructure.linkInfoDict[linkID][similarOrDifferent])
									$(this).addClass("selected");
						});
					}
				});
			},
			TwoGroups: function(cardEl) {
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
				$(cardEl).find(".back .clickable").removeClass("selected");

				// add the class back
				if (linkID in GraphStructure.linkInfoDict) {
					$(cardEl).find(".back .clickable").each(function() {
						var currentAttr = d3.select(this).datum();
						var similarOrDifferent = Card.ClickableAttr.getSimilarOrDifferent(this);

						if (similarOrDifferent in GraphStructure.linkInfoDict[linkID])
							if (currentAttr in GraphStructure.linkInfoDict[linkID][similarOrDifferent])
								$(this).addClass("selected");
					});
				}
			}
		}
	},
	SummaryDescription: {
		display: function(summaryDesc) {
			var self = Card;
			var card = self.currentCard;

			$(card.newCardEl).find(".front")
				.html(summaryDesc);
		}
	},
	ClickableAttr: {
		initClick: function(cardEl, frontOrBack, getGroupConfigAndNames, getAttrToBeStoredOrRemoved) {
			var self = Card;

			$(cardEl).find("." + frontOrBack + " .clickable")
				.click(function() {
					var groupInfo = getGroupConfigAndNames(this);
					var attributeInfo = getAttrToBeStoredOrRemoved(this);
					var node1Info = groupInfo.group1;
					var node2Info = groupInfo.group2;
					var similarOrDifferent = self.ClickableAttr.getSimilarOrDifferent(this);

					SystemReasoningPanel.hide();

					// redraw
					var removeAttribute = $(this).hasClass("selected");
					var isRadialLayout = !d3.select(".node.selected").empty();
					var centreNodeID = isRadialLayout ? d3.select(".node.selected").datum().nodeID : null;
					var messageInfo = {
						linkID: null,
						similarOrDifferent: similarOrDifferent,
						numberOfAttributes: Object.keys(attributeInfo).length,
						removeAttribute: removeAttribute
					};

					if (!removeAttribute) { // add
						GraphStructure.addToAdjMatrix(node1Info, node2Info);
						var messageInfoUpdates = GraphStructure.addAttrToLink(node1Info, node2Info, attributeInfo, similarOrDifferent);
						messageInfo.linkID = messageInfoUpdates.linkID;
						messageInfo.numberOfAttributes = messageInfoUpdates.numberOfAttrChanged;
						GraphStructure.updateSimilarity();
						GraphStructure.updateNodeData(centreNodeID);
						GraphStructure.updateLinkData(centreNodeID);
						GraphVisualizer.Message.remove();
						GraphVisualizer.Link.update(messageInfo);
						GraphVisualizer.Node.update();
						StoredAttributesPanel.updateOnLinkUpdate(messageInfo);
					}
					if (removeAttribute) {
						var messageInfoUpdates = GraphStructure.removeAttrFromLink(node1Info, node2Info, attributeInfo, similarOrDifferent);
						messageInfo.linkID = messageInfoUpdates.linkID;
						messageInfo.numberOfAttributes = messageInfoUpdates.numberOfAttrChanged;
						messageInfo = (messageInfo.linkID == null) ? null : messageInfo;
						centreNodeID = (centreNodeID in GraphStructure.adjacencyMatrix) ? centreNodeID : null;
						GraphStructure.updateSimilarity();
						GraphStructure.updateNodeData(centreNodeID);
						GraphStructure.updateLinkData(centreNodeID);
						GraphVisualizer.Message.remove();
						GraphVisualizer.Link.update(messageInfo);
						GraphVisualizer.Node.update();
						StoredAttributesPanel.updateOnLinkUpdate(messageInfo);
					}
				});
		},
		getSimilarOrDifferent: function(clickableEl) {
			var similarOrDifferent = "";

			if ($(clickableEl).hasClass("s"))
				similarOrDifferent = "similar";
			else if ($(clickableEl).hasClass("d"))
				similarOrDifferent = "different";
			else if ($(clickableEl).hasClass("n"))
				similarOrDifferent = "neitherSimilarNorDifferent";

			return similarOrDifferent;
		}
	},
	GroupList: {
		Header: { marginLeft: 0, height: 30 },
		Group: { height: 28, margin: { left: 8, right: 10 } },

		drawContainer: function() {
			var self = Card;
			var card = self.currentCard;

			var similarGroupLength = card.newCardData.similarGroups.length;
			var differentGroupLength = card.newCardData.differentGroups.length;

			// has similar groups
			if (similarGroupLength != 0) {
				var headerHTML = "<div class='similar header expanded'><svg></svg></div>";
				var contentHTML = "<div class='similar content'></div>";

				$(card.newCardEl).find(".back").append(headerHTML);
				$(card.newCardEl).find(".back").append(contentHTML);
			}

			// has different groups
			if (differentGroupLength != 0) {
				var headerHTML = "<div class='different header expanded'><svg></svg></div>";
				var contentHTML = "<div class='different content'></div>";

				$(card.newCardEl).find(".back").append(headerHTML);
				$(card.newCardEl).find(".back").append(contentHTML);
			}
		},
		drawHeaders: function() {
			var self = Card;
			var card = self.currentCard;
			var isOneGroup = "similarAttr" in card.newCardData || "differentAttr" in card.newCardData;
			var similarGroupHeaderText = isOneGroup ? "Most Similar Groups" : "Similar Groups";
			var differentGroupHeaderText = isOneGroup ? "Most Different Groups" : "Different Groups";
			var similarGroupCaretX = isOneGroup ? 120 : 93;
			var differentGroupCaretX = isOneGroup ? 127 : 101;

			// draw the structure
			d3.select(card.newCardEl).selectAll(".back .header svg").each(function() {
				var header = d3.select(this).append("g")
					.style("cursor", "pointer")
					.on("click", clickHeader);
				header.append("rect") // background rect
					.attr("x", 0)
					.attr("y", 0)
					.attr("width", full)
					.attr("height", full)
					.style("fill", "white");
				var headerText = header.append("text")
					.attr("x", self.GroupList.Header.marginLeft)
					.attr("y", self.GroupList.Header.height / 2)
					.style("alignment-baseline", "middle")
					.style("font-weight", "bold")
				header.append("text")
					.attr("class", "caret")
					.attr("y", self.GroupList.Header.height / 2 + 3)
					.style("text-anchor", "start")
					.style("font-family", "FontAwesome")
					.text("\uf0d8");
			});

			// change text for and caret x for each type of attributes
			if (!d3.select(card.newCardEl).select(".similar.header").empty()) {
				d3.select(card.newCardEl).select(".similar.header svg text")
					.text(similarGroupHeaderText);
				d3.select(card.newCardEl).select(".similar.header svg .caret")
					.attr("x", similarGroupCaretX);
			}
			if (!d3.select(card.newCardEl).select(".different.header").empty()) {
				d3.select(card.newCardEl).select(".different.header svg text")
					.text(differentGroupHeaderText);
				d3.select(card.newCardEl).select(".different.header svg .caret")
					.attr("x", differentGroupCaretX);
			}

			function clickHeader() {
				var parentHeader = $(this).closest(".header");

				if (parentHeader.hasClass("expanded")) {
					parentHeader.removeClass("expanded");
					d3.select(this).select(".caret").text("\uf0d7");
				}
				else {
					parentHeader.addClass("expanded");
					d3.select(this).select(".caret").text("\uf0d8");
				}
			}
		},
		drawContents: function() {
			var self = Card;
			var card = self.currentCard;

			// get data
			var similarGroupList = card.newCardData.similarGroups;
			var differentGroupList = card.newCardData.differentGroups;

			// draw similar
			if (!d3.select(card.newCardEl).select(".similar.content").empty()) {
				// append html
				var HTML = "";
				for (var i = 0; i < similarGroupList.length; i++)
					HTML += "<div class='group-group'><svg></svg></div>"
				$(card.newCardEl).find(".similar.content")
					.html(HTML);

				// set svg height
				d3.select(card.newCardEl).selectAll(".similar.content svg")
					.attr("height", self.GroupList.Group.height);

				// draw groups
				self.GroupList.drawGroupNames("similar", similarGroupList);
			}

			// draw different
			if (!d3.select(card.newCardEl).select(".different.content").empty()) {
				// append html
				var HTML = "";
				for (var i = 0; i < differentGroupList.length; i++)
					HTML += "<div class='group-group'><svg></svg></div>"
				$(card.newCardEl).find(".different.content")
					.html(HTML);

				// set svg height
				d3.select(card.newCardEl).selectAll(".different.content svg")
					.attr("height", self.GroupList.Group.height);

				// draw groups
				self.GroupList.drawGroupNames("different", differentGroupList);
			}
		},
		drawGroupNames: function(className, list) {
			var self = Card;
			var card = self.currentCard;
			var rowWidth = $(card.newCardEl).width() - self.GroupList.Group.margin.left - self.GroupList.Group.margin.right;
			var allSVG = d3.select(card.newCardEl).selectAll(".back .content" + "." + className + " svg");
			var attributeListName = (className == "similar") ? "similarAttr" : "differentAttr";
			var isOneGroup = attributeListName in card.newCardData;
			
			// append the group
			var groupGroups = allSVG.append("g")
				.data(list)
				.attr("class", "group")
				.attr("transform", function(d, i) {
					return "translate(" + self.GroupList.Group.margin.left + ", 0)";
				})
				.style("cursor", "pointer")
				.on("mouseenter", mouseenterGroupName)
				.on("mouseleave", mouseleaveGroupName)
				.on("click", clickGroupName);

			// draw background rect
			groupGroups.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", rowWidth)
				.attr("height", self.GroupList.Group.height)
				.style("fill", "white");

			// draw number of similar or different attributes if has similar/diff attr
			groupGroups.each(function(d) {
				var groupName = d;
				var attributeCount = isOneGroup ? card.newCardData[attributeListName][groupName].length : card.newCardData.configOnShelves.attribute.length;
				var attributeText = (attributeCount > 1) ? "attributes" : "attribute";
				var text = attributeCount + " " + className + " " + attributeText;

				var countText = d3.select(this).append("text")
					.attr("class", "count")
					.attr("x", rowWidth / 2 + 15)
					.attr("y", self.GroupList.Group.height / 2)
					.attr("alignment-baseline", "middle")
					.style("font-family", "Arial")
					.style("font-size", "11px")
					.text(text);
			});

			// draw group name
			groupGroups.append("text")
				.attr("class", "name")
				.attr("x", 0)
				.attr("y", self.GroupList.Group.height / 2)
				.attr("alignment-baseline", "middle")
				.text(function(d) {
					var textLength = 20;
					var shortGroupName = Helper.createShortString(d, textLength);
					return shortGroupName;
				});

			function mouseenterGroupName(d) {
				// show full name
				var originalText = d3.select(this).select("text.name")
					.text();
				var text = d3.select(this).select("text.name")
					.attr("short-group-name", originalText)
					.text(d);

				var bbox = text.node().getBBox();
				d3.select(this).insert("rect", "text.name")
					.attr("class", "name")
					.attr("x", bbox.x - 5)
					.attr("y", 0)
					.attr("width", bbox.width + 10)
					.attr("height", self.GroupList.Group.height)
					.style("fill", "white");

				// set tooltip text
				var parentCardEl = $(this).closest(".card")[0];
				var cardData = d3.select(parentCardEl).datum();
				var text = (cardData.similarGroups.indexOf(d) != -1) ? "Click to See Similar Attributes" : "Click to See Different Attributes";
				text = d3.select(this).classed("expanded") ? "Click to Hide Attribute List" : text;
				$("#tooltip").attr("data-tooltip", text);

				// show tooltip
				var bbox = this.getBoundingClientRect();
				$("#tooltip")
					.css("top", bbox.top + bbox.height / 2 - 3)
					.css("left", bbox.left + bbox.width + 5)
					.addClass("show right");
			}	

			function mouseleaveGroupName(d) {
				// show short name
				var originalText = d3.select(this).select("text.name")
					.attr("short-group-name");
				d3.select(this).select("text.name")
					.text(originalText);

				d3.select(this).select("rect.name").remove();

				// remove tooltip
				$("#tooltip").removeClass("show");
			}

			function clickGroupName(d) {
				var parentCardEl = $(this).closest(".card")[0];
				var cardData = d3.select(parentCardEl).datum();

				if (!d3.select(this).classed("expanded")) {
					d3.select(this).classed("expanded", true);
					$("#tooltip").attr("data-tooltip", "Click to Hide Attribute List");

					// append group
					var groupDiv = $(this.parentNode.parentNode);
					groupDiv.after("<div class='attributes' style='display:none'><svg></svg></div>");
					var attributeDivEl = groupDiv.next(".attributes")[0];
					var attributeGroup = d3.select(attributeDivEl).select("svg");
					$(attributeDivEl).fadeIn(500);

					// draw bar charts on group (draw whatever is in probabilityDistributions)
					var contentDiv = $(this.parentNode.parentNode.parentNode);
					var isSimilarGroup = contentDiv.hasClass("similar");
					var isOneGroup = "similarAttr" in cardData || "differentAttr" in cardData;
					var attributeList = [] 
					var barChartData = {};

					if (!isOneGroup)
						attributeList = cardData.configOnShelves.attribute;
					if (isOneGroup)
						attributeList = isSimilarGroup ? cardData.similarAttr[d] : cardData.differentAttr[d];
					
					for (var i = 0; i < attributeList.length; i++) { // only get the required distributions
						var currentAttr = attributeList[i];
						var currentProbabilityDistribution = cardData.probabilityDistributions[d][currentAttr];
						barChartData[currentAttr] = currentProbabilityDistribution;
					}

					self.AttributeList.drawGroups(attributeGroup, attributeList);
					self.AttributeList.drawBarCharts(attributeGroup, barChartData);
					self.AttributeList.drawAttributeNames(attributeGroup, 22);
					self.Back.initClickInfoBehaviour(parentCardEl);
					self.Back.setClickableHighlight["OneGroup"](parentCardEl);
				}
				else {
					d3.select(this).classed("expanded", false);

					// remove attribute div
					var groupDivEl = $(this.parentNode.parentNode);
					var attributeDivEl = $(groupDivEl).next(".attributes")[0];
					$(attributeDivEl).remove()

					// change tooltip text
					var text = (cardData.similarGroups.indexOf(d) != -1) ? "Click to See Similar Attributes" : "Click to See Different Attributes";
					$("#tooltip").attr("data-tooltip", text);
				}
			}
		}
	},
	AttributeList: {
		Header: { marginLeft: 0, height: 30 },
		Attribute: { height: 28, margin: { left: 8, right: 10 } },
		BarChart: { margin: { top: 5, left: 45, bottom: 4, right: 4 }, barWidth: 5 },

		drawContainer: function(drawNeitherSimNorDist = false) {
			var self = Card;
			var card = self.currentCard;

			var similarAttrLength = card.newCardData.similarAttr.length;
			var differentAttrLength = card.newCardData.differentAttr.length;

			// has similar attributes
			if (similarAttrLength != 0) {
				var headerHTML = "<div class='similar header expanded'><svg></svg></div>";
				var contentHTML = "<div class='similar content'><svg></svg></div>";

				$(card.newCardEl).find(".back").append(headerHTML);
				$(card.newCardEl).find(".back").append(contentHTML);
			}

			// has different attributes
			if (differentAttrLength != 0) {
				var headerHTML = "<div class='different header expanded'><svg></svg></div>";
				var contentHTML = "<div class='different content'><svg></svg></div>";

				$(card.newCardEl).find(".back").append(headerHTML);
				$(card.newCardEl).find(".back").append(contentHTML);
			}

			// neither similar nor different
			if (drawNeitherSimNorDist) {
				var numberOfAllAttrSelected = card.newCardData.configOnShelves["attribute"].length;
				var hasNeitherSimNorDistAttr = (numberOfAllAttrSelected - similarAttrLength - differentAttrLength) > 0;

				if (hasNeitherSimNorDistAttr) {
					var headerHTML = "<div class='neither-sim-or-dist header expanded'><svg></svg></div>";
					var contentHTML = "<div class='neither-sim-or-dist content'><svg></svg></div>";

					$(card.newCardEl).find(".back").append(headerHTML);
					$(card.newCardEl).find(".back").append(contentHTML);
				}				
			}
		},
		drawHeaders: function() {
			var self = Card;
			var card = self.currentCard;

			// draw the structure
			d3.select(card.newCardEl).selectAll(".back .header svg").each(function() {
				var header = d3.select(this).append("g")
					.style("cursor", "pointer")
					.on("click", clickHeader);
				header.append("rect") // background rect
					.attr("x", 0)
					.attr("y", 0)
					.attr("width", full)
					.attr("height", full)
					.style("fill", "white");
				var headerText = header.append("text")
					.attr("x", self.AttributeList.Header.marginLeft)
					.attr("y", self.AttributeList.Header.height / 2)
					.style("alignment-baseline", "middle")
					.style("font-weight", "bold")
				header.append("text")
					.attr("class", "caret")
					.attr("y", self.AttributeList.Header.height / 2 + 3)
					.style("text-anchor", "start")
					.style("font-family", "FontAwesome")
					.text("\uf0d8");
			});

			// change text for and caret x for each type of attributes
			if (!d3.select(card.newCardEl).select(".similar.header").empty()) {
				d3.select(card.newCardEl).select(".similar.header svg text").text("Similar Attributes");
				d3.select(card.newCardEl).select(".similar.header svg .caret").attr("x", 106);
			}
			if (!d3.select(card.newCardEl).select(".different.header").empty()) {
				d3.select(card.newCardEl).select(".different.header svg text").text("Different Attributes");
				d3.select(card.newCardEl).select(".different.header svg .caret").attr("x", 113);
			}
			if (!d3.select(card.newCardEl).select(".neither-sim-or-dist.header").empty()) {
				d3.select(card.newCardEl).select(".neither-sim-or-dist.header svg text").text("Not Highly Similar and Different");
				d3.select(card.newCardEl).select(".neither-sim-or-dist.header svg .caret").attr("x", 207);
			}

			function clickHeader() {
				var parentHeader = $(this).closest(".header");

				if (parentHeader.hasClass("expanded")) {
					parentHeader.removeClass("expanded");
					d3.select(this).select(".caret").text("\uf0d7");
				}
				else {
					parentHeader.addClass("expanded");
					d3.select(this).select(".caret").text("\uf0d8");
				}
			}
		},
		drawContents: function() {
			var self = Card;
			var card = self.currentCard;

			// get data
			var similarAttrList = card.newCardData.similarAttr;
			var differentAttrList = card.newCardData.differentAttr;

			// draw similar
			if (!d3.select(card.newCardEl).select(".similar.content").empty()) {
				var contentSVG = d3.select(card.newCardEl).select(".back .content.similar svg");
				var barChartData = card.newCardData.probabilityDistribution;
				self.AttributeList.drawGroups(contentSVG, similarAttrList);
				self.AttributeList.drawBarCharts(contentSVG, barChartData);
				self.AttributeList.drawAttributeNames(contentSVG, 25);
			}

			// draw different
			if (!d3.select(card.newCardEl).select(".different.content").empty()) {
				var contentSVG = d3.select(card.newCardEl).select(".back .content.different svg");
				var barChartData = card.newCardData.probabilityDistribution;
				self.AttributeList.drawGroups(contentSVG, differentAttrList);
				self.AttributeList.drawBarCharts(contentSVG, barChartData);
				self.AttributeList.drawAttributeNames(contentSVG, 25);
			}

			// draw neither similar nor different
			if (!d3.select(card.newCardEl).select(".neither-sim-or-dist.content").empty()) {
				var neitherSimNorDistList = [];
				var allSelectedAttr = card.newCardData.configOnShelves["attribute"];

				for (var i = 0; i < allSelectedAttr.length; i++) {
					var currentAttr = allSelectedAttr[i];
					var notSimilar = similarAttrList.indexOf(currentAttr) == -1;
					var notDifferent = differentAttrList.indexOf(currentAttr) == -1;

					if (notSimilar && notDifferent)
						neitherSimNorDistList.push(currentAttr)
				}

				var contentSVG = d3.select(card.newCardEl).select(".back .content.neither-sim-or-dist svg");
				var barChartData = card.newCardData.probabilityDistribution;
				self.AttributeList.drawGroups(contentSVG, neitherSimNorDistList);
				self.AttributeList.drawBarCharts(contentSVG, barChartData);
				self.AttributeList.drawAttributeNames(contentSVG, 25);
			}
		},

		// helpers for drawing content
		drawGroups: function(svg, attributeList) {
			var self = Card;
			var card = self.currentCard;
				
			svg.selectAll("g")
				.data(attributeList)
				.enter()
				.append("g")
				.attr("class", "attribute")
				.attr("transform", function(d, i) {
					return "translate(" + self.AttributeList.Attribute.margin.left + "," + self.AttributeList.Attribute.height * i + ")";
				})
				.style("cursor", "pointer")
				.on("mouseenter", mouseenterAttrGroup)
				.on("mouseleave", mouseleaveAttrGroup);

			// adjust svg height
			svg.attr("height", attributeList.length * self.AttributeList.Attribute.height);

			function mouseenterAttrGroup(d) {
				// modify the card data for attribute which belongs to groups
				var parentCardEl = $(this).closest(".card")[0];
				var cardData = d3.select(parentCardEl).datum();
				var isAttributeListOfGroup = "similarGroups" in cardData;

				if (isAttributeListOfGroup)
					cardData = Helper.convertOneGroupCardDataToTwoGroupCardData(cardData, this);

				// render system reasoning panel
				var attributeName = d;
				var barChartData = cardData.probabilityDistribution[attributeName];
				var cardPosition = $(parentCardEl).offset();

				SystemReasoningPanel.clear();
				SystemReasoningPanel["OneChart"].show();
				SystemReasoningPanel["OneChart"].renderBarChart(barChartData, attributeName);
				SystemReasoningPanel["OneChart"].showDescription(cardData, attributeName);
				SystemReasoningPanel.move(cardPosition.top - 10, cardPosition.left - 10); // 10 are margins
			}

			function mouseleaveAttrGroup() {
				SystemReasoningPanel.hide();
			}
		},
		drawBarCharts: function(svg, barChartData) {
			var self = Card;
			var card = self.currentCard;
			var attributeGroup = svg.selectAll(".attribute");

			// get dimensions
			var parentCardEl = $(svg.node()).closest(".card")[0];
			var showingBackSide = $(parentCardEl).find(".card-wrapper .back").hasClass("active");
			var svgWidth = showingBackSide ? $(svg.node()).closest("div").width() : $(parentCardEl).width();

			var rowWidth = svgWidth - self.AttributeList.Attribute.margin.left - self.AttributeList.Attribute.margin.right;
			var barMaxHeight = (self.AttributeList.Attribute.height - self.AttributeList.BarChart.margin.top - self.AttributeList.BarChart.margin.bottom) / 2;
			var barChartWidth = rowWidth / 2 - self.AttributeList.BarChart.margin.left - self.AttributeList.BarChart.margin.right;

			// draw bar chart group
			var barChartGroup = attributeGroup.append("g")
				.attr("class", "bar-chart")
				.attr("transform", "translate(" + (rowWidth / 2 + self.AttributeList.BarChart.margin.left) + "," + self.AttributeList.BarChart.margin.top + ")");
			barChartGroup.each(function(d) {
				var currentBarChartData = barChartData[d];
				var attributeName = d;

				// add background rect for hovering
				d3.select(this).append("rect")
					.attr("x", 0)
					.attr("y", 0)
					.attr("width", barChartWidth)
					.attr("height", barMaxHeight * 2)
					.style("fill", "white")
					.style("opacity", 0);

				// draw top bars
				var distinctValuesOfTwoGroups = Helper.getDistinctValuesOfTwoGroups(attributeName, currentBarChartData);
				var xScale = d3.scaleBand()
					.domain(distinctValuesOfTwoGroups)
					.range([0, barChartWidth])
					.padding(0.1);
				var yScale = d3.scaleLinear()
					.domain([0, 1]) // probability
					.range([barMaxHeight, 0]);
				var barWidth = (xScale.bandwidth() < self.AttributeList.BarChart.barWidth) ? xScale.bandwidth() : self.AttributeList.BarChart.barWidth;

				d3.select(this).selectAll(".top-bar")
					.data(currentBarChartData)
					.enter()
					.append("rect")
					.attr("class", "top-bar")
					.attr("x", function(d) {
						var stringOfValue = String(d.value);
						return xScale(stringOfValue) + xScale.bandwidth() / 2 - barWidth / 2; 
					})
					.attr("y", function(d) {
						return yScale(d.probability.top);
					})
					.attr("width", barWidth)
					.attr("height", function(d) { return barMaxHeight - yScale(d.probability.top); })
					.style("fill", ComparisonShelves.Shelf.colour.top.medium)
					.style("stroke", ComparisonShelves.Shelf.colour.top.deep);

				// draw bottom bars
				var yScale = d3.scaleLinear()
					.domain([0, 1]) // probability
					.range([0, barMaxHeight]);

				d3.select(this).selectAll(".bottom-bar")
					.data(currentBarChartData)
					.enter()
					.append("rect")
					.attr("class", "bottom-bar")
					.attr("x", function(d) {
						var stringOfValue = String(d.value);
						return xScale(stringOfValue) + xScale.bandwidth() / 2 - barWidth / 2; 
					})
					.attr("y", function(d) {
						return barMaxHeight;
					})
					.attr("width", barWidth)
					.attr("height", function(d) { return yScale(d.probability.bottom); })
					.style("fill", ComparisonShelves.Shelf.colour.bottom.medium)
					.style("stroke", ComparisonShelves.Shelf.colour.bottom.deep);

				// draw horizontal line
				d3.select(this).append("line")
					.attr("x1", 0)
					.attr("x2", barChartWidth)
					.attr("y1", barMaxHeight)
					.attr("y2", barMaxHeight)
					.style("stroke", "#e5e5e5");
			});
		},
		drawAttributeNames: function(svg, maxNameLength) {
			var self = Card;
			var card = self.currentCard;

			var attributeGroup = svg.selectAll(".attribute");
			var nameGroup = attributeGroup.append("g")
				.attr("class", "name")
				.on("mouseenter", function(d) { Card.AttributeList.expandAttributeName(this, d); })
				.on("mouseleave", function() { Card.AttributeList.collapseAttributeName(this); });

			$(card.newCardEl).find(".back").css("display", "block");
			nameGroup.each(function(d) {
				var shortAttrName = Helper.createShortString(d, maxNameLength);
				var rect = d3.select(this).append("rect");
				var line = d3.select(this).append("line");
				var text = d3.select(this).append("text")
					.attr("x", 0)
					.attr("y", self.AttributeList.Attribute.height / 2)
					.attr("alignment-baseline", "middle")
					.text(shortAttrName);

				// set rect and line dimensions
				var bbox = text.node().getBBox();
				rect.attr("rx", 3)
					.attr("ry", 3)
					.attr("x", bbox.x - 5)
					.attr("y", bbox.y)
					.attr("width", bbox.width + 10)
					.attr("height", bbox.height);
				line.attr("x1", bbox.x)
					.attr("x2", bbox.x + bbox.width)
					.attr("y1", bbox.y + bbox.height * 0.85)
					.attr("y2", bbox.y + bbox.height * 0.85);
			});
			$(card.newCardEl).find(".back").css("display", "");
		},
		expandAttributeName: function(nameEl, fullAttributeName) {
			var shortText = d3.select(nameEl).select("text").text();
			var text = d3.select(nameEl).select("text")
				.attr("short-attr-name", shortText)
				.text(fullAttributeName);
			var bbox = text.node().getBBox();

			d3.select(nameEl).select("rect")
				.attr("x", bbox.x - 5)
				.attr("y", bbox.y)
				.attr("width", bbox.width + 10)
				.attr("height", bbox.height);
			d3.select(nameEl).select("line")
				.attr("x1", bbox.x)
				.attr("x2", bbox.x + bbox.width)
				.attr("y1", bbox.y + bbox.height * 0.85)
				.attr("y2", bbox.y + bbox.height * 0.85);
		},
		collapseAttributeName: function(nameEl) {
			var shortAttrName = d3.select(nameEl).select("text")
				.attr("short-attr-name");
			var text = d3.select(nameEl).select("text")
				.text(shortAttrName);
			var bbox = text.node().getBBox();

			d3.select(nameEl).select("rect")
				.attr("x", bbox.x - 5)
				.attr("y", bbox.y)
				.attr("width", bbox.width + 10)
				.attr("height", bbox.height);
			d3.select(nameEl).select("line")
				.attr("x1", bbox.x)
				.attr("x2", bbox.x + bbox.width)
				.attr("y1", bbox.y + bbox.height * 0.85)
				.attr("y2", bbox.y + bbox.height * 0.85);
		}
	}
}