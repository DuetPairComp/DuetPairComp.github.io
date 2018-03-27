var DataTable = {
	margin: { top: 10, left: 0, bottom: 10, right: 5 }, // no left padding as the scroll bar already takes some space
	width: null,
	rowHeight: 25,

	contentSVG: null,
	headerSVG: null,
	footerSVG: null,

	useLabelForNumerical: null,
	seondColumnAttr: null,
	secondColumnPointsOnNumberLine: {}, // for numerical attributes only
	secondColumnLabels: {}, // for numerical attributes only

	init: function() {
		var self = this;

		self.width = col1Width - self.margin.left - self.margin.right;

		self.headerSVG = d3.select("#data-table .header svg");
		self.contentSVG = d3.select("#data-table .content .wrapper svg");
		self.footerSVG = d3.select("#data-table .footer svg");
		$("#data-table .search-box input").on("input", inputSearchBox);

		function inputSearchBox() {
			var keyword = $(this).val().toLowerCase();
			var result = [];

			// search
			for (var i = 0; i < Database.data.length; i++) {
				var currentObject = Database.data[i];
				var IDContainsKeyword = currentObject[Database.IDAttr].toLowerCase().indexOf(keyword) != -1;
				var isSecondColAttrNumerical = (Database.numericalAttr.indexOf(self.seondColumnAttr) != -1);
				var currentObjectValue = isSecondColAttrNumerical && self.useLabelForNumerical 
									   ? self.convertValueToLabel(self.seondColumnAttr, currentObject[self.seondColumnAttr])
									   : currentObject[self.seondColumnAttr];
				var secondColAttrContainsKeyword = String(currentObjectValue).toLowerCase().indexOf(keyword) != -1;
				
				if (IDContainsKeyword || secondColAttrContainsKeyword)
					result.push(currentObject);
			}

			// redraw content
			self.contentSVG.selectAll("*").remove();
			self.drawContent(result, self.useLabelForNumerical);
		}
	},
	show: function() {
		var self = this;

		self.remove();
		self.clearPreviousData();
		self.getSecondRowAttr();
		self.drawHeader();
		self.drawContent(Database.data);
		self.drawFooter();
	},
	remove: function() {
		var self = this;

		self.headerSVG.selectAll("*").remove();
		self.contentSVG.selectAll("*").remove();
		self.footerSVG.selectAll("*").remove();
	},
	clearPreviousData: function() {
		var self = this;

		self.seondColumnAttr = null;
	},
	getSecondRowAttr: function() {
		var self = this;

		// retrieve the second column attribute with the most distinct values (information!)
		var maxInformationIndex = -1;
		var mostInformativeAttr = null;

		for (var i = 0; i < Database.categoricalAttr.length; i++) {
			var currentAttr = Database.categoricalAttr[i];
			var numberOfNonMissingValues = Helper.getAllValuesExcludingMissing(Database.data, currentAttr).length;
			var proportionOfNonMissingValues = numberOfNonMissingValues / Database.data.length;
			var numberOfDistinctValues = Database.numberOfDistinctValues[currentAttr];
			var currentInformationIndex = numberOfDistinctValues * Math.pow(proportionOfNonMissingValues, 1/2);

			if (currentInformationIndex > maxInformationIndex) {
				mostInformativeAttr = currentAttr;
				maxInformationIndex = currentInformationIndex;
			}
		}

		if (mostInformativeAttr)
			self.seondColumnAttr = mostInformativeAttr;
	},
	drawHeader: function() {
		var self = this;

		self.drawSecondColumn();
		self.drawFirstColumn();
	},
	drawSecondColumn: function() {
		var self = this;

		if (self.seondColumnAttr != null) {
			var secondColumnHeader = self.headerSVG.append("g")
				.attr("class", "attribute")
				.attr("transform", "translate(" + self.width / 2 + ", 0)");

			var translateX = self.width / 2 - 10;
			var translateY = self.rowHeight / 2 + 1;
			var sortButton = secondColumnHeader.append("g")
				.attr("class", "button")
				.attr("transform", "translate(" + translateX + "," + translateY + ")")
				.style("cursor", "pointer")
				.style("opacity", 0.35)
				.on("mouseenter", self.SortButton.mouseenter)
				.on("mouseleave", self.SortButton.mouseleave)
				.on("click", self.SortButton.click);

			var shortAttributeName = Helper.createShortString(self.seondColumnAttr, 10);
			var secondColumnTitle = secondColumnHeader.append("text")
				.datum(shortAttributeName)
				.attr("class", "title")
				.attr("x", self.width / 2 / 2)
				.attr("y", self.rowHeight / 2 + 1)
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("font-weight", "bold")
				.text(shortAttributeName)
				.on("mouseover", mouseoverTitle);

			var sortButtonText = sortButton.append("text")
				.attr("x", 0)
				.attr("y", 0)
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("font-size", "11px")
				.style("font-family", "FontAwesome")
				.text("\uf0d7");

			var bbox = sortButtonText.node().getBBox();
			sortButton.insert("rect", "text")
				.attr("x", bbox.x - 3)
				.attr("y", bbox.y)
				.attr("width", bbox.width + 6)
				.attr("height", bbox.height)
				.attr("rx", 3)
				.attr("ry", 3)
				.style("fill", "gray")
				.style("opacity", 0.3);
		}

		function mouseoverTitle(d) {
			var bbox = this.getBoundingClientRect();
			var longTitle = d;
			LongTitleTooltip.show(bbox.top, bbox.left, longTitle);
		}
	},
	drawFirstColumn: function() {
		var self = this;

		var firstColumnHeader = self.headerSVG.append("g")
			.attr("class", "ID");

		var shortIDName = Helper.createShortString(Database.IDAttr, 10);
		var firstColumnTitle = firstColumnHeader.append("text")
			.datum(shortIDName)
			.attr("x", self.width / 2 / 2)
			.attr("y", self.rowHeight / 2 + 2)
			.style("text-anchor", "middle")
			.style("alignment-baseline", "middle")
			.style("font-weight", "bold")
			.text(shortIDName)
			.on("mouseover", mouseoverTitle)

		var bbox = firstColumnTitle.node().getBBox();
		var idText = firstColumnHeader.append("text")
			.attr("x", bbox.x + bbox.width + 10)
			.attr("y", self.rowHeight / 2 + 1)
			.style("text-anchor", "middle")
			.style("alignment-baseline", "middle")
			.text("ID")
			.style("class", "ID-icon")
			.style("font-size", "11px");

		var bbox = idText.node().getBBox();
		firstColumnHeader.insert("rect", ".ID-icon")
			.attr("x", bbox.x - 3)
			.attr("y", bbox.y)
			.attr("width", bbox.width + 6)
			.attr("height", bbox.height)
			.attr("rx", 3)
			.attr("ry", 3)
			.style("fill", "gray")
			.style("opacity", 0.3);

		function mouseoverTitle(d) {
			var bbox = this.getBoundingClientRect();
			var longTitle = d;
			LongTitleTooltip.show(bbox.top, bbox.left, longTitle);
		}
	},
	drawContent: function(data, useLabelForNumerical = true) {
		var self = this;

		// create rows
		var row = self.contentSVG.selectAll(".row")
			.data(data)
			.enter()
			.append("g")
			.attr("class", function(d, i) {
				if (i % 2 == 0)
					return "row " + "even";
				else
					return "row " + "odd";
			})
			.attr("transform", function(d, i) {
				return "translate(0," + i * self.rowHeight + ")";
			});

		// create rect for hovering
		row.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", self.width)
			.attr("height", self.rowHeight);

		// first column
		var ID = row.append("g")
			.attr("class", "ID")
			.on("mouseenter", mouseenterGroup);
		ID.append("text")
			.attr("x", self.width / 2 / 2)
			.attr("y", self.rowHeight / 2 + 2.5)
			.style("text-anchor", "middle")
			.style("alignment-baseline", "middle")
			.text(function(d) {
				var shortText = Helper.createShortString(d[Database.IDAttr], 13);
				return shortText;
			});

		// second column
		var attribute = row.append("g")
			.attr("class", "attribute")
			.on("mouseenter", mouseenterGroup);
		attribute.append("text")
			.attr("x", self.width / 2 + self.width / 2 / 2)
			.attr("y", self.rowHeight / 2 + 2.5)
			.style("text-anchor", "middle")
			.style("alignment-baseline", "middle");
		self.changeSecondColumnContent(self.seondColumnAttr, useLabelForNumerical);

		// adjust height of content
		self.contentSVG
			.attr("height", data.length * self.rowHeight);

		function mouseenterGroup(d) {
			if (DraggableTag.dragged) // disable action on drag
				return;

			var textNode = d3.select(this).select("text").node();
			var position = $(textNode).position();
			var attributeName = d3.select(this).classed("ID") ? Database.IDAttr : self.seondColumnAttr;
			var attributeValue = "";
			var isNumerical = Database.numericalAttr.indexOf(self.seondColumnAttr) != -1;

			// get attributeValue
			if (d3.select(this).classed("ID")) // is ID (hover first column)
				attributeValue = d[Database.IDAttr];
			else if (isNumerical && self.useLabelForNumerical) // is numerical (hover second column)
				attributeValue = self.convertValueToLabel(self.seondColumnAttr, d[self.seondColumnAttr]);
			else // is categorical or numerical but not use label (hover second column)
				attributeValue = d[self.seondColumnAttr];

			DraggableTag.display(position.top, position.left - 1, attributeValue);
			DraggableTag.storeBehaviourName("group"); // for checking if it can be put into a shelf
			DraggableTag.storeConfiguration(attributeName + "=" + attributeValue);
			DraggableTag.storeGroupName("");
		}
	},
	drawFooter: function() {
		var self = this;
		var footerWidth = parseInt(self.footerSVG.attr("width"));

		// append text
		var group = self.footerSVG.append("g")
			.attr("class", "everything-else")
			.on("mouseenter", mouseenterEverythingElse);
		var text = group.append("text")
			.attr("x", footerWidth - 14)
			.attr("y", self.rowHeight / 2)
			.style("text-anchor", "end")
			.style("alignment-baseline", "middle")
			.style("opacity", 0.5)
			.text("Everything Else");

		// append rect
		group.insert("rect", "text")
			.attr("class", "background")
			.attr("rx", 3)
			.attr("ry", 3)
			.style("fill", "gray")
			.style("opacity", 0.2);

		function mouseenterEverythingElse() {
			if (DraggableTag.dragged) // disable action on drag
				return;

			var tagNode = d3.select(this).node();
			var position = tagNode.getBoundingClientRect();

			DraggableTag.display(position.top, position.left - 1, "Everything Else");
			DraggableTag.storeBehaviourName("group"); // for checking if it can be put into a shelf
			DraggableTag.storeConfiguration("Everything Else");
			DraggableTag.storeGroupName("");
		}
	},
	showFooter: function() {
		$("#data-table .footer").css("display", "block");

		var bbox = d3.select("#data-table .footer text").node().getBBox();
		d3.select("#data-table .footer rect")
			.attr("x", bbox.x - 5)
			.attr("y", bbox.y)
			.attr("width", bbox.width + 10)
			.attr("height", bbox.height);
	},
	hideFooter: function() {
		$("#data-table .footer").css("display", "");
	},
	changeSecondColumnHeader: function(attributeName) {
		var self = this;
		var shortAttributeName = Helper.createShortString(attributeName, 10);

		self.seondColumnAttr = attributeName;
		self.headerSVG.select(".attribute .title")
			.datum(attributeName)
			.text(shortAttributeName);
	},
	changeSecondColumnContent: function(attributeName, useLabelForNumerical = true) {
		var self = this;
		var isNumerical = (Database.numericalAttr.indexOf(attributeName) != -1);
		self.useLabelForNumerical = useLabelForNumerical;

		// change content for categorical
		if (!isNumerical || !useLabelForNumerical) {
			var attribute = self.contentSVG.selectAll(".attribute")
				.attr("class", "attribute");
			attribute.select("text")
				.text(function(d) {
					var shortText = Helper.createShortString(d[self.seondColumnAttr], 13);
					return shortText;
				});
		}
		
		// change content for numerical
		if (isNumerical && useLabelForNumerical) {
			var attribute = self.contentSVG.selectAll(".attribute")
				.attr("class", "attribute");
			attribute.select("text")
				.text(function(d) {
					var attributeValue = d[self.seondColumnAttr];
					var convertedLabel = self.convertValueToLabel(self.seondColumnAttr, attributeValue);
					var shortText = Helper.createShortString(convertedLabel, 13);
					return shortText;
				});
		}
	},
	convertValueToLabel: function(attributeName, attributeValue) {
		var self = this;

		if (attributeValue === "") // skip missing values
			return "";

		var label = null;
		for (var i = 0; i < self.secondColumnPointsOnNumberLine[attributeName].length - 1; i++) {
			var isLastInterval = (i == self.secondColumnPointsOnNumberLine[attributeName].length - 2);
			var lowerValue = self.secondColumnPointsOnNumberLine[attributeName][i];
			var upperValue = self.secondColumnPointsOnNumberLine[attributeName][i + 1];
			var currentLabel = self.secondColumnLabels[attributeName][i];

			if (!isLastInterval && attributeValue >= lowerValue && attributeValue < upperValue) // not last interval and in range
				label = currentLabel;
			if (isLastInterval && attributeValue >= lowerValue && attributeValue <= upperValue) // last interval and in range
				label = currentLabel;

			if (label != null)
				break;
		}

		return label;
	},
	SortButton: {
		mouseenter: function() {
			var buttonPosition = this.getBoundingClientRect();
			var isAscending = d3.select(this).classed("ascending");
			var isDescending = d3.select(this).classed("descending");
			var tooltipText = "";

			if (!isAscending && !isDescending) // next is ascending
				tooltipText = "Click to Sort in Asc. Order";
			if (isAscending) // next is descending
				tooltipText = "Click to Sort in Desc. Order";
			if (isDescending) // next is natural
				tooltipText = "Click to Unsort";

			$("#tooltip")
				.attr("data-tooltip", tooltipText)
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonPosition.width / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		},
		mouseleave: function() {
			$("#tooltip")
				.removeClass("show");
		},
		click: function() {
			var self = DataTable;
			var keyword = $("#data-table .search-box input").val().toLowerCase();
			var result = [];
			var isAscending = d3.select(this).classed("ascending");
			var isDescending = d3.select(this).classed("descending");
			var sortingModeAfterClick = "";
			var tooltipText = "";

			// search
			for (var i = 0; i < Database.data.length; i++) {
				var currentObject = Database.data[i];
				var IDContainsKeyword = currentObject[Database.IDAttr].toLowerCase().indexOf(keyword) != -1;
				var isSecondColAttrNumerical = (Database.numericalAttr.indexOf(self.seondColumnAttr) != -1);
				var currentObjectValue = isSecondColAttrNumerical && self.useLabelForNumerical 
									   ? self.convertValueToLabel(self.seondColumnAttr, currentObject[self.seondColumnAttr])
									   : currentObject[self.seondColumnAttr];
				var secondColAttrContainsKeyword = String(currentObjectValue).toLowerCase().indexOf(keyword) != -1;
				
				if (IDContainsKeyword || secondColAttrContainsKeyword)
					result.push(currentObject);
			}

			// sort
			if (!isAscending && !isDescending) {
				sortingModeAfterClick = "ascending";
				tooltipText = "Click to Sort in Desc. Order";
				self.SortButton.changeToAscending();
				result.sort(function(x, y) {
					return d3.ascending(x[self.seondColumnAttr], y[self.seondColumnAttr]);
				});
			}
			if (isAscending) {
				sortingModeAfterClick = "descending";
				tooltipText = "Click to Unsort";
				self.SortButton.changeToDescending();
				result.sort(function(x, y) {
					return d3.descending(x[self.seondColumnAttr], y[self.seondColumnAttr]);
				});
			}
			if (isDescending) {
				sortingModeAfterClick = "";
				tooltipText = "Click to Sort in Asc. Order";
				self.SortButton.changeToOriginal();
			}

			// change tooltip and redraw content
			$("#tooltip").attr("data-tooltip", tooltipText)
			self.contentSVG.selectAll("*").remove();
			self.drawContent(result, self.useLabelForNumerical);
		},
		changeToOriginal: function() {
			var self = DataTable;

			self.headerSVG.select(".attribute .button")
				.classed("ascending", false)
				.classed("descending", false)
				.style("opacity", 0.35);
			self.headerSVG.select(".attribute .button").select("rect")
				.style("opacity", 0.3);
			self.headerSVG.select(".attribute .button").select("text")
				.style("fill", null)
				.text("\uf0d7");
		},
		changeToAscending: function() {
			var self = DataTable;

			self.headerSVG.select(".attribute .button")
				.classed("descending", false)
				.classed("ascending", true)
				.style("opacity", 1);
			self.headerSVG.select(".attribute .button").select("rect")
				.style("opacity", 0.6);
			self.headerSVG.select(".attribute .button").select("text")
				.style("fill", "#ffffe5")
				.text("\uf0d8");
		},
		changeToDescending: function() {
			var self = DataTable;

			self.headerSVG.select(".attribute .button")
				.classed("ascending", false)
				.classed("descending", true)
				.style("opacity", 1);
			self.headerSVG.select(".attribute .button").select("rect")
				.style("opacity", 0.6);
			self.headerSVG.select(".attribute .button").select("text")
				.style("fill", "#ffffe5")
				.text("\uf0d7");
		}
	}
}