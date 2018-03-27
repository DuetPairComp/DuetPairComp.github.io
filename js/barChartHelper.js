var BarChartHelper = {
	margin: null,
	barWidth: 8,
	chartHeightExcludingMargin: null,
	chartWidthExcludingMargin: null,

	setDimensions: function(width, height, margin) {
		var self = this;
		
		self.chartWidthExcludingMargin = width;
		self.chartHeightExcludingMargin = height;
		self.margin = margin
	},
	renderOne: function(svgGroup, barChartData, attributeName) {
		var self = this;

		// scales
		var distinctValuesOfTwoGroups = Helper.getDistinctValuesOfTwoGroups(attributeName, barChartData);
		var xScale = d3.scaleBand()
			.domain(distinctValuesOfTwoGroups)
			.range([0, self.chartWidthExcludingMargin])
			.padding(0.3);
		var yScale = d3.scaleLinear()
			.domain([0, 1]) // probability
			.range([self.chartHeightExcludingMargin, 0]);

		// check which bar width to use
		var barWidth = (xScale.bandwidth() / 2 < self.barWidth) ? xScale.bandwidth() / 2 : self.barWidth;

		// bars
		var barGroups = svgGroup.selectAll(".bar-group")
			.data(barChartData)
			.enter()
			.append("g")
			.attr("class", "bar-group")
			.attr("transform", function(d) {
				var stringOfValue = String(d.value);
				var xTranslate = xScale(stringOfValue) + xScale.bandwidth() / 2;
				return "translate(" + xTranslate + ",0)";
			});
		barGroups.each(function(d) {
			var topGroupBarX = (d.probability.bottom == 0) ? -barWidth / 2 : -barWidth;
			var bottomGroupBarX = (d.probability.top == 0) ? -barWidth / 2 : 0;

			d3.select(this)
				.append("rect")
				.attr("class", "top-group-bar")
				.attr("x", topGroupBarX)
				.attr("y", yScale(d.probability.top))
				.attr("width", barWidth)
				.attr("height", self.chartHeightExcludingMargin - yScale(d.probability.top))
				.style("fill", ComparisonShelves.Shelf.colour.top.medium)
				.style("stroke", ComparisonShelves.Shelf.colour.top.deep);
			d3.select(this)
				.append("rect")
				.attr("class", "bottom-group-bar")
				.attr("x", bottomGroupBarX)
				.attr("y", yScale(d.probability.bottom))
				.attr("width", barWidth)
				.attr("height", self.chartHeightExcludingMargin - yScale(d.probability.bottom))
				.style("fill", ComparisonShelves.Shelf.colour.bottom.medium)
				.style("stroke", ComparisonShelves.Shelf.colour.bottom.deep);
		});

		// draw axis
		var hasDiscretized = "binNumber" in barChartData[0];
		var xAxis = d3.axisBottom(xScale);
		if (hasDiscretized) {
			var min = barChartData[0].min;
			var max = barChartData[0].max;
			var binNumber = barChartData[0].binNumber;
			var interval = (max - min) / binNumber;

			xAxis.tickFormat(function(d) {
				var binIndex = d;
				var minString = Math.round((min + interval * binIndex) * 100) / 100;
				var maxString = Math.round((min + interval * binIndex + interval) * 100) / 100;
				return minString + " - " + maxString;
			});
		}

		var yAxis = d3.axisLeft(yScale)
			.ticks(3)
			.tickFormat(function(d) {
				return d * 100 + "%"; 
			});

		svgGroup.append("g")
			.attr("class", "axis x")
			.attr("transform", "translate(0" + ", " + self.chartHeightExcludingMargin + ")")
			.call(xAxis);
		svgGroup.append("g")
			.attr("class", "axis y")
			.call(yAxis);

		// add label to y axis
		svgGroup.select(".axis.y").append("text")
		    .attr("x", yScale(0.5))
		    .attr("y", 0)
		    .attr("dy", "45px")
		    .attr("transform", "rotate(90)")
		    .style("fill", "black")
		    .style("text-anchor", "middle")
		    .text("Proportion");

		// rotate x axis text if they are too long
		var xAxisTextSVG = svgGroup.selectAll(".axis.x text");
		if (self.isXAxisTextOverlapped(xAxisTextSVG)) {
			svgGroup.selectAll(".axis.x text")
				.attr("y", 0)
			    .attr("x", 9)
			    .attr("dy", ".35em")
			    .attr("transform", "rotate(90)")
			    .style("text-anchor", "start");

			// adjust height
			var bbox = svgGroup.node().getBBox();
			var svg = svgGroup.node().parentNode;
			d3.select(svg)
				.attr("height", bbox.height + self.margin.top + self.margin.bottom / 2 - 7);
		}
	},
	isXAxisTextOverlapped: function(xAxisTextSVG) {
		var previousEndX = 0;
		var isOverlapped = false;

		xAxisTextSVG.each(function() {
			var bbox = this.getBoundingClientRect();
			var currentStartX = bbox.x;

			if (previousEndX > currentStartX) {
				isOverlapped = true;
				return;
			}

			previousEndX = bbox.x + bbox.width;
		});

		return isOverlapped;
	}
}