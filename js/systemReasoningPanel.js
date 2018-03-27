var SystemReasoningPanel = {
	chartHeight: { one: 180, multiple: 120 },
	chartMargin: { top: 23, left: 60, bottom: 35, right: 20 },
	svg: null,

	clear: function() {
		$("#system-reasoning-panel").empty();
	},
	hide: function() {
		$("#system-reasoning-panel")
			.css("display", "");
	},
	move: function(cardTop, cardLeft) {
		// determine left
		var cardWidth = col2Width;
		var barChartLeft = cardLeft + cardWidth + 5;

		// determine top
		var resultPanelPosition = $("#comparison-panel .results").offset();
		var documentHeight = $("body").height();
		var barChartHeight = $("#system-reasoning-panel").height();
		var barChartTop = (cardTop < resultPanelPosition.top) ? resultPanelPosition.top - 1 : cardTop - 1;
		
		// * bottom hidden
		if (cardTop + barChartHeight > documentHeight)
			barChartTop = documentHeight - barChartHeight - 9; // 8 is the margin

		$("#system-reasoning-panel")
			.css("top", barChartTop)
			.css("left", barChartLeft);
	},
	OneChart: {
		show: function() {
			var self = SystemReasoningPanel;
			
			// set width and height
			var widthExcludingMargin = systemReasoningPanelWidth - self.chartMargin.left - self.chartMargin.right;
			var heightExcludingMargin = self.chartHeight["one"] - self.chartMargin.top - self.chartMargin.bottom;
			BarChartHelper.setDimensions(widthExcludingMargin, heightExcludingMargin, self.chartMargin);

			// init html
			var html = "<div class='description'></div><svg></svg>";
			$("#system-reasoning-panel").html(html);

			// init self
			d3.select("#system-reasoning-panel svg")
				.attr("height", self.chartHeight["one"]);
			self.svg = d3.select("#system-reasoning-panel svg")
				.append("g")
				.attr("transform", "translate(" + self.chartMargin.left + ", " + self.chartMargin.top + ")");

			// show it!
			$("#system-reasoning-panel")
				.css("display", "block");
		},
		renderBarChart: function(barChartData, attributeName) {
			var self = SystemReasoningPanel;
			var svgGroup = self.svg;

			BarChartHelper.renderOne(svgGroup, barChartData, attributeName);
		},
		showDescription: function(cardData, attributeName) {
			var self = SystemReasoningPanel;
			var isSimilar = cardData.similarAttr.indexOf(attributeName) != -1;
			var isDifferent = cardData.differentAttr.indexOf(attributeName) != -1;
			var description = "";

			if (isSimilar)
				description = TextGenerator.generateSimilarDesc(cardData, attributeName);
			if (isDifferent && Database.numericalAttr.indexOf(attributeName) != -1)
				description = TextGenerator.generateDifferentDescForNumerical(cardData, attributeName);
			if (isDifferent && Database.categoricalAttr.indexOf(attributeName) != -1)
				description = TextGenerator.generateDifferentDescForCategorical(cardData, attributeName);
			if (!isSimilar && !isDifferent)
				description = TextGenerator.generateNonSignificantDesc(cardData, attributeName);

			$("#system-reasoning-panel .description").html(description);
		}
	},
	MultipleCharts: {
		show: function(numberOfBarCharts) {
			var self = SystemReasoningPanel;
			
			// set width and height
			var chartHeight = (numberOfBarCharts == 1) ? self.chartHeight["one"] : self.chartHeight["multiple"];
			var widthExcludingMargin = systemReasoningPanelWidth - self.chartMargin.left - self.chartMargin.right;
			var heightExcludingMargin = chartHeight - self.chartMargin.top - self.chartMargin.bottom;
			BarChartHelper.setDimensions(widthExcludingMargin, heightExcludingMargin, self.chartMargin);

			// init html
			var html = "";
			for (var i = 0; i < numberOfBarCharts; i++)
				html += "<div class='description'></div><svg></svg>";
			$("#system-reasoning-panel").html(html);

			// set svg
			d3.selectAll("#system-reasoning-panel svg")
				.attr("width", full)
				.attr("height", chartHeight);
			d3.selectAll("#system-reasoning-panel svg")
				.append("g")
				.attr("transform", "translate(" + self.chartMargin.left + ", " + self.chartMargin.top + ")");

			// show it!
			$("#system-reasoning-panel")
				.css("display", "block");
		},
		renderBarCharts: function(cardData, hoveredGroupName) {
			var self = SystemReasoningPanel;

			$("#system-reasoning-panel svg g").each(function(i) {
				var svgGroup = d3.select(this);
				var currentAttr = cardData.configOnShelves["attribute"][i];
				var barChartData = cardData.probabilityDistributions[hoveredGroupName][currentAttr];
				
				BarChartHelper.renderOne(svgGroup, barChartData, currentAttr);
			});
		},
		showDescriptions: function(cardData, hoveredGroupName) {
			var self = SystemReasoningPanel;
			var isSimilarGroup = cardData.similarGroups.indexOf(hoveredGroupName) != -1;
			
			// create modified card data
			var occupiedShelfName = (cardData.configOnShelves["top"].length == 0) ? "bottom" : "top";
			var anotherShelfName = (occupiedShelfName == "top") ? "bottom" : "top";
			var isEverythingElse = (cardData.configOnShelves[occupiedShelfName][0] == "Everything Else");
			var configList = !isEverythingElse ? cardData.configOnShelves[occupiedShelfName] : cardData.configOnShelves[anotherShelfName];
			var occupiedShelfObjects = Helper.retrieveGroups(configList, isEverythingElse);
			var anotherShelfObjects = Helper.retrieveGroups([hoveredGroupName]);
			var modifiedCardData = { groupNamesOnShelves: {}, objects: {} };
			
			modifiedCardData.groupNamesOnShelves[occupiedShelfName] = cardData.groupNamesOnShelves[occupiedShelfName];
			modifiedCardData.groupNamesOnShelves[anotherShelfName] = hoveredGroupName;
			modifiedCardData.objects[occupiedShelfName] = occupiedShelfObjects;
			modifiedCardData.objects[anotherShelfName] = anotherShelfObjects;
			modifiedCardData.probabilityDistribution = cardData.probabilityDistributions[hoveredGroupName];

			// draw descriptions
			$("#system-reasoning-panel .description").each(function(i) {
				var currentAttribute = cardData.configOnShelves["attribute"][i];
				var isNumerical = Database.numericalAttr.indexOf(currentAttribute) != -1;
				var description = "";

				if (isSimilarGroup)
					description = TextGenerator.generateSimilarDesc(modifiedCardData, currentAttribute);
				if (!isSimilarGroup && isNumerical)
					description = TextGenerator.generateDifferentDescForNumerical(modifiedCardData, currentAttribute);
				if (!isSimilarGroup && !isNumerical)
					description = TextGenerator.generateDifferentDescForCategorical(modifiedCardData, currentAttribute);

				$(this).html(description);
			});
		}
	},
	AttrCount: {
		show: function() {
			var self = SystemReasoningPanel;

			// init html
			var html = "<div class='description'></div>";
			$("#system-reasoning-panel")
				.html(html);
			$("#system-reasoning-panel .description")
				.css("margin-bottom", "10px");

			// show it!
			$("#system-reasoning-panel")
				.css("display", "block");
		},
		showDescription: function(cardData, cardType, data) {
			var description = null;

			if (cardType == "oneGroup")
				description = TextGenerator.generateAttrCountDesc[cardType](cardData, data.groupName, data.similarOrDifferent);
			if (cardType == "twoGroups")
				description = TextGenerator.generateAttrCountDesc[cardType](cardData, data.similarOrDifferent);

			$("#system-reasoning-panel .description").html(description);
		}
	}
}