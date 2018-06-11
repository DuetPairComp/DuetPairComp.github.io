var GraphStructure = {
	adjacencyMatrix: {},
	nodeInfoDict: {},
	linkInfoDict: {},
	nextNodeID: 0,

	// derived from matrix and nodeInfo
	similarityScores: {},
	nodeDataByID: {}, // { nodeID, x, y }
	linkDataByID: {}, // { node1, node2, pathData }

	clearAllData: function() {
		var self = this;

		self.adjacencyMatrix = {};
		self.nodeInfoDict = {};
		self.linkInfoDict = {};
		self.nextNodeID = 0;
		self.similarityScores = {};
		self.nodeDataByID = {};
		self.linkDataByID = {};
	},
	addToAdjMatrix: function(node1Info, node2Info) {
		var self = this;
		var node1ID = self.getNodeID(node1Info);
		var node2ID = self.getNodeID(node2Info);

		if (!self.adjacencyMatrix[node1ID])
			self.adjacencyMatrix[node1ID] = [];
		if (!self.adjacencyMatrix[node2ID])
			self.adjacencyMatrix[node2ID] = [];

		if (self.adjacencyMatrix[node1ID].indexOf(node2ID) == -1)
			self.adjacencyMatrix[node1ID].push(node2ID);
		if (self.adjacencyMatrix[node2ID].indexOf(node1ID) == -1)
			self.adjacencyMatrix[node2ID].push(node1ID);
	},
	addAttrToLink: function(node1Info, node2Info, attrStoreToLinkInfo, similarOrDifferent) {
		var self = this;
		var node1ID = self.getNodeID(node1Info);
		var node2ID = self.getNodeID(node2Info);
		var linkID = self.getLinkID(node1ID, node2ID);
		var topGroupNodeIDString = "nodeID=" + node1ID; // need to make sure group 1 is always the top group!!
		var bottomGroupNodeIDString = "nodeID=" + node2ID; // need to make sure group 2 is always the bottom group!!
		var numberOfAttrChanged = 0;
		
		if (!(linkID in self.linkInfoDict))
			self.linkInfoDict[linkID] = {};
		if (!(similarOrDifferent in self.linkInfoDict[linkID]))
			self.linkInfoDict[linkID][similarOrDifferent] = {}

		for (var currentAttr in attrStoreToLinkInfo) {
			// see if the current attribute is already added and count
			if (!(currentAttr in self.linkInfoDict[linkID][similarOrDifferent]))
				numberOfAttrChanged++;

			// reconstruct probability object of an attribute
			var probabilityForEachValue = [];
			var currentBarChartData = attrStoreToLinkInfo[currentAttr];
			var hasDiscretized = "binNumber" in currentBarChartData[0];
			for (var i = 0; i < currentBarChartData.length; i++) {
				var currentValue = currentBarChartData[i]["value"];
				var valueObject = { value: null, probability: {} };

				valueObject["value"] = currentValue;
				valueObject["probability"][topGroupNodeIDString] = currentBarChartData[i]["probability"]["top"];
				valueObject["probability"][bottomGroupNodeIDString] = currentBarChartData[i]["probability"]["bottom"];
				if (hasDiscretized) {
					valueObject["binNumber"] = currentBarChartData[i]["binNumber"];
					valueObject["min"] = currentBarChartData[i]["min"];
					valueObject["max"] = currentBarChartData[i]["max"];
				}

				probabilityForEachValue.push(valueObject);
			}

			// store the new probability object
			self.linkInfoDict[linkID][similarOrDifferent][currentAttr] = probabilityForEachValue;
		}

		// update card after changing linkInfo
		Card.resetAllClickableHighLights();

		return { linkID: linkID, numberOfAttrChanged: numberOfAttrChanged };
	},
	removeAttrFromLink: function(node1Info, node2Info, deletingAttrList, similarOrDifferent) {
		var self = this;
		var node1ID = self.getNodeID(node1Info);
		var node2ID = self.getNodeID(node2Info);
		var linkID = self.getLinkID(node1ID, node2ID);
		var attrInLink = self.linkInfoDict[linkID][similarOrDifferent];
		var numberOfAttrChanged = 0;

		// delete attribute
		for (var deletingAttr in deletingAttrList) {
			if (deletingAttr in attrInLink) {
				numberOfAttrChanged++;
				delete attrInLink[deletingAttr];
			}
		}

		// delete similarOrDifferent when there is no attribute
		for (var similarOrDifferent in self.linkInfoDict[linkID]) {
			var currentAttrCount = Object.keys(self.linkInfoDict[linkID][similarOrDifferent]).length;
			if (currentAttrCount == 0)
				delete self.linkInfoDict[linkID][similarOrDifferent];
		}

		// delete link when there is no attribute
		var similarOrDifferentCount = Object.keys(self.linkInfoDict[linkID]).length;
		if (similarOrDifferentCount == 0)
			delete self.linkInfoDict[linkID];

		// update card after changing linkInfo
		Card.resetAllClickableHighLights();

		// delete the two nodes if needed
		if (linkID in self.linkInfoDict) {
			return { linkID: linkID, numberOfAttrChanged: numberOfAttrChanged };
		}

		if (!(linkID in self.linkInfoDict)) {
			var numberOfNodesConnectingNode1 = self.adjacencyMatrix[node1ID].length;
			var numberOfNodesConnectingNode2 = self.adjacencyMatrix[node2ID].length;

			if (numberOfNodesConnectingNode1 == 1) {
				delete self.adjacencyMatrix[node1ID];
				delete self.nodeInfoDict[node1ID];

				if (node2ID in self.adjacencyMatrix) {
					var nodesConnectingNode2 = self.adjacencyMatrix[node2ID];
					for (var i = 0; i < nodesConnectingNode2.length; i++) {
						var connectingNodeID = nodesConnectingNode2[i];
						if (connectingNodeID == node1ID)
							self.adjacencyMatrix[node2ID].splice(i, 1);
					}
				}
			}
			if (numberOfNodesConnectingNode2 == 1) {
				delete self.adjacencyMatrix[node2ID];
				delete self.nodeInfoDict[node2ID];

				if (node1ID in self.adjacencyMatrix) {
					var nodesConnectingNode1 = self.adjacencyMatrix[node1ID];
					for (var i = 0; i < nodesConnectingNode1.length; i++) {
						var connectingNodeID = nodesConnectingNode1[i];
						if (connectingNodeID == node2ID)
							self.adjacencyMatrix[node1ID].splice(i, 1);
					}
				}
			}

			return { linkID: null, numberOfAttrChanged: numberOfAttrChanged };
		}	
	},
	removeNodeFromAdjMatrix: function(deletingNodeID) {
		var self = this;

		delete self.adjacencyMatrix[deletingNodeID];
		delete self.nodeInfoDict[deletingNodeID];

		for (var currentNodeID in self.adjacencyMatrix) {
			var nodesConnectingCurrentNode = self.adjacencyMatrix[currentNodeID];

			for (var i = 0; i < nodesConnectingCurrentNode.length; i++) {
				var connectingNodeID = nodesConnectingCurrentNode[i];

				// remove from adjacency matrix and link info
				if (connectingNodeID == deletingNodeID) {
					var deletingLinkID = self.getLinkID(deletingNodeID, currentNodeID);
					self.adjacencyMatrix[currentNodeID].splice(i, 1);
					delete self.linkInfoDict[deletingLinkID];
				}
			}
		}

		// update card after changing linkInfo
		Card.resetAllClickableHighLights();
	},
	removeLinkFromAdjMatrix: function(deletingLinkID) {
		var self = this;
		var node1ID = deletingLinkID.split("-")[0];
		var node2ID = deletingLinkID.split("-")[1];

		delete self.linkInfoDict[deletingLinkID];

		// delete node2 from node1's list
		var nodesConnectingNode1 = self.adjacencyMatrix[node1ID];
		for (var i = 0; i < nodesConnectingNode1.length; i++) {
			var connectingNodeID = nodesConnectingNode1[i];

			if (connectingNodeID == node2ID)
				self.adjacencyMatrix[node1ID].splice(i, 1);
		}

		// delete node1 from node2's list
		var nodesConnectingNode2 = self.adjacencyMatrix[node2ID];
		for (var i = 0; i < nodesConnectingNode2.length; i++) {
			var connectingNodeID = nodesConnectingNode2[i];

			if (connectingNodeID == node1ID)
				self.adjacencyMatrix[node2ID].splice(i, 1);
		}

		// update card after changing linkInfo
		Card.resetAllClickableHighLights();
	},
	updateNodeData: function(centreNodeID = null) {
		var self = this;

		if (centreNodeID != null)
			self.generateRadialLayoutData(centreNodeID);
		else
			self.generateNormalLayoutData();
	},
	generateNormalLayoutData: function() {
		var self = this;
		var numberOfNodes = Object.keys(self.adjacencyMatrix).length;
		var currentNodeIndex = 0;
		self.nodeDataByID = {};

		for (var currentNodeID in self.adjacencyMatrix) {
			var currentNodeAngle = Math.PI * 2 / numberOfNodes * currentNodeIndex;
			var currentNodeX = GraphVisualizer.graphRadius * Math.cos(currentNodeAngle);
			var currentNodeY = GraphVisualizer.graphRadius * Math.sin(currentNodeAngle);
			var currentNodeData = { 
				nodeID: currentNodeID,
				nodeInfo: self.nodeInfoDict[currentNodeID],
				x: currentNodeX,
				y: currentNodeY,
				r: GraphVisualizer.Node.largeRadius,
				circleColour: GraphVisualizer.Node.normalFillColour,
				textSize: GraphVisualizer.Node.largeTextSize,
				textWeight: null,
				textDy: 0
			};
			
			self.nodeDataByID[currentNodeID] = currentNodeData;
			currentNodeIndex++;
		}
	},
	generateRadialLayoutData: function(centreNodeID) {
		var self = this;
		var numberOfNodes = Object.keys(self.adjacencyMatrix).length - 1;
		var currentNodeIndex = 0;
		self.nodeDataByID = {};

		// compute scale
		var allAttributes = Database.numericalAttr.concat(Database.categoricalAttr);
		var numberOfNotExcludedAttributes = allAttributes.length - Database.excludedCategoricalAttr.length;
		var radialDistanceScale = d3.scaleLinear()
			.domain([0, numberOfNotExcludedAttributes])
			.range([0, GraphVisualizer.graphRadius]);
		var colourScale = d3.scaleLinear()
			.domain([0, numberOfNotExcludedAttributes / 2, numberOfNotExcludedAttributes])
			.range([ColourManager.similarColour, "#FFFFFF", ColourManager.differentColour]);

		// centre node
		var centreNodeData = {
			nodeID: centreNodeID,
			nodeInfo: self.nodeInfoDict[centreNodeID],
			x: 0,
			y: 0,
			r: GraphVisualizer.Node.largeRadius,
			circleColour: GraphVisualizer.Node.highlightFillColour,
			textSize: GraphVisualizer.Node.largeTextSize,
			textWeight: "bold",
			textDy: 0
		};
		self.nodeDataByID[centreNodeID] = centreNodeData;

		// other nodes
		for (var currentNodeID in self.adjacencyMatrix) {
			if (currentNodeID != centreNodeID) {
				var currentNodeAngle = Math.PI * 2 / numberOfNodes * currentNodeIndex;
				var currentNodeSimilarityWithCentreNode = self.similarityScores[centreNodeID][currentNodeID];
				var currentNodeX = radialDistanceScale(currentNodeSimilarityWithCentreNode) * Math.cos(currentNodeAngle);
				var currentNodeY = radialDistanceScale(currentNodeSimilarityWithCentreNode) * Math.sin(currentNodeAngle);
				var currentNodeColour = colourScale(currentNodeSimilarityWithCentreNode);
				var currentNodeData = {
					nodeID: currentNodeID,
					nodeInfo: self.nodeInfoDict[currentNodeID],
					x: currentNodeX,
					y: currentNodeY,
					r: GraphVisualizer.Node.smallRadius,
					circleColour: currentNodeColour,
					textSize: GraphVisualizer.Node.smallTextSize,
					textWeight: null,
					textDy: GraphVisualizer.Node.smallRadius + GraphVisualizer.Node.textGapFromNode
				};
				
				self.nodeDataByID[currentNodeID] = currentNodeData;
				currentNodeIndex++;
			}
		}
	},
	updateLinkData: function(centreNodeID = null) {
		var self = this;
		self.linkDataByID = {};

		// create link string
		for (var currentNodeID in self.adjacencyMatrix) {
			var nodesConnectingCurrentNode = self.adjacencyMatrix[currentNodeID];

			for (var i = 0; i < nodesConnectingCurrentNode.length; i++) {
				var connectingNodeID = nodesConnectingCurrentNode[i];
				var currentLinkID = self.getLinkID(currentNodeID, connectingNodeID);
				var isLinkNotStored = !(currentLinkID in self.linkDataByID);

				if (isLinkNotStored) {
					var node1Data = self.nodeDataByID[currentNodeID];
					var node2Data = self.nodeDataByID[connectingNodeID];
		   		 	var pathData = self.computePathData(node1Data, node2Data);
		   		 	var opacity = centreNodeID == null ? GraphVisualizer.Link.highOpacity : GraphVisualizer.Link.lowOpacity;
					var strokeWidth = self.computeStrokeWidth(self.linkInfoDict[currentLinkID]);
					var currentLinkData = {
						linkID: currentLinkID,
						linkInfo: self.linkInfoDict[currentLinkID],
						node1: node1Data,
						node2: node2Data,
						pathData: pathData,
						opacity: opacity,
						strokeWidth: strokeWidth
					};

					self.linkDataByID[currentLinkID] = currentLinkData;
				}
			}
		}
	},
	computeStrokeWidth: function(linkInfo) {
		var totalNumberOfAttr = Database.numericalAttr.length + Database.categoricalAttr.length;
		var numberOfAttrOnLink = 0;
		var thinknessScale = d3.scaleLinear()
			.domain([ 1, totalNumberOfAttr ])
			.range([ GraphVisualizer.Link.thinStrokeWidth, GraphVisualizer.Link.thickStrokeWidth ]);

		for (var similarOrDifferent in linkInfo)
			numberOfAttrOnLink += Object.keys(linkInfo[similarOrDifferent]).length;

		return thinknessScale(numberOfAttrOnLink);
	},
	computePathData: function(node1Data, node2Data) {
		// compute original path data
		var dx = node2Data.x - node1Data.x;
		var dy = node2Data.y - node1Data.y;
		var dr = Math.sqrt(dx * dx + dy * dy);
		var originalPathData = "M" + node1Data.x + "," + node1Data.y + "A" + dr + "," + dr + " 0 0,1 " + node2Data.x + "," + node2Data.y;

		// compute new path data
		var dummyLink = GraphVisualizer.linkLayer.append("path")
			.attr("d", originalPathData)
			.style("opacity", 0);
		var totalLength = dummyLink.node().getTotalLength();
		var newNode1Pos = dummyLink.node().getPointAtLength(node1Data.r + GraphVisualizer.Link.gapFromNode);
		var newNode2Pos = dummyLink.node().getPointAtLength(totalLength - node2Data.r - GraphVisualizer.Link.gapFromNode);
		var dx = newNode2Pos.x - newNode1Pos.x;
		var dy = newNode2Pos.y - newNode1Pos.y;
		var dr = Math.sqrt(dx * dx + dy * dy);
		var newPathData = "M" + newNode1Pos.x + "," + newNode1Pos.y + "A" + dr + "," + dr + " 0 0,1 " + newNode2Pos.x + "," + newNode2Pos.y;
		
		// return result
		dummyLink.remove();
		return newPathData;
	},
	updateSimilarity: function(centreNodeID =  null) {
		var self = this;
		self.similarityScores = {};

		// init similarity
		for (var currentNodeID in self.adjacencyMatrix) {
			self.similarityScores[currentNodeID] = {};

			for (var anotherNodeID in self.adjacencyMatrix)
				if (currentNodeID != anotherNodeID)
					self.similarityScores[currentNodeID][anotherNodeID] = -1;
		}

		// update similarity
		Operator.setOperator(GraphSimilarityOperator);
		for (var currentNodeID in self.similarityScores) {
			for (var anotherNodeID in self.similarityScores[currentNodeID]) {
				// if this pair is already computed, retrieve it
				if (self.similarityScores[anotherNodeID][currentNodeID] != -1) {
					self.similarityScores[currentNodeID][anotherNodeID] = self.similarityScores[anotherNodeID][currentNodeID];
					continue;
				}

				// if this pair is not computed before, compute it
				GraphSimilarityOperator.clearPreviousData();
				GraphSimilarityOperator.retrieveObjects(currentNodeID, anotherNodeID);
				GraphSimilarityOperator.computeProbabilityDistribution();
				GraphSimilarityOperator.computeBhCoefficientForEachAttr();
				GraphSimilarityOperator.computeMeanDiffForEachAttr();
				self.similarityScores[currentNodeID][anotherNodeID] = GraphSimilarityOperator.computeSimilarityScore();
			}
		}
	},
	getNodeID: function(nodeInfo, checkOnly = false) { // if check only == true, not store if not found
		var self = this;
		var nodeIDFound = -1;

		for (var nodeID in self.nodeInfoDict) {
			if (self.isSameNodeInfo(self.nodeInfoDict[nodeID], nodeInfo)) {
				nodeIDFound = nodeID;
				break;
			}
		}

		// if not found create new node id and store it
		if (nodeIDFound == -1 && !checkOnly) {
			nodeIDFound = self.getNextNodeID();
			self.nodeInfoDict[nodeIDFound] = nodeInfo;
		}

		return String(nodeIDFound);
	},
	isSameNodeInfo: function(node1Info, node2Info) {
		var everythingElseTheSame = node1Info.everythingElse == node2Info.everythingElse;
		var allNode1ConfigInNode2Config = true;
		var allNode2ConfigInNode1Config = true;

		for (var i = 0; i < node1Info.config.length; i++)
			if (node2Info.config.indexOf(node1Info.config[i]) == -1)
				allNode1ConfigInNode2Config = false;

		for (var i = 0; i < node2Info.config.length; i++)
			if (node1Info.config.indexOf(node2Info.config[i]) == -1)
				allNode2ConfigInNode1Config = false;

		if (everythingElseTheSame && allNode1ConfigInNode2Config && allNode2ConfigInNode1Config)
			return true;
		else
			return false;
	},
	getLinkID: function(node1ID, node2ID) {
		return (parseInt(node1ID) < parseInt(node2ID)) ? (node1ID + "-" + node2ID) : (node2ID + "-" + node1ID);
	},
	getNextNodeID: function() {
		var self = this;
		var nextNodeID = self.nextNodeID;

		self.nextNodeID++;
		return nextNodeID;
	}
}