StoredAttributesPanel = {
	chartHeight: 120,
	chartMargin: { top: 23, left: 60, bottom: 35, right: 20 },

	init: function() {
		var self = this;

		self.initCloseButton();
		self.initSearchBox();
		self.initFilterButtons();
	},
	initCloseButton: function() {
		var self = this;

		$("#stored-attributes-panel .header .fa-close").click(self.remove);
	},
	initSearchBox: function() {
		$("#stored-attributes-panel .footer .search-box input").on("input", function() {
			var keyword = $(this).val().toLowerCase();

			// search
			$("#stored-attributes-panel .content .description").each(function() {
				var currentDescription = $(this).text().toLowerCase();
				var keywordFound = currentDescription.indexOf(keyword) != -1;
				var parentChartDivEl = $(this).closest(".chart");

				if (keywordFound)
					$(parentChartDivEl).css("display", "block");
				if (!keywordFound)
					$(parentChartDivEl).css("display", "none");
			});
		});
	},
	initFilterButtons: function() {
		$("#stored-attributes-panel .footer .filters .button").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();
			var similarOrDifferent = $(this).hasClass("s") ? "similar" : $(this).hasClass("d") ? "different" : "neither similar nor different";
			var isButtonAlreadySelected = $(this).hasClass("selected");

			// set tooltip text
			if (isButtonAlreadySelected)
				$("#tooltip").attr("data-tooltip", "Click to hide " + similarOrDifferent + " attributes");
			if (!isButtonAlreadySelected)
				$("#tooltip").attr("data-tooltip", "Click to show " + similarOrDifferent + " attributes");

			// show
			$("#tooltip")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$("#stored-attributes-panel .footer .filters .button").mouseleave(function() {
			$("#tooltip").removeClass("show");
		});

		$("#stored-attributes-panel .footer .filters .button").click(function() {
			var isButtonAlreadySelected = $(this).hasClass("selected");
			var similarOrDifferent = $(this).hasClass("s") ? "similar" : $(this).hasClass("d") ? "different" : "neither similar nor different";

			// set class
			if (isButtonAlreadySelected) {
				$(this).removeClass("selected");
				$("#tooltip").attr("data-tooltip", "Click to show " + similarOrDifferent + " attributes");
			}
			if (!isButtonAlreadySelected) {
				$(this).addClass("selected");
				$("#tooltip").attr("data-tooltip", "Click to hide " + similarOrDifferent + " attributes");
			}

			// find all the attributes to be shown
			var attributesToLookFor = [];
			$("#stored-attributes-panel .footer .filters .button.selected").each(function() {
				var linkID = d3.select(".link.link-selected").datum().linkID;
				var similarOrDifferent = $(this).hasClass("s") ? "similar" : $(this).hasClass("d") ? "different" : "neitherSimilarNorDifferent";
				
				for (var currentAttribute in GraphStructure.linkInfoDict[linkID][similarOrDifferent])
					attributesToLookFor.push(currentAttribute);
			});

			// show the selected ones
			$("#stored-attributes-panel .content .description").each(function() {
				var currentAttribute = $(this).find(".attribute").text();
				var parentChartDivEl = $(this).closest(".chart");
				var currentAttributedSelected = attributesToLookFor.indexOf(currentAttribute) != -1;

				if (currentAttributedSelected)
					$(parentChartDivEl).css("display", "block");
				if (!currentAttributedSelected)
					$(parentChartDivEl).css("display", "none");
			});

			// set border
			$("#stored-attributes-panel .content .chart").css("border-bottom", "");
			$("#stored-attributes-panel .content .chart:visible:last").css("border-bottom", "none");
		});
	},
	initRemoveButtonBehaviour: function() {
		$("#stored-attributes-panel .content .chart .fa-remove").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();

			$("#tooltip")
				.attr("data-tooltip", "Click to delete attributes")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$("#stored-attributes-panel .content .chart .fa-remove").mouseleave(function() {
			$("#tooltip").removeClass("show");
		});

		$("#stored-attributes-panel .content .chart .fa-remove").click(function() {
			// prepare messageInfo
			var parentChartDivEl = $(this).closest(".chart");
			var attrToBeRemoved = $(parentChartDivEl).find(".attribute").text();
			var selectedLinkID = d3.select(".link.link-selected").datum().linkID;
			var messageInfo = {
				linkID: null,
				similarOrDifferent: null,
				numberOfAttributes: 1,
				removeAttribute: true
			};

			// prepare for removal
			var node1ID = selectedLinkID.split("-")[0];
			var node2ID = selectedLinkID.split("-")[1];
			var node1Info = GraphStructure.nodeInfoDict[node1ID];
			var node2Info = GraphStructure.nodeInfoDict[node2ID];
			var isRadialLayout = !d3.select(".node.selected").empty();
			var centreNodeID = isRadialLayout ? d3.select(".node.selected").datum().nodeID : null;
			var attributeInfo = {};
			var similarOrDifferent = null;

			attributeInfo[attrToBeRemoved] = "dummyInfo";

			for (var currentSimilarOrDifferent in GraphStructure.linkInfoDict[selectedLinkID]) {
				if (attrToBeRemoved in GraphStructure.linkInfoDict[selectedLinkID][currentSimilarOrDifferent]) {
					similarOrDifferent = currentSimilarOrDifferent;
					messageInfo.similarOrDifferent = currentSimilarOrDifferent;
					break;
				}
			}

			// remove
			messageInfoUpdates = GraphStructure.removeAttrFromLink(node1Info, node2Info, attributeInfo, similarOrDifferent);
			messageInfo.linkID = messageInfoUpdates.linkID;
			messageInfo = (messageInfo.linkID == null) ? null : messageInfo;
			centreNodeID = (centreNodeID in GraphStructure.adjacencyMatrix) ? centreNodeID : null;
			GraphStructure.updateSimilarity();
			GraphStructure.updateNodeData(centreNodeID);
			GraphStructure.updateLinkData(centreNodeID);
			GraphVisualizer.Message.remove();
			GraphVisualizer.Link.update(messageInfo);
			GraphVisualizer.Node.update();
			StoredAttributesPanel.updateOnLinkUpdate(messageInfo);			
		});
	},
	updateOnLinkUpdate: function(messageInfo) {
		var updatedLinkExists = messageInfo != null;
		var isStoredAttributesPanelOpened = $("#stored-attributes-panel").css("display") == "block";

		if (isStoredAttributesPanelOpened) {
			if (updatedLinkExists) {
				var updatedLink = GraphVisualizer.linksByID[messageInfo.linkID].el;
				var isUpdatedLinkSelected = updatedLink.classed("link-selected");

				if (isUpdatedLinkSelected)
					StoredAttributesPanel.updateAndShow(updatedLink.node());
				if (!isUpdatedLinkSelected)
					StoredAttributesPanel.remove();
			}

			if (!updatedLinkExists)
				StoredAttributesPanel.remove();
		}
	},
	updateAndShow: function(linkElOfInterest) { // may need to update panel when linkInfoDict changed
		if (!d3.select(linkElOfInterest).classed("link-selected"))
			return;

		var self = this;
		var linkData = d3.select(linkElOfInterest).datum();
		var linkID = linkData.linkID;

		self.show(); // need to show first
		self.updateFilterButtons(linkID);
		self.updateContent(linkID);
		self.initRemoveButtonBehaviour();
	},
	show: function() {
		$("#stored-attributes-panel").css("display", "block");
	},
	remove: function() {
		if (!d3.select(".link.link-selected").empty()) {
			var highlightedLinkEl = d3.select(".link.link-selected").node();
			$(".link-selected").removeClass("link-selected");
			GraphVisualizer.Link.removeHighlight(highlightedLinkEl);
		}

		$("#stored-attributes-panel").css("display", "");
	},
	updateFilterButtons: function(linkID) {
		var storedAttributes = GraphStructure.linkInfoDict[linkID];

		// similar
		if ("similar" in storedAttributes) {
			var attributeCount = Object.keys(storedAttributes["similar"]).length;
			$("#stored-attributes-panel .footer .filters .button.s")
				.css("display", "")
				.addClass("selected")
				.html(attributeCount);
		}
		else {
			$("#stored-attributes-panel .footer .filters .button.s")
				.css("display", "none")
				.removeClass("selected");
		}

		// neither similar nor different
		if ("neitherSimilarNorDifferent" in storedAttributes) {
			var attributeCount = Object.keys(storedAttributes["neitherSimilarNorDifferent"]).length;
			$("#stored-attributes-panel .footer .filters .button.n")
				.css("display", "")
				.addClass("selected")
				.html(attributeCount);
		}
		else {
			$("#stored-attributes-panel .footer .filters .button.n")
				.css("display", "none")
				.removeClass("selected");
		}

		// different
		if ("different" in storedAttributes) {
			var attributeCount = Object.keys(storedAttributes["different"]).length;
			$("#stored-attributes-panel .footer .filters .button.d")
				.css("display", "")
				.addClass("selected")
				.html(attributeCount);
		}
		else {
			$("#stored-attributes-panel .footer .filters .button.d")
				.css("display", "none")
				.removeClass("selected");
		}
	},
	updateContent: function(linkID) {
		var self = this;
		var numberOfBarCharts = 0;
		var cardData = self.reconstructCardData(linkID);

		for (var similarOrDifferent in GraphStructure.linkInfoDict[linkID]) {
			var currentAttrCount = Object.keys(GraphStructure.linkInfoDict[linkID][similarOrDifferent]).length;
			numberOfBarCharts += currentAttrCount;
		}

		self.createStructure(numberOfBarCharts);
		self.renderBarCharts(cardData);
		self.showDescriptions(cardData);
	},
	reconstructCardData: function(linkID) { // always set the node with smaller id to be the top
		var linkInfo = GraphStructure.linkInfoDict[linkID];
		var node1ID = linkID.split("-")[0];
		var node2ID = linkID.split("-")[1];

		// get probabilityDistribution
		var probabilityDistribution = {};
		var topGroupString = "nodeID=" + node1ID;
		var bottomGroupString = "nodeID=" + node2ID;
		for (var similarOrDifferent in linkInfo) {
			for (var currentAttr in linkInfo[similarOrDifferent]) {
				// reconstruct probability object of an attribute
				var probabilityForEachValue = [];
				var currentBarChartData = linkInfo[similarOrDifferent][currentAttr];
				var hasDiscretized = "binNumber" in currentBarChartData[0];
				for (var i = 0; i < currentBarChartData.length; i++) {
					var currentValue = currentBarChartData[i]["value"];
					var valueObject = { value: null, probability: {} };

					valueObject["value"] = currentValue;
					valueObject["probability"]["top"] = currentBarChartData[i]["probability"][topGroupString];
					valueObject["probability"]["bottom"] = currentBarChartData[i]["probability"][bottomGroupString];
					if (hasDiscretized) {
						valueObject["binNumber"] = currentBarChartData[i]["binNumber"];
						valueObject["min"] = currentBarChartData[i]["min"];
						valueObject["max"] = currentBarChartData[i]["max"];
					}
					
					probabilityForEachValue.push(valueObject);
				}

				// store the new probability object
				probabilityDistribution[currentAttr] = probabilityForEachValue;
			}
		}

		// get objects
		var objects = {};
		var node1Config = GraphStructure.nodeInfoDict[node1ID]["config"];
		var node1EverythingElse = GraphStructure.nodeInfoDict[node1ID]["everythingElse"];
		var node2Config = GraphStructure.nodeInfoDict[node2ID]["config"];
		var node2EverythingElse = GraphStructure.nodeInfoDict[node2ID]["everythingElse"];
		objects["top"] = Helper.retrieveGroups(node1Config, node1EverythingElse);
		objects["bottom"] = Helper.retrieveGroups(node2Config, node2EverythingElse);

		// get group names
		var groupNamesOnShelves = {};
		groupNamesOnShelves["top"] = GraphStructure.nodeInfoDict[node1ID]["name"];
		groupNamesOnShelves["bottom"] = GraphStructure.nodeInfoDict[node2ID]["name"];

		// get similar and different attributes
		var similarAttr = "similar" in GraphStructure.linkInfoDict[linkID] ? Object.keys(GraphStructure.linkInfoDict[linkID]["similar"]) : [];
		var differentAttr = "different" in GraphStructure.linkInfoDict[linkID] ? Object.keys(GraphStructure.linkInfoDict[linkID]["different"]) : [];
		
		return {
			probabilityDistribution: probabilityDistribution,
			groupNamesOnShelves: groupNamesOnShelves,
			objects: objects,
			similarAttr: similarAttr,
			differentAttr: differentAttr
		}
	},
	createStructure: function(numberOfBarCharts) {
		var self = this;
		
		// set width and height
		var widthExcludingMargin = storedAttributesPanelWidth - self.chartMargin.left - self.chartMargin.right;
		var heightExcludingMargin = self.chartHeight - self.chartMargin.top - self.chartMargin.bottom;
		BarChartHelper.setDimensions(widthExcludingMargin, heightExcludingMargin, self.chartMargin);

		// create structure
		var html = "";
		for (var i = 0; i < numberOfBarCharts; i++)
			html += "<div class='chart'>" + 
						"<div class='description'></div>" + 
						"<svg></svg>" +
						"<span class='button fa fa-remove'></span>" +
					"</div>";
		$("#stored-attributes-panel .content").html(html);

		// set svg
		d3.selectAll("#stored-attributes-panel .content svg")
			.attr("width", full)
			.attr("height", self.chartHeight);
		d3.selectAll("#stored-attributes-panel .content svg")
			.append("g")
			.attr("transform", "translate(" + self.chartMargin.left + ", " + self.chartMargin.top + ")");
	},
	renderBarCharts: function(cardData) {
		var attributeList = Object.keys(cardData.probabilityDistribution);

		$("#stored-attributes-panel .content svg g").each(function(i) {
			var svgGroup = d3.select(this);
			var currentAttribute = attributeList[i];
			var barChartData = cardData.probabilityDistribution[currentAttribute];

			BarChartHelper.renderOne(svgGroup, barChartData, currentAttribute);
		});
	},
	showDescriptions: function(cardData) {
		var attributeList = Object.keys(cardData.probabilityDistribution);

		$("#stored-attributes-panel .description").each(function(i) {
			var currentAttribute = attributeList[i];
			var isSimilar = cardData.similarAttr.indexOf(currentAttribute) != -1;
			var isDifferent = cardData.differentAttr.indexOf(currentAttribute) != -1;
			var isNumerical = Database.numericalAttr.indexOf(currentAttribute) != -1;
			var description = "";

			if (isSimilar)
				description = TextGenerator.generateSimilarDesc(cardData, currentAttribute);
			if (isDifferent && isNumerical)
				description = TextGenerator.generateDifferentDescForNumerical(cardData, currentAttribute);
			if (isDifferent && !isNumerical)
				description = TextGenerator.generateDifferentDescForCategorical(cardData, currentAttribute);
			if (!isSimilar && !isDifferent)
				description = TextGenerator.generateNonSignificantDesc(cardData, currentAttribute);

			$(this).html(description);
		});
	}
}