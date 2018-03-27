var GroupContainer = {
	margin: { left: 13, right: 10, top: 10, bottom: 10 },
	tagGap: 30,

	svg: null,

	currentShelfName: null,
	hasChangedSomething: false,
	hasChangedName: false,

	init: function() {
		var self = this;

		// set left position of container
		var shelfBackgroundEl = ComparisonShelves.shelf.top.select(".shelf-background").node();
		var shelfLeft = shelfBackgroundEl.getBoundingClientRect().left;
		$("#group-container")
			.css("left", shelfLeft);

		// svg
		self.svg = d3.select("#group-container .content .container svg").append("g")
			.attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

		// name editor
		$("#group-container .header input").on("input", inputNameEditor);

		function inputNameEditor() {
			if (ComparisonShelves.configOnShelves[self.currentShelfName].length == 0)
				return;

			var newGroupName = $(this).val();
			ComparisonShelves.storeGroupName(self.currentShelfName, newGroupName);
			ComparisonShelves.InnerRect.changeGroupName(self.currentShelfName);

			if (self.currentShelfName != "attribute") {
				self.hasChangedSomething = true;
				self.hasChangedName = true;
			}
		}
	},
	toggle: function(shelfName) {
		var self = this;

		if ($("#group-container").css("display") == "block")
			self.remove();
		else
			self.show(shelfName);
	},
	show: function(shelfName) {
		var self = this;

		self.currentShelfName = shelfName;
		self.hasChangedSomething = false;
		self.hasChangedName = false;

		// find shelf bottom
		var shelfBackgroundEl = ComparisonShelves.shelf[self.currentShelfName].select(".shelf-background").node();
		var shelfTop = shelfBackgroundEl.getBoundingClientRect().top;
		var shelfHeight = ComparisonShelves.InnerRect.height + ComparisonShelves.Background.padding.top + ComparisonShelves.Background.padding.bottom;
		var shelfBottom = shelfTop + shelfHeight;

		// change appearance of shelf
		var backgroundWidth = ComparisonShelves.InnerRect.width + ComparisonShelves.Background.padding.left + ComparisonShelves.Background.padding.right;
		var backgroundHeight = ComparisonShelves.InnerRect.height + ComparisonShelves.Background.padding.top + ComparisonShelves.Background.padding.bottom;
		var backgroundY = ComparisonShelves.Shelf.marginTop[self.currentShelfName]
		ComparisonShelves.shelf[self.currentShelfName].select(".shelf-background")
			.attr("d", Helper.getTopRoundedRectPath(0, backgroundY, backgroundWidth, backgroundHeight, 5));

		// display
		$("#group-container")
			.css("display", "block")
			.css("top", shelfBottom);

		self.restoreAppearance();
	},
	remove: function() {
		var self = this;

		if ($("#group-container").css("display") == "none")
			return;

		// change appearance of shelf
		var backgroundWidth = ComparisonShelves.InnerRect.width + ComparisonShelves.Background.padding.left + ComparisonShelves.Background.padding.right;
		var backgroundHeight = ComparisonShelves.InnerRect.height + ComparisonShelves.Background.padding.top + ComparisonShelves.Background.padding.bottom;
		var backgroundY = ComparisonShelves.Shelf.marginTop[self.currentShelfName];

		ComparisonShelves.shelf[self.currentShelfName].select(".shelf-background")
			.attr("d", Helper.getRoundedRectPath(0, backgroundY, backgroundWidth, backgroundHeight, 5))

		// remove the widget
		$("#group-container")
			.css("display", "none");

		// if changed, compute result
		if (self.hasChangedSomething) {
			Card.draw();
		}
		if (self.hasChangedName) {
			var changedShelfConfig = ComparisonShelves.configOnShelves[self.currentShelfName];
			var newGroupName = ComparisonShelves.groupNamesOnShelves[self.currentShelfName];

			ChangeGroupNameManager.refreshAllCards(changedShelfConfig, newGroupName);
			ChangeGroupNameManager.refreshRelationshipMap(changedShelfConfig, newGroupName);
		}

		self.hasChangedSomething = false;
		self.hasChangedName = false;
		self.currentShelfName = null;
	},
	highlightBasedOnTagType: function() {
		var self = this;

		if ($("#group-container").css("display") == "none")
			return;

		var behaviourName = $("#draggable-tag").attr("behaviour-name");
		var tagType = behaviourName.split("|")[0];
		var isRightContainer = (tagType == "attribute" && self.currentShelfName == "attribute") ||
							   (tagType == "group" && (self.currentShelfName == "top" || self.currentShelfName == "bottom"));

		if (isRightContainer) {
			self.InnerRect.highlight(self.currentShelfName);
			self.TextGuide.show(self.currentShelfName);
		}
	},
	doubleHighlightOnTagEnter: function() {
		var self = this;

		if ($("#group-container").css("display") == "none")
			return;

		var behaviourName = $("#draggable-tag").attr("behaviour-name");
		var tagType = behaviourName.split("|")[0];
		var mouseXRelativeToPage = event.clientX;
		var mouseYRelativeToPage = event.clientY;
		var isRightContainer = (tagType == "attribute" && self.currentShelfName == "attribute") ||
							   (tagType == "group" && (self.currentShelfName == "top" || self.currentShelfName == "bottom"));

		if (self.isOnContainer(mouseXRelativeToPage, mouseYRelativeToPage) && isRightContainer) {
			self.InnerRect.doubleHighlight(self.currentShelfName);
			self.TextGuide.highlight(self.currentShelfName);
		}
	},
	occupyOnTagDropped: function() {
		var self = this;

		if ($("#group-container").css("display") == "none")
			return;

		var behaviourName = $("#draggable-tag").attr("behaviour-name");
		var tagType = behaviourName.split("|")[0];
		var mouseXRelativeToPage = event.clientX;
		var mouseYRelativeToPage = event.clientY;
		var isRightContainer = (tagType == "attribute" && self.currentShelfName == "attribute") ||
							   (tagType == "group" && (self.currentShelfName == "top" || self.currentShelfName == "bottom"));

		if (self.isOnContainer(mouseXRelativeToPage, mouseYRelativeToPage) && isRightContainer) {
			var configString = $("#draggable-tag").attr("configuration");
			var configurations = configString.split("|");
			var groupName = $("#draggable-tag").attr("group-name");
			groupName = (!groupName) ? configurations[0] : groupName; // only one config can have no group name

			ComparisonShelves.Shelf.add(self.currentShelfName, configurations, groupName);
			self.hasChangedSomething = true;
		}
	},
	restoreAppearance: function() {
		var self = this;

		if ($("#group-container").css("display") == "none")
			return;

		self.InnerRect.remove();
		self.TextGuide.remove();
		self.NameEditor.showName(self.currentShelfName);
		self.Tags.redraw(self.currentShelfName);
	},
	isOnContainer: function(clientX, clientY) {
		var self = this;
		var innerRect = d3.select("#group-container .content .container svg").node();
		var topEdgeY = $(innerRect).offset().top;
		var bottomEdgeY = topEdgeY + $("#group-container .content .container svg").height();
		var leftEdgeX = $(innerRect).offset().left;
		var rightEdgeX = leftEdgeX + $("#group-container .content .container svg").width();

		if (clientX >= leftEdgeX && clientX <= rightEdgeX && clientY >= topEdgeY && clientY <= bottomEdgeY)
			return true;

		return false;
	},
	removeTag: function(configuration) {
		var self = this;

		var index = ComparisonShelves.configOnShelves[self.currentShelfName].indexOf(configuration);
		ComparisonShelves.configOnShelves[self.currentShelfName].splice(index, 1);
		self.hasChangedSomething = true;

		// remove group name if the only tag is removed
		if (ComparisonShelves.configOnShelves[self.currentShelfName].length == 0)
			ComparisonShelves.groupNamesOnShelves[self.currentShelfName] = "";
		if (ComparisonShelves.configOnShelves[self.currentShelfName].length == 1)
			ComparisonShelves.groupNamesOnShelves[self.currentShelfName] = ComparisonShelves.configOnShelves[self.currentShelfName][0];
	},
	NameEditor: {
		showName: function(shelfName) {
			var groupName = ComparisonShelves.groupNamesOnShelves[shelfName];
			$("#group-container .header input").val(groupName);
		}
	},
	Tags: {
		redraw: function(shelfName) {
			var self = GroupContainer;
			var configurations = ComparisonShelves.configOnShelves[shelfName];
			
			// update data
			var tags = self.svg.selectAll(".tag")
				.data(configurations);
			
			// new elements
			var newTags = tags.enter().append("g")
				.attr("class", "tag")
				.on("mouseenter", mouseenterTag);
			
			newTags.append("rect");
			newTags.append("text");

			// update elements
			self.svg.selectAll(".tag").each(function(d, i) {
				// group
				d3.select(this)
					.attr("transform", "translate(0," + (i * self.tagGap) + ")");

				// text
				var splitConfig = d.split("=");
				var shortConfig = (splitConfig.length == 1) 
								? Helper.createShortString(d, 25) 
								: Helper.createShortString(splitConfig[0], 15) + "=" + Helper.createShortString(splitConfig[1], 15);

				var text = d3.select(this).select("text")
					.style("alignment-baseline", "text-before-edge")
					.style("fill", ComparisonShelves.Shelf.colour[shelfName].deep)
					.text(shortConfig);

				// rect
				var bbox = text.node().getBBox();
				d3.select(this).select("rect")
					.attr("x", bbox.x - 5)
					.attr("y", bbox.y)
					.attr("rx", 5)
					.attr("ry", 5)
					.attr("width", bbox.width + 10)
					.attr("height", bbox.height)
					.style("fill", ComparisonShelves.Shelf.colour[shelfName].pale)
					.style("stroke", ComparisonShelves.Shelf.colour[shelfName].deep);
			});

			// exit
			tags.exit().remove();

			// adjust svg
			d3.select("#group-container .content .container svg") // restore height first before computing new height
					.attr("height", full);

			var bbox = self.svg.node().getBBox();
			var contentHeight = bbox.height + self.margin.top + self.margin.bottom;
			var currentSVGHeight = $("#group-container .content .container svg").height();

			if (contentHeight > currentSVGHeight)
				d3.select("#group-container .content .container svg")
					.attr("height", contentHeight);

			function mouseenterTag(d) {
				if (DraggableTag.dragged) // disable action on drag
					return;

				var rectNode = d3.select(this).select("rect").node();
				var position = rectNode.getBoundingClientRect();
				var bbox = rectNode.getBBox();
				var configuration = d;

				DraggableTag.display(position.top - 2, position.left - 2, configuration);
				DraggableTag.resize(bbox.width + 4, bbox.height + 4); // cover the border as well
				DraggableTag.storeBehaviourName("group|dragStart:removeTagFromGroupContainer");
				DraggableTag.storeConfiguration(d);
				DraggableTag.storeGroupName("");
			}
		}
	},
	InnerRect: {
		highlight: function(shelfName) {
			var self = GroupContainer;

			if (d3.select("#group-container .content .container svg .inner-rect").empty()) {
				d3.select("#group-container .content .container svg").append("rect")
					.attr("class", "inner-rect")
					.attr("x", 0)
					.attr("y", 0)
					.attr("width", "calc(100% - 1px)")
					.attr("height", full)
					.style("fill", "white")
					.style("opacity", 0.5);
			}
			else {
				d3.select("#group-container .content .container svg .inner-rect")
					.style("opacity", 0.5);
			}
		},
		doubleHighlight: function(shelfName) {
			var self = GroupContainer;

			d3.select("#group-container .content .container svg .inner-rect")
				.style("opacity", 0.9);
		},
		remove: function() {
			var self = GroupContainer;

			d3.select("#group-container .content .container svg .inner-rect")
				.remove();
		}
	},
	TextGuide: {
		show: function(shelfName) {
			var self = GroupContainer;
			var width = $("#group-container .content .container svg").width();
			var heigth = $("#group-container .content .container svg").height();

			if (d3.select("#group-container .content .container svg .text-guide").empty()) {
				d3.select("#group-container .content .container svg").append("text")
					.attr("class", "text-guide")
					.attr("x", width / 2)
					.attr("y", heigth / 2)
					.style("fill", ComparisonShelves.Shelf.colour[shelfName].medium)
					.style("text-anchor", "middle")
					.style("alignment-baseline", "middle")
					.text("Drop Here");
			}
			else {
				d3.select("#group-container .content .container svg").select(".text-guide")
					.style("fill", ComparisonShelves.Shelf.colour[shelfName].medium);
			}
		},
		highlight: function(shelfName) {
			var self = GroupContainer;

			d3.select("#group-container .content .container svg").select(".text-guide")
				.style("fill", ComparisonShelves.Shelf.colour[shelfName].deep);
		},
		remove: function() {
			var self = GroupContainer;

			d3.select("#group-container .content .container svg").selectAll(".text-guide")
				.remove();
		}
	}
}