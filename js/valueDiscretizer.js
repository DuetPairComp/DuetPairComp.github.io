var ValueDiscretizer = {
	margin: { left: 0, right: 0, top: 20, bottom: 20 },
	
	// number line properties
	numberLineWidth: null,
	numberLineHeight: null,
	numberLineSVG: null,
	numberLineScale: null,

	// splitting point
	maxNumberOfSplittingPoints: 4, // 5 bins
	splittingPointsYPos: [],
	foundSplittingPointIndex: -1, // != -1 (remove the splliting point)

	// min max
	currentAttr: null,
	minValue: null,
	maxValue: null,

	init: function() {
		var self = this;

		// get width and height before hiding
		self.numberLineHeight = $("#value-discretizer svg").height() - self.margin.top - self.margin.bottom;
		self.numberLineWidth = $("#value-discretizer svg").width() - self.margin.left - self.margin.right;
		
		// hide it and set interaction
		$("#value-discretizer").css("display", "none");
		$("#value-discretizer .cancel-btn").click(clickCanelBtn);
		$("#value-discretizer .confirm-btn").click(clickConfirmBtn);

		// draw the number line
		self.numberLineSVG = d3.select("#value-discretizer svg")
			.append("g")
			.attr("transform", "translate(" + self.margin.left + ", " + self.margin.top + ")")
			.style("cursor", "pointer");

		// on enter
		$(document).keypress(function (e) {
 			var key = e.which;
 			var enterPressed = key == 13;
 			var valueDiscretizerDisplayed = $("#value-discretizer").css("display") == "block";

 			if(enterPressed && valueDiscretizerDisplayed)  {
    			clickConfirmBtn();
    			return false;  
  			}
		});   

		self.drawNumberLine();
		self.createHoverInteraction();
		self.createClickInteraction();

		function clickCanelBtn() {
			self.remove();
			AttributeList.numericalListContentSVG.selectAll(".attribute text.cog.selected")
				.classed("selected", false);
		}

		function clickConfirmBtn() {
			if (self.splittingPointsYPos.length == 0) {
				self.remove();
				AttributeList.numericalListContentSVG.selectAll(".attribute text.cog.selected")
					.classed("selected", false);
				return;
			}

			// get labels and value on the number line
			var labels = self.getLabels();
			var sortedValuesOnNumberLine = self.getSortedValuesOnNumberLine();
			DataTable.secondColumnLabels[self.currentAttr] = labels;
			DataTable.secondColumnPointsOnNumberLine[self.currentAttr] = sortedValuesOnNumberLine;
			DataTable.changeSecondColumnHeader(self.currentAttr);
			DataTable.changeSecondColumnContent(self.currentAttr);
			DataTable.SortButton.changeToOriginal();
			Database.storeUserDefinedCategory(self.currentAttr, labels, sortedValuesOnNumberLine);

			// remove visual
			self.remove();
			AttributeList.numericalListContentSVG.selectAll(".attribute text.cog.selected")
				.classed("selected", false);
		}
	},
	show: function(attributeName, attributeTop) {
		var self = this;

		// populate the widget
		self.remove();
		self.clearPreviousData();
		self.updateData(attributeName);
		self.drawAreaChart();
		self.updateNumberLine();

		// display the widget
		$("#value-discretizer")
			.css("display", "block")
			.css("top", attributeTop + AttributeList.height.attribute / 2 - valueDiscretizerHeight / 2);
	},
	remove: function() {
		var self = this;

		$("#value-discretizer").css("display", "none");
		$("#value-discretizer .text-input").empty();
		d3.selectAll("#value-discretizer .area-chart-layer *").remove();
		d3.selectAll("#value-discretizer .connecting-line").remove();
		d3.selectAll("#value-discretizer .splitting-point").remove();
	},
	clearPreviousData: function() {
		var self = this;

		self.splittingPointsYPos = [];
		self.foundSplittingPointIndex = -1;

		self.numberLineScale = null;
		self.currentAttr = null;
		self.minValue = null;
		self.maxValue = null;
	},
	updateData: function(attributeName) {
		var self = this;
		var allValues = Helper.getAllValuesExcludingMissing(Database.data, attributeName);

		self.currentAttr = attributeName;
		self.minValue = d3.min(allValues);
		self.maxValue = d3.max(allValues);
		self.numberLineScale = d3.scaleLinear()
			.domain([ self.minValue, self.maxValue ])
			.range([ self.numberLineHeight, 0 ]);
	},
	drawAreaChart: function() {
		var self = this;
		var pathData = self.computeAreaChartData();

		d3.select("#value-discretizer .area-chart-layer")
			.append("path")
			.attr("d", pathData)
			.style("fill", "steelblue")
			.style("opacity", 0.3);
	},
	computeAreaChartData: function() {
		var self = this;
		var allRawValues = Helper.getAllValuesExcludingMissing(Database.data, self.currentAttr);
		var numberOfObjects = allRawValues.length;
		var referenceBinNumber = Math.min(Math.ceil(Math.sqrt(numberOfObjects)), 20);
		var isCurrentAttrOrdinal = Database.ordinalNumericalAttr.indexOf(self.currentAttr) != -1;
		var isCurrentAttrNumerical = Database.numericalAttr.indexOf(self.currentAttr) != -1;
		var currentAttrNeedDiscretization = isCurrentAttrNumerical && !isCurrentAttrOrdinal;
		var minValue = d3.min(allRawValues);
		var maxValue = d3.max(allRawValues);
		var count = {};
		var countArray = [];

		// counting
		for (var i = 0; i < allRawValues.length; i++) {
			var currentValue = currentAttrNeedDiscretization
							 ? Helper.convertValueToBinIndex(allRawValues[i], minValue, maxValue, referenceBinNumber)
							 : allRawValues[i];

			if (!(currentValue in count))
				count[currentValue] = 0;
			count[currentValue]++;
		}

		// create countArray
		if (!currentAttrNeedDiscretization) {
			for (var value in count)
				countArray.push({ value: value, count: count[value] });
		}
		if (currentAttrNeedDiscretization) {
			var interval = (maxValue - minValue) / referenceBinNumber;
			var minValueBinIndex = Helper.convertValueToBinIndex(minValue, minValue, maxValue, referenceBinNumber)
			var maxValueBinIndex = Helper.convertValueToBinIndex(maxValue, minValue, maxValue, referenceBinNumber)

			// push min and max to prevent rendering problem
			countArray.push({ value: minValue, count: count[minValueBinIndex] });
			countArray.push({ value: maxValue, count: count[maxValueBinIndex] });

			// push all others
			for (var binIndex in count) {
				var binIndex = +binIndex;
				var lowerValueOfBin = minValue + interval * binIndex;
				var upperValueOfBin = minValue + interval * binIndex + interval;
				var middleValueOfBin = lowerValueOfBin + (upperValueOfBin - lowerValueOfBin) / 2;
				countArray.push({ value: middleValueOfBin, count: count[binIndex] });
			}
		}

		// sort
		countArray.sort(function(x, y) { return d3.ascending(x.value, y.value); });

		// create path data
		var maxCount = d3.max(countArray, function(d) { return d.count });
		var areaChartHalfWidth = self.numberLineWidth / 2 * 0.38;
		var widthScale = d3.scaleLinear()
			.domain([ 0,  maxCount ])
			.range([ 0, areaChartHalfWidth ]);
		var yScale = d3.scaleLinear()
			.domain([ minValue, maxValue ])
			.range([ self.numberLineHeight, 0 ]);
		var area = d3.area()
			.y(function(d) { return yScale(d.value); })
			.x0(function(d) { return self.numberLineWidth / 2 - widthScale(d.count); })
			.x1(function(d) { return self.numberLineWidth / 2 + widthScale(d.count); })
			.curve(d3.curveCardinal);;

		return area(countArray);
	},
	updateNumberLine: function() {
		var self = this;

		self.numberLineSVG.select(".min-value").text(self.minValue);
		self.numberLineSVG.select(".max-value").text(self.maxValue);
	},
	drawNumberLine: function() {
		var self = this;
		
		// background rect
		self.numberLineSVG.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", self.numberLineWidth)
			.attr("height", self.numberLineHeight)
			.style("fill", "white");

		// the area chart group
		self.numberLineSVG.append("g")
			.attr("class", "area-chart-layer");

		// the number line
		self.numberLineSVG.append("line")
			.attr("x1", self.numberLineWidth / 2)
			.attr("y1", 0)
			.attr("x2", self.numberLineWidth / 2)
			.attr("y2", self.numberLineHeight)
			.style("stroke", "black");

		self.numberLineSVG.append("line")
			.attr("x1", self.numberLineWidth / 2 - 3)
			.attr("y1", 0)
			.attr("x2", self.numberLineWidth / 2 + 3)
			.attr("y2", 0)
			.style("stroke", "black");
		self.numberLineSVG.append("text")
			.attr("class", "max-value")
			.attr("x", self.numberLineWidth / 2)
			.attr("y", -6)
			.style("text-anchor", "middle")
			.style("font-size", 10);

		self.numberLineSVG.append("line")
			.attr("x1", self.numberLineWidth / 2 - 3)
			.attr("y1", self.numberLineHeight)
			.attr("x2", self.numberLineWidth / 2 + 3)
			.attr("y2", self.numberLineHeight)
			.style("stroke", "black");
		self.numberLineSVG.append("text")
			.attr("class", "min-value")
			.attr("x", self.numberLineWidth / 2)
			.attr("y", self.numberLineHeight + 14)
			.style("text-anchor", "middle")
			.style("font-size", 10);

		// mouse position
		self.numberLineSVG.append("line")
			.attr("class", "mouse-position")
			.attr("x1", self.numberLineWidth / 2 - 3)
			.attr("x2", self.numberLineWidth / 2 + 3)
			.style("stroke", "none");
		self.numberLineSVG.append("text")
			.attr("class", "mouse-position number")
			.attr("x", self.numberLineWidth / 2 - 6)
			.style("text-anchor", "end")
			.style("alignment-baseline", "middle")
			.style("font-size", 10);
		self.numberLineSVG.append("text")
			.attr("class", "mouse-position symbol")
			.attr("x", self.numberLineWidth / 2 + 6)
			.style("alignment-baseline", "middle")
			.style("font-size", 10)
			.style("font-family", "FontAwesome")
			.style("fill", "none");
	},
	createHoverInteraction: function() {
		var self = this;

		self.numberLineSVG
			.on("mousemove", mousemoveNumberLine)
			.on("mouseenter", mouseenterNumberLine)
			.on("mouseleave", mouseleaveNumberLine);

		function mousemoveNumberLine() {
			var yPos = d3.mouse(this)[1];
			var roundedNumber = Math.round(self.numberLineScale.invert(yPos) * 10) / 10;

			// check if mouse cursor is around splitting point
			self.foundSplittingPointIndex = -1;
			for (var i = 0; i < self.splittingPointsYPos.length; i++) {
				var currentSplittingPointYPos = self.splittingPointsYPos[i];
				var lowerValue = currentSplittingPointYPos - 5;
				var upperValue = currentSplittingPointYPos + 5;

				if (yPos > lowerValue && yPos < upperValue) {
					self.foundSplittingPointIndex = i;
					break;
				}
			}
			
			// at splitting point, show minus sign
			if (self.foundSplittingPointIndex != -1) {
				self.numberLineSVG.select("line.mouse-position")
					.style("stroke", "none");
				self.numberLineSVG.select("text.mouse-position.number")
					.style("fill", "none");
				self.numberLineSVG.select("text.mouse-position.symbol")
					.attr("y", yPos + 1)
					.style("fill", "red")
					.text("\uf00d");
			}

			// not at splitting point, show plus sign and the text
			else {
				self.numberLineSVG.select("line.mouse-position")
					.attr("y1", yPos)
					.attr("y2", yPos)
					.style("stroke", "black");
				self.numberLineSVG.select("text.mouse-position.number")
					.attr("y", yPos + 1)
					.style("fill", "black")
					.text(roundedNumber);
				self.numberLineSVG.select("text.mouse-position.symbol")
					.attr("y", yPos + 1)
					.style("fill", "green")
					.text("\uf067")
			}
		}

		function mouseenterNumberLine() {
			self.numberLineSVG.select("line.mouse-position")
				.style("stroke", "black");
			self.numberLineSVG.selectAll("text.mouse-position")
				.style("fill", "black");
		}

		function mouseleaveNumberLine() {
			self.numberLineSVG.select("line.mouse-position")
				.style("stroke", "none");
			self.numberLineSVG.selectAll("text.mouse-position")
				.style("fill", "none");
		}
	},
	createClickInteraction: function() {
		var self = this;

		self.numberLineSVG
			.on("click", clickNumberLine);

		function clickNumberLine() {
			// need to remove a splitting point
			if (self.foundSplittingPointIndex != -1) {
				self.removeSplittingPoint();
				self.updateTextBoxes();
				self.createTextInputInteraction();
			}

			// too many splitting points
			else if (self.splittingPointsYPos.length >= self.maxNumberOfSplittingPoints) {
				return;
			}

			// add new splitting points
			else {
				var yPos = d3.mouse(this)[1];
				self.addSplittingPoint(yPos);
				self.updateTextBoxes();
				self.createTextInputInteraction();
			}
		}
	},
	addSplittingPoint: function(yPos) {
		var self = this;

		var roundedNumber = Math.round(self.numberLineScale.invert(yPos) * 10) / 10;
		var currentSplittingPointValue = roundedNumber.toString().split(".").join("-");

		self.numberLineSVG.append("line")
			.attr("class", "splitting-point value" + currentSplittingPointValue)
			.attr("x1", self.numberLineWidth / 2 - 3)
			.attr("y1", yPos)
			.attr("x2", self.numberLineWidth / 2 + 3)
			.attr("y2", yPos)
			.style("stroke", "black");
		self.numberLineSVG.append("text")
			.attr("class", "splitting-point value" + currentSplittingPointValue)
			.attr("x", self.numberLineWidth / 2 - 6)
			.attr("y", yPos + 1)
			.style("text-anchor", "end")
			.style("alignment-baseline", "middle")
			.style("font-size", 10)
			.text(roundedNumber);

		self.splittingPointsYPos.push(yPos);
	},
	removeSplittingPoint: function() {
		var self = this;

		// remove splitting points from interface
		var yPosForDeletion = self.splittingPointsYPos[self.foundSplittingPointIndex];
		var roundedValueForDeletion = Math.round(self.numberLineScale.invert(yPosForDeletion) * 10) / 10;
		var splittingPointValueForDeletion = roundedValueForDeletion.toString().split(".").join("-");
		self.numberLineSVG.selectAll(".splitting-point.value" + splittingPointValueForDeletion).remove();

		// remove splitting points from data
		self.splittingPointsYPos.splice(self.foundSplittingPointIndex, 1);
		self.foundSplittingPointIndex = -1;
	},
	updateTextBoxes: function() {
		var self = this;

		if (self.splittingPointsYPos.length == 0) {
			self.numberLineSVG.selectAll(".connecting-line").remove();
			$(".text-input").empty();
			return;
		}

		// get all points marked on the number line
		var sortedYPosOnNumberLine = [ 0, self.numberLineHeight ];
		sortedYPosOnNumberLine = sortedYPosOnNumberLine.concat(self.splittingPointsYPos);
		sortedYPosOnNumberLine.sort(function(a, b) { return a - b; });

		// get all the middle points
		var middlePoints = [];
		for (var i = 0; i < sortedYPosOnNumberLine.length - 1; i++) {
			var lowerValue = sortedYPosOnNumberLine[i];
			var upperValue = sortedYPosOnNumberLine[i + 1];

			middlePoints.push(lowerValue + (upperValue - lowerValue) / 2);
		}

		// create text boxes
		$("#value-discretizer .text-input").empty();
		for (var i = 0; i < middlePoints.length; i++) {
			var currentMiddlePoint = middlePoints[i];
			var top = self.margin.top + currentMiddlePoint - 7.5; // 7.5 is half of text box height

			$("#value-discretizer .text-input").append("<input type='text' style='top: " + top + "px'>");
		}

		// create connecting lines
		self.numberLineSVG.selectAll(".connecting-line").remove();
		for (var i = 0; i < middlePoints.length; i++) {
			var currentMiddlePoint = middlePoints[i];

			self.numberLineSVG.append("line")
				.attr("class", "connecting-line")
				.attr("x1", self.numberLineWidth / 2 + 5)
				.attr("y1", currentMiddlePoint)
				.attr("x2", self.numberLineWidth / 2 + self.numberLineWidth / 2)
				.attr("y2", currentMiddlePoint)
				.style("stroke", "#bfbfbf")
				.style("stroke-dasharray", "3, 2");
		}
	},
	createTextInputInteraction: function() {
		$("#value-discretizer .text-input input[type=text]").on("input", function() {
			var input = $(this).val();
			var left = $("#value-discretizer").offset().left + $("#value-discretizer").width();
			var top = $(this).offset().top + $(this).height() / 2;

			if (input == "LOW") {
				$("#tooltip").attr("data-tooltip", "\"LOW\" is a system keyword");
				$(this).val("LO");
			}

			if (input == "HIGH") {
				$("#tooltip").attr("data-tooltip", "\"HIGH\" is a system keyword");
				$(this).val("HIG");
			}

			if (input == "LOW" || input == "HIGH") {
				$("#tooltip")
					.css("top", top)
					.css("left", left + 15)
					.addClass("show right");

				setTimeout(function() {
					$("#tooltip").removeClass("show");
				}, 1000);
			}
		});
	},
	getSortedValuesOnNumberLine: function() {
		var self = this;

		// retrieve points
		var sortedValuesOnNumberLine = [ self.minValue, self.maxValue ];
		for (var i = 0; i < self.splittingPointsYPos.length; i++) {
			var currentSplittingPointYPos = self.splittingPointsYPos[i];
			var valueOnNumberLine = self.numberLineScale.invert(currentSplittingPointYPos);
			sortedValuesOnNumberLine.push(valueOnNumberLine);
		}

		// return sorted points
		sortedValuesOnNumberLine.sort(function(a, b) { return a - b; });
		return sortedValuesOnNumberLine;
	},
	getLabels: function() {
		var self = this;
		var labelArray = [];

		$("#value-discretizer .text-input input[type=text]").each(function(i) {
			var label = ($(this).val() === "") ? "Group" + (i + 1) : $(this).val();
			labelArray.unshift(label);
		});

		return labelArray;
	}
}