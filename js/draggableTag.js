var DraggableTag = {
	dragged: false,

	init: function() {
		var self = this;

		var dragBehaviour = d3.drag()
	        .on("start", self.onDragStart)
	        .on("drag", self.onDragged)
	        .on("end", self.onDragEnd);

		$("#draggable-tag").on("mouseleave", function() { self.remove() });
		$("#draggable-tag").on("mousewheel", function() { self.remove() });
		d3.select("#draggable-tag").call(dragBehaviour);

		// sometimes the tag is not remove when mouse moves too fast
		// use mouse over remove-tag-zone to fix this problem
		$(".remove-tag-zone").on("mouseover", function() {
			DraggableTag.remove();
			LongTitleTooltip.remove();
		});
	},
	display: function(top, left, text) {
		var self = this;

		self.restoreSize(); // the tag size may be changed sometimes

		$("#draggable-tag")
			.css("top", top)
			.css("left", left)
			.css("display", "block")
			.html(text);
	},
	resize: function(minWidth, height) {
		$("#draggable-tag")
			.css("min-width", minWidth + "px")
			.css("border-radius", "5px")
			.css("line-height", height + "px");

		if ($("#draggable-tag").width() <= minWidth) {
			$("#draggable-tag")
				.css("padding", "0px");
		}
	},
	restoreSize: function () {
		$("#draggable-tag")
			.css("min-width", "")
			.css("padding", "")
			.css("border-radius", "")
			.css("line-height", "");
	},
	remove: function() {
		var self = this;

		if (self.dragged) // it is remove while dragging for some reasons
			return;

		$("#draggable-tag").css("display", "");
	},
	storeBehaviourName: function(behaviourName) {
		$("#draggable-tag")
			.attr("behaviour-name", behaviourName);
	},
	containBehaviour: function(requestedbehaviour) {
		var behaviourName = $("#draggable-tag").attr("behaviour-name");

		return behaviourName.indexOf(requestedbehaviour) != -1;
	},
	storeConfiguration: function(configuration) {
		$("#draggable-tag")
			.attr("configuration", configuration);
	},
	storeGroupName: function(groupName) {
		$("#draggable-tag")
			.attr("group-name", groupName);
	},
	followCursor: function() {
		var mouseXRelativeToPage = event.clientX;
		var mouseYRelativeToPage = event.clientY;
		var tagWidth = $("#draggable-tag").width();
		var tagHeight = $("#draggable-tag").height();

		$("#draggable-tag")
			.css("top", mouseYRelativeToPage - tagHeight / 2)
			.css("left", mouseXRelativeToPage - tagWidth / 2);
	},
	pausePointerEvents: function() {
		$("#draggable-tag").css("pointer-events", "none");
		$("body").css("cursor", "all-scroll"); // pointer-events remove the cursor, change it back!
	},
	restartPointerEvents: function() { // set the point event back
		$("#draggable-tag").css("pointer-events", "");
		$("body").css("cursor", "");
	},
	onDragStart: function() {
		var self = DraggableTag;
	
		self.dragged = false; // not dragged yet

		// the tag on a shelf is dragged
		if (self.containBehaviour("dragStart:removeAttributeFromShelf"))
			ComparisonShelves.Shelf.removeOccupy("attribute");
		else if (self.containBehaviour("dragStart:removeTopFromShelf"))
			ComparisonShelves.Shelf.removeOccupy("top");
		else if (self.containBehaviour("dragStart:removeBottomFromShelf"))
			ComparisonShelves.Shelf.removeOccupy("bottom");
		else if (self.containBehaviour("dragStart:removeTagFromGroupContainer")) {
			var configuration = $("#draggable-tag").attr("configuration");
			GroupContainer.removeTag(configuration);
			GroupContainer.restoreAppearance();
		}
	},
	onDragged: function() {
		var self = DraggableTag;

		self.dragged = true; // dragged

		self.followCursor();
		self.pausePointerEvents();
		ComparisonShelves.highlightBasedOnTagType();
		ComparisonShelves.doubleHighlightOnTagEnter();
		GroupContainer.highlightBasedOnTagType();
		GroupContainer.doubleHighlightOnTagEnter();
	},
	onDragEnd: function() {
		var self = DraggableTag;

		// changing shelf data structure and then changing visual
		var shelfReplaced = ComparisonShelves.replaceOnTagDropped();
		var shelfRemoved = self.containBehaviour("dragStart:removeAttributeFromShelf") || 
						   self.containBehaviour("dragStart:removeTopFromShelf") ||
						   self.containBehaviour("dragStart:removeBottomFromShelf");

		if (self.containBehaviour("dragEnd:removeTopFromShelf") && self.dragged) // for removing everything else
			ComparisonShelves.Shelf.removeOccupy("top");
		if (self.containBehaviour("dragEnd:removeBottomFromShelf") && self.dragged) // for removing everything else
			ComparisonShelves.Shelf.removeOccupy("bottom");

		GroupContainer.occupyOnTagDropped();
		ComparisonShelves.restoreAllShelves();
		GroupContainer.restoreAppearance();

		// compute if dragged and changed
		if (self.dragged && shelfReplaced || self.dragged && shelfRemoved)
			Card.draw();

		// tag changes
		if (self.dragged) {
			self.dragged = false; // stopped dragging
			self.restartPointerEvents();
			self.remove();
			return;
		}

		// routing the click behaviours
		if (self.containBehaviour("click:changeSecondColumn"))
			AttributeList.TagBahaviour.clickAttributeName();
		else if (self.containBehaviour("click:toggleGroupContainer")) {
			var behaviourName = $("#draggable-tag").attr("behaviour-name");
			var shelfName = behaviourName.substring(behaviourName.indexOf("(") + 1, behaviourName.indexOf(")"));
			GroupContainer.toggle(shelfName);
		}
	}
}