var TextGenerator = {
	generateSummary: {
		same: function() {
			var self = TextGenerator;
			var groupNamesOnShelves = ComparisonShelves.groupNamesOnShelves;

			// get group names
			var topGroupWhereHTML = self.generateGroupWhereHTML("top", groupNamesOnShelves["top"], true);
			var topGroupNameHTML = self.generateGroupNameHTML("top", groupNamesOnShelves["top"]);
			var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", groupNamesOnShelves["bottom"], false);
			var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", groupNamesOnShelves["bottom"]);

			// generate summary description
			var summaryDesc = topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML + " are exactly the same.";
			return summaryDesc;
		},
		twoGroup: function(cardData) {
			var self = TextGenerator;

			// get group names
			var topGroupWhereHTML = self.generateGroupWhereHTML("top", cardData.groupNamesOnShelves["top"], true);
			var topGroupNameHTML = self.generateGroupNameHTML("top", cardData.groupNamesOnShelves["top"]);
			var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", cardData.groupNamesOnShelves["bottom"], false);
			var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", cardData.groupNamesOnShelves["bottom"]);
			
			// generate attribute list HTML
			var similarAttrListContent = self.generateShortListContentHTML(cardData.similarAttr);
			var differentAttrListContent = self.generateShortListContentHTML(cardData.differentAttr);
			var similarAttrListHTML = self.generateListHTML("similar", "attributes", similarAttrListContent, cardData.similarAttr.length);
			var differentAttrListHTML = self.generateListHTML("different", "attributes", differentAttrListContent, cardData.differentAttr.length);

			// generate similar and different words
			var similarTextHTML = "<span class='similar-text'>similar</span>";
			var differentTextHTML = "<span class='different-text'>different</span>";

			// generate summary description
			var summaryDesc = topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML + " are ";
			var hasDifferentAttr = cardData.differentAttr.length != 0;
			var hasSimilarAttr = cardData.similarAttr.length != 0;

			if (hasSimilarAttr) {
				summaryDesc += similarTextHTML + " in " + similarAttrListHTML;
				if (hasDifferentAttr)
					summaryDesc += " but are "
			}
			if (hasDifferentAttr) {
				summaryDesc += differentTextHTML + " in " + differentAttrListHTML;
			}
			if (!hasSimilarAttr && !hasDifferentAttr) {
				summaryDesc += "neither similar nor different";
			}

			summaryDesc += ".";

			return summaryDesc;
		},
		twoGroupOneAttr: function(cardData) {
			var self = TextGenerator;

			// get group names
			var topGroupWhereHTML = self.generateGroupWhereHTML("top", cardData.groupNamesOnShelves["top"], true);
			var topGroupNameHTML = self.generateGroupNameHTML("top", cardData.groupNamesOnShelves["top"]);
			var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", cardData.groupNamesOnShelves["bottom"], false);
			var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", cardData.groupNamesOnShelves["bottom"]);

			// generate attribute list HTML
			var similarAttrListContent = self.generateLongListContentHTML(cardData.similarAttr);
			var differentAttrListContent = self.generateLongListContentHTML(cardData.differentAttr);
			var similarAttrListHTML = self.generateListHTML("similar", "attributes", similarAttrListContent);
			var differentAttrListHTML = self.generateListHTML("different", "attributes", differentAttrListContent);

			// generate summary description
			var summaryDesc = topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML + " are ";
			var hasDifferentAttr = cardData.differentAttr.length != 0;
			var hasSimilarAttr = cardData.similarAttr.length != 0;
			var hasNeitherSimilarNorDistAttr = cardData.allAttrConsidered.length - cardData.similarAttr.length - cardData.differentAttr.length != 0

			if (hasSimilarAttr) {
				summaryDesc += "similar in " + similarAttrListHTML;
				if (hasDifferentAttr)
					summaryDesc += " but are "
				if (hasNeitherSimilarNorDistAttr && !hasDifferentAttr)
					summaryDesc += " and are "
			}
			if (hasDifferentAttr) {
				summaryDesc += "different in " + differentAttrListHTML;
				if (hasNeitherSimilarNorDistAttr)
					summaryDesc += " and are "
			}
			if (hasNeitherSimilarNorDistAttr) {
				var neitherSimilarNorDisAttr = [];
				for (var i = 0; i < cardData.allAttrConsidered.length; i++) {
					var currentAttr = cardData.allAttrConsidered[i];
					if (cardData.differentAttr.indexOf(currentAttr) == -1 && cardData.similarAttr.indexOf(currentAttr) == -1)
						neitherSimilarNorDisAttr.push(currentAttr);
				}

				var neitherSimilarNorDistAttrListContent = self.generateLongListContentHTML(neitherSimilarNorDisAttr);
				var neitherSimilarNorDistAttrListHTML = self.generateListHTML("neither-sim-or-dist", "attributes", neitherSimilarNorDistAttrListContent);
				summaryDesc += "neither similar nor different in " + neitherSimilarNorDistAttrListHTML;
			}

			summaryDesc += ".";

			return summaryDesc;
		},
		oneGroupOneAttr: function(cardData) {
			var self = TextGenerator;
			var occupiedShelfName = (cardData.configOnShelves["top"].length == 0) ? "bottom" : "top";
			
			// get group name
			var groupWhereHTML = self.generateGroupWhereHTML(occupiedShelfName, cardData.groupNamesOnShelves[occupiedShelfName], false);
			var groupNameHTML = self.generateGroupNameHTML(occupiedShelfName, cardData.groupNamesOnShelves[occupiedShelfName]);

			// generate attribute list HTML
			var attributeList = cardData.configOnShelves["attribute"];
			var attrListContent = self.generateLongListContentHTML(attributeList);
			var attrListHTML = "<span class='attribute-group'>" + attrListContent + "</span>";

			// generate group list HTML
			var similarGroupListContent = self.generateShortListContentHTML(cardData.similarGroups);
			var similarGroupListHTML = self.generateListHTML("similar", "groups", similarGroupListContent, cardData.similarGroups.length);
			var differentGroupListContent = self.generateShortListContentHTML(cardData.differentGroups);
			var differentGroupListHTML = self.generateListHTML("different", "groups", differentGroupListContent, cardData.differentGroups.length);

			// generate summary description
			var hasSimilarGroups = cardData.similarGroups.length != 0;
			var hasDifferentGroups = cardData.differentGroups.length != 0;
			var summaryDesc = "In terms of " + attrListHTML + ", " + groupWhereHTML + groupNameHTML + " is ";

			if (hasSimilarGroups) {
				summaryDesc += (cardData.similarGroups.length == 1) 
							 ? "similar to the group where " + similarGroupListHTML
							 : "similar to groups where " + similarGroupListHTML;
				if (hasDifferentGroups)
					summaryDesc += " but is "
			}
			if (hasDifferentGroups) {
				summaryDesc += (cardData.differentGroups.length == 1) 
							 ? "different from the group where " + differentGroupListHTML
							 : "different from groups where " + differentGroupListHTML;
			}

			summaryDesc += ".";

			return summaryDesc;
		},
		oneGroup: function(cardData) {
			var self = TextGenerator;
			var occupiedShelfName = (cardData.configOnShelves["top"].length == 0) ? "bottom" : "top";

			// get group name
			var groupWhereHTML = self.generateGroupWhereHTML(occupiedShelfName, cardData.groupNamesOnShelves[occupiedShelfName], true);
			var groupNameHTML = self.generateGroupNameHTML(occupiedShelfName, cardData.groupNamesOnShelves[occupiedShelfName]);

			// generate group list HTML
			var similarGroupListContent = self.generateShortListContentHTML(cardData.similarGroups, true);
			var similarGroupListHTML = self.generateListHTML("similar", "groups", similarGroupListContent);
			var differentGroupListContent = self.generateShortListContentHTML(cardData.differentGroups, true);
			var differentGroupListHTML = self.generateListHTML("different", "groups", differentGroupListContent);

			// generate summary description
			var hasSimilarGroups = cardData.similarGroups.length != 0;
			var hasDifferentGroups = cardData.differentGroups.length != 0;
			var summaryDesc = groupWhereHTML + groupNameHTML + " is ";

			if (hasSimilarGroups) {
				summaryDesc += "most similar to ";
				summaryDesc += (cardData.similarGroups.length == 1) 
						 	 ? "the group where " + similarGroupListHTML
						 	 : "groups where " + similarGroupListHTML;
				if (hasDifferentGroups)
					summaryDesc += " and is "
			}
			if (hasDifferentGroups) {
				summaryDesc += "most different from ";
				summaryDesc += (cardData.differentGroups.length == 1) 
							 ? "the group where " + differentGroupListHTML
							 : "groups where " + differentGroupListHTML;
			}

			summaryDesc += ".";

			return summaryDesc;
		}
	},

	// for showing text on bar charts
	generateSimilarDesc: function(cardData, attributeName) {
		var self = this;
		var topGroupWhereHTML = self.generateGroupWhereHTML("top", cardData.groupNamesOnShelves["top"], false);
		var topGroupNameHTML = self.generateGroupNameHTML("top", cardData.groupNamesOnShelves["top"]);
		var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", cardData.groupNamesOnShelves["bottom"], false);
		var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", cardData.groupNamesOnShelves["bottom"]);
		var attributeNameHTML = "<span class='attribute'>" + attributeName + "</span>";

		return "In terms of " + attributeNameHTML + ", " + topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML
		       + " have fairly similar distributions.";
	},
	generateDifferentDescForCategorical: function(cardData, attributeName) {
		var self = this;
		var probabilityDistribution = cardData.probabilityDistribution[attributeName];
		var mostSigFactorContributingToDiff = self.determineFactorWithLargestContributionToDiffProb(probabilityDistribution, attributeName);
		var topGroupWhereHTML = self.generateGroupWhereHTML("top", cardData.groupNamesOnShelves["top"], false);
		var topGroupNameHTML = self.generateGroupNameHTML("top", cardData.groupNamesOnShelves["top"]);
		var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", cardData.groupNamesOnShelves["bottom"], false);
		var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", cardData.groupNamesOnShelves["bottom"]);
		var attributeNameHTML = "<span class='attribute'>" + attributeName + "</span>";
		var topGroupModeHTML = "<span class='mode'>" + Helper.computeMode(cardData.objects.top, attributeName) + "</span>";
		var bottomGroupModeHTML = "<span class='mode'>" + Helper.computeMode(cardData.objects.bottom, attributeName) + "</span>";

		if (mostSigFactorContributingToDiff == "BhCoefficient")
			return "In terms of " + attributeNameHTML + ", "
		           + " there is little overlapping between the distributions of " + topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML + ".";

		if (mostSigFactorContributingToDiff == "meanDiff")
			return "In terms of " + attributeNameHTML + ", " + "many objects in " + topGroupWhereHTML + topGroupNameHTML + " have the value " 
	               + topGroupModeHTML + " whereas many objects in " + bottomGroupWhereHTML + bottomGroupNameHTML + " have the value " + bottomGroupModeHTML + ".";
	},
	generateDifferentDescForNumerical: function(cardData, attributeName) {
		var self = this;
		var probabilityDistribution = cardData.probabilityDistribution[attributeName];
		var mostSigFactorContributingToDiff = self.determineFactorWithLargestContributionToDiffProb(probabilityDistribution, attributeName);
		var topGroupWhereHTML = self.generateGroupWhereHTML("top", cardData.groupNamesOnShelves["top"], false);
		var topGroupNameHTML = self.generateGroupNameHTML("top", cardData.groupNamesOnShelves["top"]);
		var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", cardData.groupNamesOnShelves["bottom"], false);
		var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", cardData.groupNamesOnShelves["bottom"]);
		var attributeNameHTML = "<span class='attribute'>" + attributeName + "</span>";

		if (mostSigFactorContributingToDiff == "BhCoefficient") {
			return "In terms of " + attributeNameHTML + ", "
		           + " there is little overlapping between the distributions of " + topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML + ".";
		}

		if (mostSigFactorContributingToDiff == "meanDiff") {
			var topAverage = Helper.computeMean(cardData.objects.top, attributeName);
			var bottomAverage = Helper.computeMean(cardData.objects.bottom, attributeName);

			if (topAverage > bottomAverage)
				return "In terms of " + attributeNameHTML + ", " + topGroupWhereHTML + topGroupNameHTML 
			           + " has a higher average value than " + bottomGroupWhereHTML + bottomGroupNameHTML + ".";
			if (bottomAverage > topAverage)
				return "In terms of " + attributeNameHTML + ", " + topGroupWhereHTML + bottomGroupNameHTML 
			           + " has a higher average value than " + bottomGroupWhereHTML + topGroupNameHTML + ".";
			if (bottomAverage == topAverage)
				return "In terms of " + attributeNameHTML + ", although " + topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML 
			           + " has the same average, the distributions of their values look fairly different.";
		}
	},
	generateNonSignificantDesc: function(cardData, attributeName) {
		var self = this;
		var topGroupWhereHTML = self.generateGroupWhereHTML("top", cardData.groupNamesOnShelves["top"], false);
		var topGroupNameHTML = self.generateGroupNameHTML("top", cardData.groupNamesOnShelves["top"]);
		var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", cardData.groupNamesOnShelves["bottom"], false);
		var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", cardData.groupNamesOnShelves["bottom"]);
		var attributeNameHTML = "<span class='attribute'>" + attributeName + "</span>";

		return "In terms of " + attributeNameHTML + ", " + topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML + 
		       " are neither too similar nor too different.";
	},
	generateAttrCountDesc: {
		oneGroup: function(cardData, hoveredGroupName, similarOrDifferent) {
			var self = TextGenerator;

			// prepare materials
			var occupiedShelfName = (cardData.configOnShelves["top"].length == 0) ? "bottom" : "top";
			var anotherShelfName = (occupiedShelfName == "top") ? "bottom" : "top";
			var groupNameOnShelf = cardData.groupNamesOnShelves[occupiedShelfName];
			var attrCount = null;
						
			if (similarOrDifferent == "similar") // similar group
				attrCount = cardData.similarAttr[hoveredGroupName].length;	
			if (similarOrDifferent == "different") // different group
				attrCount = cardData.differentAttr[hoveredGroupName].length;

			// render template
			var onShelfGroupWhereHTML = self.generateGroupWhereHTML(occupiedShelfName, groupNameOnShelf, true);
			var onShelfGroupNameHTML = self.generateGroupNameHTML(occupiedShelfName, groupNameOnShelf);
			var hoveredGroupWhereHTML = self.generateGroupWhereHTML(anotherShelfName, hoveredGroupName, false);
			var hoveredGroupNameHTML = self.generateGroupNameHTML(anotherShelfName, hoveredGroupName);
			var attributeCountHTML = "<span class='bold'>" + 
										attrCount + " " +
										(attrCount == 1 ? " attribute" : " attributes") +
									"</span>";
			var whichIsOrAreText = attrCount == 1 ? " which is" : " which are";
			var similarOrDifferentHTML = "<span class='bold'>" + " highly " + similarOrDifferent + "</span>";

			return onShelfGroupWhereHTML + onShelfGroupNameHTML + " and " + hoveredGroupWhereHTML + hoveredGroupNameHTML + " has " + attributeCountHTML + whichIsOrAreText + similarOrDifferentHTML + ".";
		},
		twoGroups: function(cardData, similarOrDifferent) {
			var self = TextGenerator;
			
			var attrCount = (similarOrDifferent == "similar") ? cardData.similarAttr.length : cardData.differentAttr.length;
			var topGroupNameHTML = self.generateGroupNameHTML("top", cardData.groupNamesOnShelves["top"]);
			var topGroupWhereHTML = self.generateGroupWhereHTML("top", cardData.groupNamesOnShelves["top"], true);
			var bottomGroupNameHTML = self.generateGroupNameHTML("bottom", cardData.groupNamesOnShelves["bottom"]);
			var bottomGroupWhereHTML = self.generateGroupWhereHTML("bottom", cardData.groupNamesOnShelves["bottom"], false);
			var attributeCountHTML = "<span class='bold'>" + 
										attrCount + " " +
										(attrCount == 1 ? " attribute" : " attributes") +
									 "</span>";
			var whichIsOrAreText = attrCount == 1 ? " which is" : " which are";
			var similarOrDifferentHTML = "<span class='bold'>" + " highly " + similarOrDifferent + "</span>";

			return topGroupWhereHTML + topGroupNameHTML + " and " + bottomGroupWhereHTML + bottomGroupNameHTML + " has " + attributeCountHTML + whichIsOrAreText + similarOrDifferentHTML + ".";
		}
	},

	// helpers
	determineFactorWithLargestContributionToDiffProb: function(probabilityDistribution, attributeName) {
		var numberOfDistinctValues = probabilityDistribution.length;
		var BhCoefficient = Operator.computeBhCoefficientForOneAttr(probabilityDistribution);
		var meanDiff = Operator.computeMeanDiffForOneAttr(probabilityDistribution, attributeName);

		// compute normal difference probabiliy
		var classDWeightedSum = numberOfDistinctValues * 0.1081 + BhCoefficient * -31.4766 + meanDiff * 26.9017 + 21.6703;
		var classDExp = Math.exp(classDWeightedSum);	
		var classNWeightedSum = numberOfDistinctValues * -0.0063 + BhCoefficient * -20.7245 + meanDiff * 10.0124 + 17.9196;
		var classNExp = Math.exp(classNWeightedSum);
		var classDProbability = classDExp / (1 + classDExp + classNExp);

		// compute probability assuming mean difference = 0
		var classDWeightedSum = numberOfDistinctValues * 0.1081 + BhCoefficient * -31.4766 + 0 * 26.9017 + 21.6703;
		var classDExp = Math.exp(classDWeightedSum);	
		var classNWeightedSum = numberOfDistinctValues * -0.0063 + BhCoefficient * -20.7245 + 0 * 10.0124 + 17.9196;
		var classNExp = Math.exp(classNWeightedSum);
		var classDProbabilityWhenMeanDiffEqualsZero = classDExp / (1 + classDExp + classNExp);

		// compute probability assuming bh = 1
		var classDWeightedSum = numberOfDistinctValues * 0.1081 + 1 * -31.4766 + meanDiff * 26.9017 + 21.6703;
		var classDExp = Math.exp(classDWeightedSum);	
		var classNWeightedSum = numberOfDistinctValues * -0.0063 + 1 * -20.7245 + meanDiff * 10.0124 + 17.9196;
		var classNExp = Math.exp(classNWeightedSum);
		var classDProbabilityWhenBhEqualsOne = classDExp / (1 + classDExp + classNExp);

		// determine which contributes more
		var BhCoefficientContribution = classDProbability - classDProbabilityWhenBhEqualsOne;
		var meanDiffContribution = classDProbability - classDProbabilityWhenMeanDiffEqualsZero;
		var mostSigFactorContributingToDiff = (BhCoefficientContribution > meanDiffContribution) ? "BhCoefficient" : "meanDiff";

		return mostSigFactorContributingToDiff;
	},
	generateLongListContentHTML: function(list) {
		var listHTML = "";

		for (var i = 0; i < list.length; i++) {
			listHTML += "<span>" + list[i] + "</span>";
			if (i != list.length - 1 && i != list.length - 2) // not last or second last
				listHTML += ", ";
			if (i == list.length - 2) // second last
				listHTML += ", and ";
		}

		return listHTML;
	},
	generateShortListContentHTML: function(list, useAnd = false) {
		var listHTML = "";

		for (var i = 0; i < list.length && i < Card.numberOfItemsShown; i++) { // show at most 3 attributes
			listHTML += "<span>" + list[i] + "</span>";

			if (i == list.length - 1 || i == Card.numberOfItemsShown - 1)
				listHTML += "";
			else if (i == list.length - 2 || (i == Card.numberOfItemsShown - 2 && useAnd))
				listHTML += ", and ";
			else
				listHTML += ", ";
		}

		return listHTML;
	},
	generateGroupNameHTML: function(shelfName, groupNameOnShelf) {
		var splitGroupName = groupNameOnShelf.split("=");
		var startWithNOT = splitGroupName[0].indexOf("NOT") == 0;
		var groupName = "";

		if (splitGroupName.length == 1)
			groupName = groupNameOnShelf;
		else
			groupName = startWithNOT ? ("NOT " + groupNameOnShelf) : groupNameOnShelf;

		return "<span class='" + shelfName + "-group'>" + groupName + "</span>";
	},
	generateGroupWhereHTML: function(shelfName, groupName, capitalize) {
		var showGroupWhere = groupName.indexOf("=") != -1;

		if (showGroupWhere && capitalize)
			return "<span class='" + shelfName + "-group-where'>Group where </span>";
		if (showGroupWhere && !capitalize)
			return "<span class='" + shelfName + "-group-where'>group where </span>";
		if (!showGroupWhere && capitalize)
			return "<span class='" + shelfName + "-group-where' style='display:none'>Group where </span>";
		if (!showGroupWhere && !capitalize)
			return "<span class='" + shelfName + "-group-where' style='display:none'>group where </span>";
	},
	generateListHTML: function(similarOrDifferent, groupsOrAttributes, listContent, listLength = 0) {
		var listHTML = "";
		listHTML += "<span class='" + similarOrDifferent + "'>";
		listHTML +=	"<span class='" + groupsOrAttributes + "'>" + listContent + "</span> ";

		if (listLength > Card.numberOfItemsShown) {
			listHTML += "<span class='and'>, and </span>";
			listHTML += "<span class='more' similarOrDifferent='" + similarOrDifferent + "'>";
			listHTML += (listLength - Card.numberOfItemsShown) + " more"
			listHTML += "</span>";
		}
		
		listHTML += "</span>";

		return listHTML;
	}
}