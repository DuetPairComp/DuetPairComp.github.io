var ChangeGroupNameManager = {
	refreshAllCards: function(changedShelfConfig, newGroupName) {
		var self = this;

		$("#comparison-panel .results .card").each(function() {
			var cardData = d3.select(this).datum();
			var currentTopShelfConfig = cardData.configOnShelves["top"];
			var currentBottomShelfConfig = cardData.configOnShelves["bottom"];
			var isTopSameAsChanged = self.areTwoConfigsTheSame(currentTopShelfConfig, changedShelfConfig);
			var isButtomSameAsChanged = self.areTwoConfigsTheSame(currentBottomShelfConfig, changedShelfConfig);
			var nowGroupNameIsCondition = newGroupName.indexOf("=") != -1;

			if (isTopSameAsChanged) {
				cardData.groupNamesOnShelves["top"] = newGroupName;
				$(this).find(".top-group").html(newGroupName);

				if (nowGroupNameIsCondition)
					$(this).find(".top-group-where").css("display", "inline");
				if (!nowGroupNameIsCondition)
					$(this).find(".top-group-where").css("display", "none");
			}

			if (isButtomSameAsChanged) {
				cardData.groupNamesOnShelves["bottom"] = newGroupName;
				$(this).find(".bottom-group").html(newGroupName);

				if (nowGroupNameIsCondition)
					$(this).find(".bottom-group-where").css("display", "inline");
				if (!nowGroupNameIsCondition)
					$(this).find(".bottom-group-where").css("display", "none");
			}
		});
	},
	refreshRelationshipMap: function(changedShelfConfig, newGroupName) {
		var self = this;

		for (var nodeID in GraphStructure.nodeInfoDict) {
			var currentConfig = GraphStructure.nodeInfoDict[nodeID].config;
			var isCurrentSameAsChanged = self.areTwoConfigsTheSame(currentConfig, changedShelfConfig);

			// update graph
			if (isCurrentSameAsChanged) {
				var isRadialLayout = !d3.select(".node.selected").empty();
				var centreNodeID = isRadialLayout ? d3.select(".node.selected").datum().nodeID : null;

				GraphStructure.nodeInfoDict[nodeID].name = newGroupName;
				GraphStructure.updateNodeData(centreNodeID);
				GraphStructure.updateLinkData(centreNodeID);
				GraphVisualizer.Link.update();
				GraphVisualizer.Node.update();
			}
		}
	},
	areTwoConfigsTheSame: function(config1, config2) {
		var isConfig1SubsetOfConfig2 = true;
		var isConfig2SubsetOfConfig1 = true;
		var areTheyTheSame = false;

		for (var i = 0; i < config1.length; i++) {
			if (config2.indexOf(config1[i]) == -1) {
				isConfig1SubsetOfConfig2 = false;
				break;
			}
		}
		for (var i = 0; i < config2.length; i++) {
			if (config1.indexOf(config2[i]) == -1) {
				isConfig2SubsetOfConfig1 = false;
				break;
			}
		}

		if (isConfig1SubsetOfConfig2 && isConfig2SubsetOfConfig1)
			areTheyTheSame = true;

		return areTheyTheSame;
	}
}