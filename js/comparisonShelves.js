var ComparisonShelves = {
	previousConfigOnShelves: { top: [], attribute: [], bottom: [] }, // to determine if card should be replaced

	// data to be exported
	configOnShelves: { top: [], attribute: [], bottom: [] }, // for checking occupancy
	groupNamesOnShelves: { top: "", attribute: "", bottom: "" },

	// svg
	svg: null,
	shelf: { top: null, attribute: null, bottom: null },

	init: function() {
		var self = this;

		self.svg = d3.select("#comparison-panel .shelves svg").append("g");
		self.computeMarginTop();

		self.Shelf.create("top");
		self.Background.draw("top", "Group");
		self.InnerRect.draw("top");

		self.Shelf.create("attribute");
		self.Background.draw("attribute", "Attribute");
		self.InnerRect.draw("attribute");

		self.Shelf.create("bottom");
		self.Background.draw("bottom", "Group");
		self.InnerRect.draw("bottom");

		self.translate();
	},
	clear: function() {
		var self = this;

		self.Shelf.removeOccupy("top");
		self.Shelf.removeOccupy("attribute");
		self.Shelf.removeOccupy("bottom");
		self.restoreAllShelves();
	},
	computeMarginTop: function() {
		var self = this;
		var backgroundHeight = self.InnerRect.height + self.Background.padding.top + self.Background.padding.bottom;

		self.Shelf.marginTop.top = 0;
		self.Shelf.marginTop.attribute = backgroundHeight + self.Shelf.gap;
		self.Shelf.marginTop.bottom = backgroundHeight * 2 + self.Shelf.gap * 2;
	},
	translate: function() {
		var self = this;
		var bbox = self.svg.node().getBBox();
		var shelfWidth = bbox.width;
		var shelfHeight = bbox.height;
		var shelfXTranslate = col2Width / 2 - shelfWidth / 2;
		var shelfYTranslate = comparisonPanelShelvesHeight / 2 - shelfHeight / 2;

		self.svg.attr("transform", "translate(" + shelfXTranslate + ", " + shelfYTranslate + ")");
	},
	onWhich: function(clientX, clientY) {
		var self = this;

		var allShelves = [ "top", "attribute", "bottom" ];
		for (var i = 0; i < allShelves.length; i++) {
			var currentShelfName = allShelves[i];
			var topInnerRect = self.shelf[currentShelfName].select(".shelf").node();
			var topEdgeY = topInnerRect.getBoundingClientRect().top;
			var bottomEdgeY = topEdgeY + self.InnerRect.height;
			var leftEdgeX = topInnerRect.getBoundingClientRect().left;
			var rightEdgeX = leftEdgeX + self.InnerRect.width;

			if (clientX >= leftEdgeX && clientX <= rightEdgeX && clientY >= topEdgeY && clientY <= bottomEdgeY)
				return currentShelfName;
		}

		return "none";
	},
	highlightBasedOnTagType: function() {
		var self = this;

		var behaviourName = $("#draggable-tag").attr("behaviour-name");
		var tagType = behaviourName.split("|")[0];
		var shelfNames = (tagType == "attribute") ? [ "attribute" ] : [ "top", "bottom" ];

		for (var i = 0; i < shelfNames.length; i++) {
			var currentShelfName = shelfNames[i];
			self.InnerRect.highlight(currentShelfName);
			self.TextGuide.show(currentShelfName);
		}
	},
	doubleHighlightOnTagEnter: function() {
		var self = this;

		var behaviourName = $("#draggable-tag").attr("behaviour-name");
		var tagType = behaviourName.split("|")[0];
		var mouseXRelativeToPage = event.clientX;
		var mouseYRelativeToPage = event.clientY;
		var mouseenterShelf = self.onWhich(mouseXRelativeToPage, mouseYRelativeToPage);
		var onRightShelf = ((mouseenterShelf == "top" || mouseenterShelf == "bottom") && tagType == "group") ||
							(mouseenterShelf == "attribute" && tagType == "attribute");

		if (mouseenterShelf != "none" && onRightShelf) {
			self.InnerRect.doubleHighlight(mouseenterShelf);
			self.TextGuide.highlight(mouseenterShelf);
		}
	},
	replaceOnTagDropped: function() {
		var self = this;

		var behaviourName = $("#draggable-tag").attr("behaviour-name");
		var tagType = behaviourName.split("|")[0];
		var mouseXRelativeToPage = event.clientX;
		var mouseYRelativeToPage = event.clientY;
		var mouseenterShelf = self.onWhich(mouseXRelativeToPage, mouseYRelativeToPage);
		var isGroupContainerOpened = $("#group-container").css("display") != "none";
		var enteredShelfDisabled = isGroupContainerOpened && mouseenterShelf != GroupContainer.currentShelfName;
		var onRightShelf = ((mouseenterShelf == "top" || mouseenterShelf == "bottom") && tagType == "group") ||
							(mouseenterShelf == "attribute" && tagType == "attribute");

		if (mouseenterShelf != "none" && onRightShelf && !enteredShelfDisabled) {
			var configString = $("#draggable-tag").attr("configuration");
			var configurations = configString.split("|");
			var groupName = $("#draggable-tag").attr("group-name");
			var alreadyHasConfigOnShelf = self.configOnShelves[mouseenterShelf].length > 0;			
			groupName = (!groupName) ? configurations[0] : groupName; // only one config can have no group name

			// add to shelf + show group container if necessary
			self.Shelf.add(mouseenterShelf, configurations, groupName);
			if (alreadyHasConfigOnShelf)
				GroupContainer.show(mouseenterShelf);

			return true;
		}

		return false;
	},
	restoreAllShelves: function() {
		var self = this;

		var allShelfNames = [ "top", "attribute", "bottom" ];
		for (var i = 0; i < allShelfNames.length; i++) {
			var currentShelfName = allShelfNames[i];
			self.InnerRect.restore(currentShelfName);
			self.TextGuide.remove(currentShelfName);
		}
	},
	getConfigurations: function() {
		var self = this;
		var configCopy = $.extend(true, {}, self.configOnShelves); // deep copy!
		
		return configCopy;
	},
	getGroupNames: function() {
		var self = this;
		var groupNamesCopy = $.extend(true, {}, self.groupNamesOnShelves); // deep copy!
		
		return groupNamesCopy;
	},
	storeGroupName: function(shelfName, newGroupName) {
		var self = this;
		self.groupNamesOnShelves[shelfName] = newGroupName;
	},
	previousConfigIsSubsetOfNewConfig: function() { // replace rather than add if true
		var self = this;
		var previousConfig = self.previousConfigOnShelves;
		var newConfig = ComparisonShelves.configOnShelves;
		var isPreviousSubsetOfNew = false;
		var isPreviousSameAsNew = false;

		var isPreviousTopSubsetOfNewTop = Helper.firstIsSubsetOfSecond(previousConfig["top"], newConfig["top"]);
		var isNewTopSubsetOfPreviousTop = Helper.firstIsSubsetOfSecond(newConfig["top"], previousConfig["top"]);
		var isPreviousAttrSubsetOfNewAttr = Helper.firstIsSubsetOfSecond(previousConfig["attribute"], newConfig["attribute"]);
		var isNewAttrSubsetOfPreviousAttr = Helper.firstIsSubsetOfSecond(newConfig["attribute"], previousConfig["attribute"]);
		var isPreviousBottomSubsetOfNewBottom = Helper.firstIsSubsetOfSecond(previousConfig["bottom"], newConfig["bottom"]);
		var isNewButtomSubsetOfPreviousBottom = Helper.firstIsSubsetOfSecond(newConfig["bottom"], previousConfig["bottom"]);

		// checking
		if (isPreviousTopSubsetOfNewTop &&
			isPreviousAttrSubsetOfNewAttr &&
			isPreviousBottomSubsetOfNewBottom)
			isPreviousSubsetOfNew = true;

		if (isPreviousTopSubsetOfNewTop &&
			isNewTopSubsetOfPreviousTop &&
			isPreviousAttrSubsetOfNewAttr &&
			isNewAttrSubsetOfPreviousAttr &&
			isPreviousBottomSubsetOfNewBottom &&
			isNewButtomSubsetOfPreviousBottom)
			isPreviousSameAsNew = true;

		if (previousConfig["top"].length == 0 &&
			previousConfig["attribute"].length == 0 &&
			previousConfig["bottom"].length == 0)
			isPreviousSubsetOfNew = false;

		// store the new config (deep copy)
		self.previousConfigOnShelves = { top: [], attribute: [], bottom: [] };
		for (var shelfName in self.previousConfigOnShelves) {
			for (var i = 0; i < ComparisonShelves.configOnShelves[shelfName].length; i++) {
				var currentConfiguration = ComparisonShelves.configOnShelves[shelfName][i];
				self.previousConfigOnShelves[shelfName].push(currentConfiguration);
			}
		}	

		return {
			isPreviousSubsetOfNew: isPreviousSubsetOfNew,
			isPreviousSameAsNew: isPreviousSameAsNew
		};
	},
	Shelf: {
		marginTop: { top: null, attribute: null, bottom: null },
		gap: 7,

		colour: {
			top: { deep: "#6E6561", medium: "#CFC1B8", pale: "#E6E0DA" },
			attribute: { deep: "#A9A9A9", medium: "#CFCFCF", pale: "#F5F5F5" },
			bottom: { deep: "#9c93a7", medium: "#DFC7E5", pale: "#F7F5F8" },
			noTag: { highlight: "#fffff2", doubleHighlight: "#ffffc1" }
		},
		create: function(shelfName) {
			var self = ComparisonShelves;

			self.shelf[shelfName] = self.svg.append("g")
				.attr("class", shelfName + "-shelf");
		},
		replace: function(shelfName, configurations, groupName) {
			var self = ComparisonShelves;

			self.groupNamesOnShelves[shelfName] = groupName;
			self.configOnShelves[shelfName] = configurations;
		},
		add: function(shelfName, configurations, groupName) {
			var self = ComparisonShelves;

			// everything else wipes our everything
			if (configurations[0] == "Everything Else" || self.configOnShelves[shelfName][0] == "Everything Else") {
				self.groupNamesOnShelves[shelfName] = "Everything Else";
				self.configOnShelves[shelfName] = [ "Everything Else" ];
				return;
			}

			// must change name first as it needs to check length of config
			if (self.configOnShelves[shelfName].length == 0) {
				self.groupNamesOnShelves[shelfName] = groupName;
			}
			if (self.configOnShelves[shelfName].length == 1) {
				var notSetGroupName = (self.configOnShelves[shelfName][0] == self.groupNamesOnShelves[shelfName]);
				self.groupNamesOnShelves[shelfName] = notSetGroupName ? "untitled group" : self.groupNamesOnShelves[shelfName];
			}

			// change config
			for (var i = 0; i < configurations.length; i++)
				if (self.configOnShelves[shelfName].indexOf(configurations[i]) == -1)
					self.configOnShelves[shelfName].push(configurations[i]);
		},
		removeOccupy: function(shelfName) {
			var self = ComparisonShelves;

			self.configOnShelves[shelfName] = [];
			self.groupNamesOnShelves[shelfName] = "";
		},
		isOccupied: function(shelfName) {
			var self = ComparisonShelves;

			if (self.configOnShelves[shelfName].length == 0)
				return false;

			return true;
		},
		getConfigStringOnShelf(shelfName) {
			var self = ComparisonShelves;
			var configString = "";

			for (var i = 0; i < self.configOnShelves[shelfName].length; i++) {
				configString += self.configOnShelves[shelfName][i];
				configString += (i != self.configOnShelves[shelfName].length - 1) ? "|" : "";
			}

			return configString;
		}
	},
	Background: {
		padding: { top: 2, left: 55, bottom: 2, right: 2 },

		draw: function(shelfName, shelfText) {
			var self = ComparisonShelves;
			var backgroundWidth = self.InnerRect.width + self.Background.padding.left + self.Background.padding.right;
			var backgroundHeight = self.InnerRect.height + self.Background.padding.top + self.Background.padding.bottom;

			self.shelf[shelfName].append("path")
				.attr("class", "shelf-background")
				.attr("d", Helper.getRoundedRectPath(0, self.Shelf.marginTop[shelfName], backgroundWidth, backgroundHeight, 5))
				.style("fill", self.Shelf.colour[shelfName].deep);

			self.shelf[shelfName].append("text")
				.attr("class", "shelf-background")
				.attr("x", self.InnerRect.left / 2)
				.attr("y", self.Shelf.marginTop[shelfName] + backgroundHeight / 2 + 1)
				.style("alignment-baseline", "middle")
				.style("text-anchor", "middle")
				.style("fill", self.Shelf.colour[shelfName].pale)
				.style("font-size", 11)
				.text(shelfText);
		}
	},
	InnerRect: {
		left: 55,
		width: 160,
		height: 18,

		draw: function(shelfName) {
			var self = ComparisonShelves;
			var marginTop = self.Shelf.marginTop[shelfName] + self.Background.padding.top;

			var innerRect = self.shelf[shelfName].append("g")
				.attr("class", "shelf")
				.attr("shelf-name", shelfName)
				.on("mouseenter", mouseenterShelf)
				.on("click", clickShelf);

			innerRect.append("rect")
				.attr("class", "not-remove-group-container")
				.attr("x", self.InnerRect.left)
				.attr("y", marginTop)
				.attr("width", self.InnerRect.width)
				.attr("height", self.InnerRect.height)
				.attr("rx", 5)
				.attr("ry", 5)
				.style("fill", "white")
				.style("stroke", self.Shelf.colour[shelfName].deep);

			function mouseenterShelf() {
				// disable action on drag and nothing on shelf
				var shelfName = d3.select(this).attr("shelf-name");

				if (!self.Shelf.isOccupied(shelfName) || DraggableTag.dragged)
					return;

				// update draggable tag
				var innerRectNode = d3.select(this).select("rect").node();
				var position = innerRectNode.getBoundingClientRect();
				var bbox = innerRectNode.getBBox();
				var behaviourName = null;
				var textInTag = self.groupNamesOnShelves[shelfName];
				var configString = self.Shelf.getConfigStringOnShelf(shelfName);
				var groupName = self.groupNamesOnShelves[shelfName];
				var anotherShelfName = (shelfName == "top") ? "bottom" : "top";
				var isAnotherShelfEverythingElse = (self.configOnShelves[anotherShelfName].length != 0 
												 && self.configOnShelves[anotherShelfName][0] == "Everything Else");

				if (shelfName == "attribute")
					behaviourName = "attribute|dragStart:removeAttributeFromShelf|click:toggleGroupContainer(attribute)";
				if (shelfName == "top" && !isAnotherShelfEverythingElse)
					behaviourName = "group|dragStart:removeTopFromShelf|click:toggleGroupContainer(top)";
				if (shelfName == "top" && isAnotherShelfEverythingElse)
					behaviourName = "group|dragStart:removeTopFromShelf|dragEnd:removeBottomFromShelf|click:toggleGroupContainer(top)";
				if (shelfName == "bottom" && !isAnotherShelfEverythingElse)
					behaviourName = "group|dragStart:removeBottomFromShelf|click:toggleGroupContainer(bottom)";
				if (shelfName == "bottom" && isAnotherShelfEverythingElse)
					behaviourName = "group|dragStart:removeBottomFromShelf|dragEnd:removeTopFromShelf|click:toggleGroupContainer(bottom)";

				DraggableTag.display(position.top, position.left, textInTag);
				DraggableTag.resize(bbox.width, bbox.height);
				DraggableTag.storeBehaviourName(behaviourName); // for checking if it can be put into a shelf
				DraggableTag.storeConfiguration(configString);
				DraggableTag.storeGroupName(groupName);
			}

			function clickShelf() { // toggle group container
				var shelfName = d3.select(this).attr("shelf-name");
				GroupContainer.toggle(shelfName);
			}
		},
		highlight: function(shelfName) {
			var self = ComparisonShelves;
			var isShelfOccupied = self.Shelf.isOccupied(shelfName);

			if (isShelfOccupied) {
				self.shelf[shelfName].select(".shelf rect")
					.style("fill", self.Shelf.colour[shelfName].pale);
				self.shelf[shelfName].select(".shelf .config")
					.style("fill", self.Shelf.colour[shelfName].medium);
			}
			else {
				self.shelf[shelfName].select(".shelf rect")
					.style("fill", self.Shelf.colour.noTag.highlight);
				if (!self.shelf[shelfName].select(".shelf .config").empty())
					self.shelf[shelfName].select(".shelf .config").remove();
			}
		},
		doubleHighlight: function(shelfName) {
			var self = ComparisonShelves;
			var isShelfOccupied = self.Shelf.isOccupied(shelfName);

			if (isShelfOccupied) {
				self.shelf[shelfName].select(".shelf rect")
					.style("fill", "white");
				self.shelf[shelfName].select(".shelf .config")
					.style("fill", self.Shelf.colour[shelfName].pale);
			}
			else {
				self.shelf[shelfName].select(".shelf rect")
					.style("fill", self.Shelf.colour.noTag.doubleHighlight);
				if (!self.shelf[shelfName].select(".shelf .config").empty())
					self.shelf[shelfName].select(".shelf .config").remove();
			}
		},
		restore: function(shelfName) {
			var self = ComparisonShelves;
			var isShelfOccupied = self.Shelf.isOccupied(shelfName);

			if (isShelfOccupied) {
				self.InnerRect.addConfig(shelfName);
			}
			else {
				self.shelf[shelfName].select(".shelf rect")
					.style("fill", "white");
				if (!self.shelf[shelfName].select(".shelf .config").empty())
					self.shelf[shelfName].select(".shelf .config").remove();
			}
		},
		changeGroupName: function(shelfName) {
			var self = ComparisonShelves;
			var currentName = self.shelf[shelfName].select(".shelf .config").text();
			var numberOfObjects = currentName.substring(currentName.lastIndexOf("(") + 1, currentName.lastIndexOf(")"));

			// create short config name
			var shortConfiguration = "";
			var splitGroupName = self.groupNamesOnShelves[shelfName].split("=");
			var lengthOfPart = (splitGroupName.length == 1) ? 25 : 15;

			for (var i = 0; i < splitGroupName.length; i++) {
				shortConfiguration += Helper.createShortString(splitGroupName[i], lengthOfPart);
				shortConfiguration += (i != splitGroupName.length - 1) ? "=" : "";
			}

			if (shelfName == "top" || shelfName == "bottom")
				shortConfiguration += " (" + numberOfObjects + ")"

			// change name
			self.shelf[shelfName].select(".shelf text")
				.text(shortConfiguration);
		},
		addConfig: function(shelfName) {
			var self = ComparisonShelves;
			var backgroundHeight = self.InnerRect.height + self.Background.padding.top + self.Background.padding.bottom;

			// create short config name
			var shortConfiguration = "";
			var splitGroupName = self.groupNamesOnShelves[shelfName].split("=");
			var lengthOfPart = (splitGroupName.length == 1) ? 25 : 15;

			for (var i = 0; i < splitGroupName.length; i++) {
				shortConfiguration += Helper.createShortString(splitGroupName[i], lengthOfPart);
				shortConfiguration += (i != splitGroupName.length - 1) ? "=" : "";
			}

			if (shelfName == "top" || shelfName == "bottom") {
				var isEverythingElse = (self.configOnShelves[shelfName][0] == "Everything Else");
				var anotherShelfName = (shelfName == "top") ? "bottom" : "top";
				var configList = !isEverythingElse ? self.configOnShelves[shelfName] : self.configOnShelves[anotherShelfName];
				var numberOfObjects = Helper.retrieveGroups(configList, isEverythingElse).length;
				shortConfiguration += " (" + numberOfObjects + ")"
			}

			// change shelf colour
			self.shelf[shelfName].select(".shelf rect")
				.style("fill", self.Shelf.colour[shelfName].pale);

			// add text to the shelf
			self.shelf[shelfName].select(".shelf .config")
				.remove();

			self.shelf[shelfName].select(".shelf")
				.append("text")
				.attr("class", "config")
				.attr("x", self.InnerRect.left + self.InnerRect.width / 2)
				.attr("y", self.Shelf.marginTop[shelfName] + backgroundHeight / 2 + 1)
				.style("fill", self.Shelf.colour[shelfName].deep)
				.style("text-anchor", "middle")
				.style("alignment-baseline", "middle")
				.style("font-size", "12px")
				.text(shortConfiguration);
		}
	},
	TextGuide: {
		show: function(shelfName) {
			var self = ComparisonShelves;
			var backgroundHeight = self.InnerRect.height + self.Background.padding.top + self.Background.padding.bottom;

			if (self.shelf[shelfName].select(".text-guide").empty()) {
				var textGuide = self.shelf[shelfName].append("text")
					.attr("class", "text-guide")
					.attr("x", self.InnerRect.left / 2)
					.attr("y", self.Shelf.marginTop[shelfName] + backgroundHeight / 2 + 2)
					.style("fill", self.Shelf.colour[shelfName].medium)
					.style("text-anchor", "middle")
					.style("alignment-baseline", "middle")
					.style("font-size", "10px")
					.text("Drop Here");

				var bbox = textGuide.node().getBBox();
				self.shelf[shelfName].insert("rect", ".text-guide")
					.attr("class", "text-guide " + shelfName + "-shelf")
					.attr("x", bbox.x - 5)
					.attr("y", bbox.y)
					.attr("width", bbox.width + 10)
					.attr("height", bbox.height)
					.attr("rx", 5)
					.attr("ry", 5)
					.style("stroke", self.Shelf.colour[shelfName].deep)
					.style("fill", self.Shelf.colour[shelfName].pale);
			}
			else {
				self.shelf[shelfName].selectAll("text.text-guide")
					.style("fill", self.Shelf.colour[shelfName].medium);
				self.shelf[shelfName].selectAll("rect.text-guide")
					.style("fill", self.Shelf.colour[shelfName].pale);
			}
		},
		highlight: function(shelfName) {
			var self = ComparisonShelves;

			self.shelf[shelfName].selectAll("text.text-guide")
				.style("fill", self.Shelf.colour[shelfName].deep);
			self.shelf[shelfName].selectAll("rect.text-guide")
				.style("fill", "white");
		},
		remove: function(shelfName) {
			var self = ComparisonShelves;

			self.shelf[shelfName].selectAll(".text-guide")
				.remove();
		}
	}
}