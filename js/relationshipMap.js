var RelationshipMap = {
	zoom: null,

	init: function() {
		var self = this;

		self.initZoomBehaviour();
		self.initClickBackgroundBehaviour();
		self.initResizeBehaviour();
		self.initDeleteModeBehaviour();
		self.initShowLabelsBehaviour();
		self.initClearCanvasBehviour();
	},
	clear: function() {
		GraphVisualizer.linkLayer.selectAll("*").remove();
		GraphVisualizer.nodeLayer.selectAll("*").remove();
		GraphStructure.clearAllData();
		GraphVisualizer.clearAllData();
		Card.resetAllClickableHighLights();
	},
	initZoomBehaviour: function() {
		var self = this;

		self.zoom = d3.zoom()
		    .scaleExtent([0.5, 2])
		    .on("zoom", zoomed);
		d3.select("#relationship-map svg")
			.call(self.zoom)
			.on("dblclick.zoom", null);

		function zoomed() {
			d3.select("#relationship-map svg .zoom-layer")
				.attr("transform", d3.event.transform);
		}
	},
	initClickBackgroundBehaviour: function() {
		var self = this;

		d3.select("#relationship-map svg")
			.on("click", clickBackground);

		function clickBackground() {
			removeStoredAttributePanel();
			var isNodeLayer = $(d3.event.target).closest(".node-layer").length != 0;
			var isLinkLayer = $(d3.event.target).closest(".link-layer").length != 0;
			var isRelationshipMapParent = $(d3.event.target).closest("#relationship-map").length != 0;
			var isTargetDeleted = !isRelationshipMapParent;

			// restore layout if clicked outside
			if (!isNodeLayer && !isLinkLayer && !isTargetDeleted) {
				d3.selectAll(".node").classed("selected", false);
				GraphStructure.updateNodeData();
				GraphStructure.updateLinkData();
				GraphVisualizer.Message.remove();
				GraphVisualizer.Link.update();
				GraphVisualizer.Node.update();
			}
		}

		function removeStoredAttributePanel() {
			var isMouseOnLink = $(".link:hover").length != 0;
			var isLinkSelected = !d3.select(".link.link-selected").empty();

			if (!isMouseOnLink && isLinkSelected)
				StoredAttributesPanel.remove();
		}
	},
	initResizeBehaviour: function() {
		var self = this;

		$("#relationship-map").find(".fa-expand").click(function() {
			// resize chart based on window size
			var relationshipMapSVGWidth = $("#relationship-map svg").width();
			var relationshipMapSVGHeight = $("#relationship-map svg").height();

			GraphVisualizer.graphRadius = (relationshipMapSVGWidth < relationshipMapSVGHeight) ? relationshipMapSVGWidth / 2 * 0.9 : relationshipMapSVGHeight / 2 * 0.9;
			GraphVisualizer.linkLayer
				.transition()
				.attr("transform", "translate(" + relationshipMapSVGWidth / 2 + "," + relationshipMapSVGHeight / 2 + ")");
			GraphVisualizer.nodeLayer
				.transition()
				.attr("transform", "translate(" + relationshipMapSVGWidth / 2 + "," + relationshipMapSVGHeight / 2 + ")");

			// reset zoom
			var relationshipMapSVG = d3.select("#relationship-map svg")
				.transition()
				.attr("transform", d3.zoomIdentity.scale(1));
			self.zoom.transform(relationshipMapSVG, d3.zoomIdentity.scale(1));

			// if there is a centred node (radial layout)
			if (!d3.select(".node.selected").empty()) {
				var centreNodeID = d3.select(".node.selected").datum().nodeID;
				GraphStructure.updateNodeData(centreNodeID);
				GraphStructure.updateLinkData(centreNodeID);
				GraphVisualizer.Message.remove();
				GraphVisualizer.Link.update();
				GraphVisualizer.Node.update();
			}

			// if there is no centered node (normal layout)
			else {
				GraphStructure.updateNodeData();
				GraphStructure.updateLinkData();
				GraphVisualizer.Message.remove();
				GraphVisualizer.Link.update();
				GraphVisualizer.Node.update();
			}
		});

		$("#relationship-map").find(".fa-expand").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();

			// show tooltip
			$("#tooltip")
				.attr("data-tooltip", "Reset Zoom")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$("#relationship-map").find(".fa-expand").mouseleave(function() {
			$("#tooltip").removeClass("show");
		});
	},
	initDeleteModeBehaviour: function() {
		var self = this;

		$("#relationship-map").find(".fa-remove").click(function() {
			if ($(this).hasClass("selected")) {
				$("#tooltip").attr("data-tooltip", "Turn on Delete Mode");
				$(this).removeClass("selected")
			}
			else {
				$("#tooltip").attr("data-tooltip", "Turn off Delete Mode");
				$(this).addClass("selected")
			}
		});

		$("#relationship-map").find(".fa-remove").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();

			if ($(this).hasClass("selected"))
				$("#tooltip").attr("data-tooltip", "Turn off Delete Mode");
			else
				$("#tooltip").attr("data-tooltip", "Turn on Delete Mode");

			// show tooltip
			$("#tooltip")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$("#relationship-map").find(".fa-remove").mouseleave(function() {
			$("#tooltip").removeClass("show");
		});
	},
	initShowLabelsBehaviour: function() {
		var self = this;

		$("#relationship-map").find(".fa-font").click(function() {
			if ($(this).hasClass("selected")) {
				$("#tooltip").attr("data-tooltip", "Show Labels on Links");
				$(this).removeClass("selected");
				GraphVisualizer.Label.removeAll();
			}
			else {
				$("#tooltip").attr("data-tooltip", "Remove all Labels on Links");
				$(this).addClass("selected");
				GraphVisualizer.Label.removeAll();
				GraphVisualizer.Label.drawAll();
			}
		});

		$("#relationship-map").find(".fa-font").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();

			if ($(this).hasClass("selected"))
				$("#tooltip").attr("data-tooltip", "Remove all Labels on Links");
			else
				$("#tooltip").attr("data-tooltip", "Show Labels on Links");

			// show tooltip
			$("#tooltip")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$("#relationship-map").find(".fa-font").mouseleave(function() {
			$("#tooltip").removeClass("show");
		});
	},
	initClearCanvasBehviour: function() {
		var self = this;

		$("#relationship-map").find(".fa-eraser").click(function() {
			self.clear();
		});

		$("#relationship-map").find(".fa-eraser").mouseenter(function() {
			var buttonPosition = $(this).offset();
			var buttonWidth = $(this).width();

			$("#tooltip").attr("data-tooltip", "Clear Canvas");

			// show tooltip
			$("#tooltip")
				.css("top", buttonPosition.top - 5)
				.css("left", buttonPosition.left + buttonWidth / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		});

		$("#relationship-map").find(".fa-eraser").mouseleave(function() {
			$("#tooltip").removeClass("show");
		});
	},
	showLabelOn: function() {
		return $("#relationship-map").find(".fa-font").hasClass("selected");
	}
}