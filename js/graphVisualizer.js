var GraphVisualizer = {
	nodesByID: {}, // el, data
	linksByID: {}, // el, data

	svgGroup: null,
	nodeLayer: null,
	linkLayer: null,
	graphRadius: null,

	init: function() {
		var self = this;
		var relationshipMapSVGWidth = $("#relationship-map svg").width();
		var relationshipMapSVGHeight = $("#relationship-map svg").height();

		self.graphRadius = (relationshipMapSVGWidth < relationshipMapSVGHeight) ? relationshipMapSVGWidth / 2 * 0.9 : relationshipMapSVGHeight / 2 * 0.9;
		self.svgGroup = d3.select("#relationship-map svg").append("g")
			.attr("class", "zoom-layer");
		self.linkLayer = self.svgGroup.append("g")
			.attr("class", "link-layer")
			.attr("transform", "translate(" + relationshipMapSVGWidth / 2 + "," + relationshipMapSVGHeight / 2 + ")");
		self.nodeLayer = self.svgGroup.append("g")
			.attr("class", "node-layer")
			.attr("transform", "translate(" + relationshipMapSVGWidth / 2 + "," + relationshipMapSVGHeight / 2 + ")");

		// compute single character width
		var dummyCharacter = self.svgGroup.append("text")
			.style("font-size", self.Link.textSize)
			.text("M");
		self.Link.singleCharWidth = dummyCharacter.node().getBBox().width;
		dummyCharacter.remove();
	},
	clearAllData: function() {
		var self = this;

		self.nodesByID = {};
		self.linksByID = {};
	},
	Node: {
		strokeColour: "#d3d3d3",
		normalFillColour: "white",
		highlightFillColour: "#ffffe5",
		strokeWidth: 3,
		largeRadius: 20,
		smallRadius: 8,
		textColour: "black",
		largeTextSize: 12,
		smallTextSize: 10,
		textGapFromNode: 10,

		update: function() {
			var self = GraphVisualizer;

			self.Node.updateNodesByID()
			self.Node.updateNodesInCanvas();
		},
		updateNodesByID: function() {
			var self = GraphVisualizer;

			// remove deleted nodes
			for (var currentVisibleNodeID in self.nodesByID) {
				if (!(currentVisibleNodeID in GraphStructure.nodeDataByID)) {
					self.nodesByID[currentVisibleNodeID].el.remove();
					delete self.nodesByID[currentVisibleNodeID];
				}
			}

			for (var currentNodeID in GraphStructure.nodeDataByID) {
				// add new nodes
				if (!(currentNodeID in self.nodesByID)) {
					var currentNodeData = GraphStructure.nodeDataByID[currentNodeID];
					var currentNodeX = currentNodeData.x;
					var currentNodeY = currentNodeData.y;
					var currentNodeRadius = currentNodeData.r;
					var currentNodeColour = currentNodeData.circleColour;
					var currentNodeTextDy = currentNodeData.textDy;
					var currentNodeName = currentNodeData.nodeInfo.name;
					var currentNodeObject = self.nodeLayer.append("g")
						.datum(currentNodeData)
						.attr("class", "node")
						.style("cursor", "pointer")
						.on("click", self.Node.click)
						.on("mouseenter", self.Node.mouseenter)
						.on("mouseleave", self.Node.mouseleave);

					currentNodeObject.append("circle")
						.attr("cx", currentNodeX)
						.attr("cy", currentNodeY)
						.style("stroke-width", self.Node.strokeWidth)
						.style("stroke", self.Node.strokeColour)
						.style("fill", currentNodeColour)
						.attr("r", currentNodeRadius / 2);
					currentNodeObject.append("text")
						.attr("class", "background")
						.attr("x", currentNodeX)
						.attr("y", currentNodeY + currentNodeTextDy)
						.style("text-anchor", "middle")
						.style("alignment-baseline", "middle")
						.style("fill", "white")
						.style("stroke", "white")
						.style("stroke-width", 3)
						.style("font-size", 5)
						.style("font-weight", "bold")
						.text(currentNodeName);
					currentNodeObject.append("text")
						.attr("class", "name")
						.attr("x", currentNodeX)
						.attr("y", currentNodeY + currentNodeTextDy)
						.style("text-anchor", "middle")
						.style("alignment-baseline", "middle")
						.style("fill", self.Node.textColour)
						.style("font-size", 5)
						.text(currentNodeName);

					self.nodesByID[currentNodeID] = {
						el: currentNodeObject,
						data: currentNodeData
					};
				}

				// update existing nodes
				else {
					var currentNodeData = GraphStructure.nodeDataByID[currentNodeID];
					self.nodesByID[currentNodeID].data = currentNodeData;
					self.nodesByID[currentNodeID].el.datum(currentNodeData);
				}
			}
		},
		updateNodesInCanvas: function() {
			var self = GraphVisualizer;

			for (var currentNodeID in self.nodesByID) {
				var currentNodeObject = self.nodesByID[currentNodeID].el;
				var currentNodeData = self.nodesByID[currentNodeID].data;
				var currentNodeX = currentNodeData.x;
				var currentNodeY = currentNodeData.y;
				var currentNodeRadius = currentNodeData.r;
				var currentNodeColour = currentNodeData.circleColour;
				var currentNodeTextSize = currentNodeData.textSize;
				var currentNodeTextDy = currentNodeData.textDy;
				var currentNodeTextWeight = currentNodeData.textWeight;
				var currentNodeText = currentNodeData.nodeInfo.name;

				currentNodeObject.select("circle")
					.transition()
					.attr("cx", currentNodeX)
					.attr("cy", currentNodeY)
					.attr("r", currentNodeRadius);
				currentNodeObject.select("text.background")
					.text(currentNodeText)
					.transition()
					.attr("x", currentNodeX)
					.attr("y", currentNodeY + currentNodeTextDy)
					.style("font-size", currentNodeTextSize);
				currentNodeObject.select("text.name")
					.text(currentNodeText)
					.style("font-weight", currentNodeTextWeight)
					.transition()
					.attr("x", currentNodeX)
					.attr("y", currentNodeY + currentNodeTextDy)
					.style("font-size", currentNodeTextSize);

				if (!self.SelectedLink.containNode(currentNodeID))
					currentNodeObject.select("circle")
						.style("fill", currentNodeColour);
			}
		},
		click: function() {
			var self = GraphVisualizer;
			var isDeleteModeOn = $("#relationship-map").find(".fa-remove").hasClass("selected");

			if (!isDeleteModeOn) {
				// restore layout
				if (d3.select(this).classed("selected")) {
					d3.select(this).classed("selected", false);

					GraphStructure.updateNodeData();
					GraphStructure.updateLinkData();
					GraphVisualizer.Message.remove();
					GraphVisualizer.Link.update();
					GraphVisualizer.Node.update();
				}

				// centre the selected node
				else {
					d3.selectAll(".node").classed("selected", false);
					d3.select(this).classed("selected", true);
					d3.select(this).moveToBack();
					var centreNodeID = d3.select(this).datum().nodeID;
		
					GraphStructure.updateNodeData(centreNodeID);
					GraphStructure.updateLinkData(centreNodeID);
					GraphVisualizer.Message.remove();
					GraphVisualizer.Link.update();
					GraphVisualizer.Node.update();
				}
			}
			
			if (isDeleteModeOn) {
				var isRadialLayout = !d3.selectAll(".node.selected").empty();
				var isDeletingCentreNode = d3.select(this).classed("selected");
				var deletingNodeID = d3.select(this).datum().nodeID;

				// delete in normal layout
				if (!isRadialLayout || isRadialLayout && isDeletingCentreNode) {
					GraphStructure.removeNodeFromAdjMatrix(deletingNodeID);
					GraphStructure.updateNodeData();
					GraphStructure.updateLinkData();
					GraphVisualizer.Message.remove();
					GraphVisualizer.Link.update();
					GraphVisualizer.Node.update();
				}
				
				// delete in radial layout
				else {
					var centreNodeID = d3.select(".node.selected").datum().nodeID;
					GraphStructure.removeNodeFromAdjMatrix(deletingNodeID);
					GraphStructure.updateNodeData(centreNodeID);
					GraphStructure.updateLinkData(centreNodeID);
					GraphVisualizer.Message.remove();
					GraphVisualizer.Link.update();
					GraphVisualizer.Node.update();
				}
			}
		},
		mouseenter: function() {
			var self = GraphVisualizer;

			d3.select(this).moveToFront();
			d3.select(this).select("circle")
				.style("fill", self.Node.highlightFillColour);
		},
		mouseleave: function() {
			var self = GraphVisualizer;
			var hoveredNodeID = d3.select(this).datum().nodeID;
			var originalNodeColour =  d3.select(this).datum().circleColour;

			if (!self.SelectedLink.containNode(hoveredNodeID))
				d3.select(this).select("circle")
					.style("fill", originalNodeColour);
		}
	},
	SelectedLink: {
		containNode: function(nodeID) {
			var isSelectedLinkConnectHoveredNode = false;
			var isLinkSelected = !d3.select(".link.link-selected").empty();

			if (isLinkSelected) {
				var selectedLinkID = d3.select(".link.link-selected").datum().linkID;
				var node1ID = selectedLinkID.split("-")[0];
				var node2ID = selectedLinkID.split("-")[1];

				if (node1ID == nodeID || node2ID == nodeID)
					isSelectedLinkConnectHoveredNode = true;
			}

			return isSelectedLinkConnectHoveredNode;
		}
	},
	Link: {
		strokeColour: "#d3d3d3",
		thinStrokeWidth: 5,
		thickStrokeWidth: 10,
		gapFromNode: 10,
		highOpacity: 0.3,
		mouseoverOpacity: 0.5,
		clickOpacity: 0.7,
		lowOpacity: 0.05,
		textSize: 10,
		singleCharWidth: null,

		update: function(messageInfo = null) {
			var self = GraphVisualizer;

			self.Link.updateLinksByID();
			self.Link.updateLinksInCanvas(messageInfo);
		},
		updateLinksByID: function() {
			var self = GraphVisualizer;

			// remove deleted links
			for (var currentVisibleLinkID in self.linksByID) {
				if (!(currentVisibleLinkID in GraphStructure.linkDataByID)) {
					self.linksByID[currentVisibleLinkID].el.remove();
					delete self.linksByID[currentVisibleLinkID];
				}
			}

			for (var currentLinkID in GraphStructure.linkDataByID) {
				// add new links
				if (!(currentLinkID in self.linksByID)) {
					var pathID = "link" + currentLinkID;
					var currentLinkData = GraphStructure.linkDataByID[currentLinkID];
					var currentLinkOpacity = currentLinkData.opacity;
					var currentLinkStrokeWidth = currentLinkData.strokeWidth;
					var currentLinkPathData = currentLinkData.pathData;
					var currentLinkObject = self.linkLayer.append("g")
						.datum(currentLinkData)
						.style("cursor", "pointer")
						.attr("class", "link")
						.on("click", self.Link.click)
						.on("mouseenter", self.Link.mouseenter)
						.on("mouseleave", self.Link.mouseleave);

					currentLinkObject.append("path")
						.attr("id", pathID)
						.attr("d", currentLinkPathData)
						.style("opacity", currentLinkOpacity)
						.style("stroke", self.Link.strokeColour)
						.style("stroke-width", currentLinkStrokeWidth)
						.style("fill", "none")
						.style("stroke-linecap", "round");

					self.linksByID[currentLinkID] = {
						el: currentLinkObject,
						data: currentLinkData
					};

					if (RelationshipMap.showLabelOn())
						self.Label.drawOne(currentLinkID);
				}

				// update existing links
				else {
					var currentLinkData = GraphStructure.linkDataByID[currentLinkID];
					self.linksByID[currentLinkID].data = currentLinkData;
					self.linksByID[currentLinkID].el.datum(currentLinkData);
				}
			}
		},
		updateLinksInCanvas: function(messageInfo = null) {
			var self = GraphVisualizer;

			for (var currentLinkID in self.linksByID) {
				var currentLinkObject = self.linksByID[currentLinkID].el;
				var currentLinkData = self.linksByID[currentLinkID].data;
				var currentLinkOpacity = currentLinkData.opacity;
				var currentLinkStrokeWidth = currentLinkData.strokeWidth;
				var currentLinkPathData = currentLinkData.pathData;
				var transitions = 0;

				currentLinkObject.select("path")
					.transition()
					.attr("d", currentLinkPathData)
					.style("opacity", currentLinkOpacity)
					.style("stroke-width", currentLinkStrokeWidth)
					.on("start", function() {
						if (messageInfo && transitions++ == 0 && RelationshipMap.showLabelOn()) {
							var linkID = messageInfo.linkID;
							var linkObject = self.linksByID[linkID].el;
							var labelGroup = linkObject.select("g.label");
							labelGroup.style("opacity", 0);
						}
					})
					.on("end", function(d, i) {
						if (messageInfo && --transitions === 0)
							self.Message.display(messageInfo);
					});

				if (RelationshipMap.showLabelOn())
					self.Label.updateAll();
			}
		},
		highlightOnClick: function(linkEl) {
			var self = GraphVisualizer;
			var linkData = d3.select(linkEl).datum();
			var linkID = linkData.linkID;
			var node1ID = linkData.node1.nodeID;
			var node2ID = linkData.node2.nodeID;
			var node1Object = self.nodesByID[node1ID].el;
			var node2Object = self.nodesByID[node2ID].el;

			d3.select(linkEl).select("path")
				.style("opacity", self.Link.clickOpacity);
			node1Object.select("circle")
				.style("fill", self.Node.highlightFillColour);
			node2Object.select("circle")
				.style("fill", self.Node.highlightFillColour);
			self.Label.collapse(linkID);
		},
		highlightOnMouseover: function(linkEl) {
			var self = GraphVisualizer;
			var linkData = d3.select(linkEl).datum();
			var linkID = linkData.linkID;
			var node1ID = linkData.node1.nodeID;
			var node2ID = linkData.node2.nodeID;
			var node1Object = self.nodesByID[node1ID].el;
			var node2Object = self.nodesByID[node2ID].el;

			d3.select(linkEl).select("path")
				.style("opacity", self.Link.mouseoverOpacity);
			node1Object.select("circle")
				.style("fill", self.Node.highlightFillColour);
			node2Object.select("circle")
				.style("fill", self.Node.highlightFillColour);
			self.Label.expand(linkID);
		},
		removeHighlight: function(linkEl) {
			var self = GraphVisualizer;
			var linkData = d3.select(linkEl).datum();
			var linkID = linkData.linkID;
			var node1ID = linkData.node1.nodeID;
			var node2ID = linkData.node2.nodeID;
			var node1Object = self.nodesByID[node1ID].el;
			var node2Object = self.nodesByID[node2ID].el;

			d3.select(linkEl).select("path")
				.style("opacity", linkData.opacity);

			if (!self.SelectedLink.containNode(node1ID)) {
				var originalNodeColour =  self.nodesByID[node1ID].data.circleColour;
				node1Object.select("circle").style("fill", originalNodeColour);
			}
			if (!self.SelectedLink.containNode(node2ID)) {
				var originalNodeColour =  self.nodesByID[node2ID].data.circleColour;
				node2Object.select("circle").style("fill", originalNodeColour);
			}
					
			self.Label.collapse(linkID);
		},
		click: function() {
			var self = GraphVisualizer;
			var isDeleteModeOn = $("#relationship-map").find(".fa-remove").hasClass("selected");
			
			if (!isDeleteModeOn) {
				var clickedLinkAlreadySelected = d3.select(this).classed("link-selected");

				if (clickedLinkAlreadySelected) {
					StoredAttributesPanel.remove();
				}

				if (!clickedLinkAlreadySelected) {
					// remove previous
					if (!d3.select(".link.link-selected").empty()) {
						var highlightedLinkEl = d3.select(".link.link-selected").node();
						$(".link-selected").removeClass("link-selected");
						GraphVisualizer.Link.removeHighlight(highlightedLinkEl);
					}

					// render new
					d3.select(this).classed("link-selected", true);
					self.Link.highlightOnClick(this);
					StoredAttributesPanel.updateAndShow(this);
				}
			}
			if (isDeleteModeOn) {
				var isRadialLayout = !d3.selectAll(".node.selected").empty();
				var deletingLinkID = d3.select(this).datum().linkID;

				// delete in normal layout
				if (!isRadialLayout) {
					GraphStructure.removeLinkFromAdjMatrix(deletingLinkID);
					GraphStructure.updateNodeData();
					GraphStructure.updateLinkData();
					GraphVisualizer.Message.remove();
					GraphVisualizer.Link.update();
					GraphVisualizer.Node.update();
				}

				// delete in radial layout
				if (isRadialLayout) {
					var centreNodeID = d3.select(".node.selected").datum().nodeID;
					GraphStructure.removeLinkFromAdjMatrix(deletingLinkID);
					GraphStructure.updateNodeData(centreNodeID);
					GraphStructure.updateLinkData(centreNodeID);
					GraphVisualizer.Message.remove();
					GraphVisualizer.Link.update();
					GraphVisualizer.Node.update();
				}
			}
		},
		mouseenter: function() {
			if (d3.select(this).classed("link-selected"))
				return;

			GraphVisualizer.Link.highlightOnMouseover(this);
		},
		mouseleave: function() {
			if (d3.select(this).classed("link-selected"))
				return;

			GraphVisualizer.Link.removeHighlight(this);
		}
	},
	Message: {
		showTime: 500,

		display: function(messageInfo) {
			var self = GraphVisualizer;
			var linkID = messageInfo.linkID;
			var linkObject = self.linksByID[linkID].el;
			var pathSVG = linkObject.select("path");
			var linkLength = pathSVG.node().getTotalLength();
			var linkMiddlePoint = pathSVG.node().getPointAtLength(linkLength / 2);
			var similarOrDifferent = messageInfo.similarOrDifferent;
			var numberOfAttributes = messageInfo.numberOfAttributes;
			var textColour = "";
			var similarOrDifferentText = ""

			// determine text and color
			if (similarOrDifferent == "similar") {
				similarOrDifferentText = "similar";
				textColour = ColourManager.similarColour;
			}
			else if (similarOrDifferent == "different") {
				similarOrDifferentText = "different";
				textColour = ColourManager.differentColour;
			}
			else {
				similarOrDifferentText = "neither similar nor different";
				textColour = ColourManager.neitherSimilarNorDifferentColour;
			}

			// highlight link object
			var pathData = pathSVG.attr("d");
			var strokeWidth = linkObject.datum().strokeWidth;
			var dummyLink = self.nodeLayer.append("path")
				.attr("class", "message")
				.attr("d", pathData)
				.style("stroke-width", strokeWidth)
				.style("stroke", self.Link.strokeColour)
				.style("fill", "none")
				.style("stroke-linecap", "round")
				.style("opacity", 0.6)
				.on("mouseenter", self.Message.mouseenter)
				.transition()
				.on("start", function() {
					var hasLabel = !linkObject.select("g.label").empty();

					// hide the labels
					if (hasLabel) {
						linkObject.select("g.label")
							.style("opacity", 0);
					}
				})
				.style("stroke", textColour)
				.transition()
				.delay(self.Message.showTime)
				.style("stroke", self.Link.strokeColour)
				.on("end", function() {
					var hasLabel = !linkObject.select("g.label").empty();

					// show the label again and remove the dummy link
					if (hasLabel) {
						linkObject.select("g.label")
							.style("opacity", 1);
					}
					d3.select(this).remove(); 
				});

			// show in node layer to prevent occlusion
			var messageObject = self.nodeLayer.append("g")
				.attr("class", "message")
				.on("mouseenter", self.Message.mouseenter);
			var groupBackground = messageObject.append("rect");
			var textBackground = messageObject.append("rect");
			var messageText1 = messageObject.append("text");
			var messageText2 = messageObject.append("text");
			var messageText3 = messageObject.append("text");

			var message1Text = messageInfo.removeAttribute ? "Removed " : "Added ";
			self.Message.renderText(messageText1, {
				x: linkMiddlePoint.x, 
				y: linkMiddlePoint.y, 
				fill: textColour,
				text: message1Text
			});
			
			var bbox = messageText1.node().getBBox();
			self.Message.renderText(messageText2, {
				x: bbox.x + bbox.width + 5,
				y: linkMiddlePoint.y,
				fill: "white",
				text: numberOfAttributes
			});
			
			var bbox = messageText2.node().getBBox();
			self.Message.renderRect(textBackground, {
				x: bbox.x - 2,
				y: bbox.y + 2, 
				width: bbox.width + 4,
				height: bbox.height - 4,
				stroke: "none",
				fill: textColour,
				opacity: 1
			});
			self.Message.renderText(messageText3, {
				x: bbox.x + bbox.width + 5,
				y: linkMiddlePoint.y,
				fill: textColour,
				text: (numberOfAttributes > 1) ? " " + similarOrDifferentText + " attributes" : " " + similarOrDifferentText + " attribute"
			});
			
			var bbox = messageObject.node().getBBox();
			var onEnd = function() { messageObject.remove(); };
			self.Message.renderRect(groupBackground, {
				x: bbox.x - 5,
				y: bbox.y - 2,
				width: bbox.width + 10,
				height: bbox.height + 4,
				stroke: textColour,
				fill: "white",
				opacity: 0.8
			}, onEnd);

			messageObject
				.attr("transform", "translate(" + (- bbox.width / 2) + ", 0)");
		},
		renderText: function(textSVG, css) {
			var self = GraphVisualizer;

			textSVG
				.attr("x", css.x)
				.attr("y", css.y)
				.style("opacity", 0)
				.style("alignment-baseline", "middle")
				.style("fill", css.fill)
				.style("font-size", 11)
				.text(css.text)
				.transition()
				.style("opacity", 1)
				.transition()
				.delay(self.Message.showTime)
				.style("opacity", 0);
		},
		renderRect: function(rectSVG, css, onEnd = null) {
			var self = GraphVisualizer;

			rectSVG
				.attr("x", css.x)
				.attr("y", css.y)
				.attr("width", css.width)
				.attr("height", css.height)
				.attr("rx", 3)
				.attr("ry", 3)
				.style("opacity", 0)
				.style("fill", css.fill)
				.style("stroke", css.stroke);

			if (onEnd) {
				rectSVG
					.transition()
					.style("opacity", css.opacity)
					.transition()
					.delay(self.Message.showTime)
					.style("opacity", 0)
					.on("end", onEnd);
			}
			else {
				rectSVG
					.transition()
					.style("opacity", css.opacity)
					.transition()
					.delay(self.Message.showTime)
					.style("opacity", 0);
			}
		},
		remove: function() {
			d3.selectAll(".message").remove();
		},
		mouseenter: function() {
			var self = GraphVisualizer;

			self.Message.remove();
		}
	},
	Label: {
		expand: function(linkID) {
			var self = GraphVisualizer;
			var linkObject = self.linksByID[linkID].el;
			var linkData = self.linksByID[linkID].data;
			var labelGroup = linkObject.select("g.label");

			if (labelGroup.empty()) {
				// draw
				labelGroup = linkObject.append("g").attr("class", "label");
				self.Label.updateOne(labelGroup, linkData, true);

				// translate
				var pathSVG = linkObject.select("path");
				var linkLength = pathSVG.node().getTotalLength();
				var linkMiddlePoint = pathSVG.node().getPointAtLength(linkLength / 2);
				var labelBBox = labelGroup.node().getBBox();
				var labelTranslateX = linkMiddlePoint.x;
				var labelTranslateY = linkMiddlePoint.y;
				var translateString = "translate(" + labelTranslateX + "," + labelTranslateY + ")";
				labelGroup.attr("transform", translateString);
			}
			else {
				self.Label.updateOne(labelGroup, linkData, true);
			}
		},
		collapse: function(linkID) {
			var self = GraphVisualizer;
			var linkObject = self.linksByID[linkID].el;
			var linkData = self.linksByID[linkID].data;
			var labelGroup = linkObject.select("g.label");

			if (RelationshipMap.showLabelOn())
				self.Label.updateOne(labelGroup, linkData);
			if (!RelationshipMap.showLabelOn())
				self.Label.removeAll();
		},
		drawOne: function(linkID) {
			var self = GraphVisualizer;
			var currentLinkObject = self.linksByID[linkID].el;
			var currentLinkData = self.linksByID[linkID].data;
			var pathSVG = currentLinkObject.select("path");
			var linkLength = pathSVG.node().getTotalLength();
			var linkMiddlePoint = pathSVG.node().getPointAtLength(linkLength / 2);

			// draw label
			var labelGroup = currentLinkObject.append("g").attr("class", "label");
			self.Label.updateOne(labelGroup, currentLinkData);

			// translate label
			var labelBBox = labelGroup.node().getBBox();
			var labelTranslateX = linkMiddlePoint.x - labelBBox.width / 2;
			var labelTranslateY = linkMiddlePoint.y;
			var translateString = "translate(" + labelTranslateX + "," + labelTranslateY + ")";
			labelGroup.attr("transform", translateString);
		},
		updateOne: function(labelGroup, linkData, expand = false) {
			var self = GraphVisualizer;
			var tagBBox = { x: 0, width: 0};

			// prepare the structure
			for (var similarOrDifferent in linkData.linkInfo) {
				if (labelGroup.select("rect." + similarOrDifferent).empty())
					labelGroup.append("rect").attr("class", similarOrDifferent);
				if (labelGroup.select("text." + similarOrDifferent).empty())
					labelGroup.append("text").attr("class", similarOrDifferent);
			}
			labelGroup.selectAll("text.extra-text").remove();

			// draw
			for (var similarOrDifferent in linkData.linkInfo) {
				var countForCurrentSimilarOrDifferent = Object.keys(linkData.linkInfo[similarOrDifferent]).length;
				var rectColor = ColourManager[similarOrDifferent + "Colour"];
				var rectOpacity = (linkData.opacity == self.Link.lowOpacity && !expand) ? linkData.opacity : 0.7;

				var text = labelGroup.select("text." + similarOrDifferent)
					.attr("x", tagBBox.x + tagBBox.width)
					.attr("y", 0)
					.style("alignment-baseline", "middle")
					.style("font-size", 11)
					.style("fill", "white")
					.text(countForCurrentSimilarOrDifferent);

				var textBBox = text.node().getBBox();
				var rect = labelGroup.select("rect." + similarOrDifferent)
					.attr("x", textBBox.x - 3)
					.attr("y", textBBox.y)
					.attr("rx", 3)
					.attr("ry", 3)
					.attr("width", textBBox.width + 6)
					.attr("height", textBBox.height)
					.style("fill", rectColor)
					.style("opacity", rectOpacity);

				tagBBox = rect.node().getBBox();
				tagBBox.x += 5; // add gap

				if (expand) {
					var rectBBox = rect.node().getBBox();
					var extraTextShown = "";
					if (similarOrDifferent == "similar")
						extraTextShown = " similar attributes stored";
					else if (similarOrDifferent == "different")
						extraTextShown = " different attributes stored";
					else
						extraTextShown = " neither similar nor different attributes stored";

					labelGroup.append("text")
						.attr("class", "extra-text")
						.attr("x", rectBBox.x + rectBBox.width + 3)
						.attr("y", 0)
						.style("alignment-baseline", "middle")
						.style("fill", rectColor)
						.text(extraTextShown);

					tagBBox = labelGroup.node().getBBox();
					tagBBox.x += 7; // add gap
				}
			}
		},
		drawAll: function() {
			var self = GraphVisualizer;

			for (currentLinkID in self.linksByID)
				self.Label.drawOne(currentLinkID);
		},
		updateAll: function() {
			var self = GraphVisualizer;

			for (currentLinkID in self.linksByID) {
				var currentLinkObject = self.linksByID[currentLinkID].el;
				var currentLinkData = self.linksByID[currentLinkID].data;
				var dummyPathSVG = currentLinkObject.append("path").attr("d", currentLinkData.pathData).style("opacity", 0);
				var linkLength = dummyPathSVG.node().getTotalLength();
				var linkMiddlePoint = dummyPathSVG.node().getPointAtLength(linkLength / 2);		
				dummyPathSVG.remove();

				// update label content
				var labelGroup = currentLinkObject.select("g.label");
				self.Label.updateOne(labelGroup, currentLinkData);

				// translate label
				var labelBBox = labelGroup.node().getBBox();
				var newLabelTranslateX = linkMiddlePoint.x - labelBBox.width / 2;
				var newLabelTranslateY = linkMiddlePoint.y;
				var translateString = "translate(" + newLabelTranslateX + "," + newLabelTranslateY + ")";
				labelGroup.transition().attr("transform", translateString);
			}
		},
		removeAll: function() {
			var self = GraphVisualizer;

			self.linkLayer.selectAll(".label").remove();
		}
	}
}