var GraphSimilarityOperator = {
	BhCoefficients: {},
	meanDiff: {},
	objects: { top: [], bottom: [] },
	probabilityDistribution: {},

	clearPreviousData: function() {
		var self = this;

		self.BhCoefficients = {};
		self.meanDiff = {};
		self.probabilityDistribution = {};
		self.objects = { top: [], bottom: [] };

		var allAttributes = Database.numericalAttr.concat(Database.categoricalAttr);
		for (var i = 0; i < allAttributes.length; i++) {
			var currentAttr = allAttributes[i];
			var currentAttrNotExcluded = Database.excludedCategoricalAttr.indexOf(currentAttr) == -1;

			if (currentAttrNotExcluded)
				self.probabilityDistribution[currentAttr] = [];
		}
	},
	retrieveObjects: function(node1ID, node2ID) {
		var self = this;
		var node1ConfigList = GraphStructure.nodeInfoDict[node1ID].config;
		var node1EverythingElse = GraphStructure.nodeInfoDict[node1ID].everythingElse;
		var node2ConfigList = GraphStructure.nodeInfoDict[node2ID].config;
		var node2EverythingElse = GraphStructure.nodeInfoDict[node2ID].everythingElse;

		self.objects["top"] = Helper.retrieveGroups(node1ConfigList, node1EverythingElse);
		self.objects["bottom"] = Helper.retrieveGroups(node2ConfigList, node2EverythingElse);
	},
	computeProbabilityDistribution: function() {
		Operator.computeProbabilityDistribution();
	},
	computeBhCoefficientForEachAttr: function() {
		Operator.computeBhCoefficientForEachAttr();
	},
	computeMeanDiffForEachAttr: function() {
		Operator.computeMeanDiffForEachAttr();
	},
	computeSimilarityScore: function() {
		var self = this;
		var similarityScore = 0;

		for (var currentAttr in self.probabilityDistribution) {
			var currentNumberOfDistinctValues = self.probabilityDistribution[currentAttr].length;
			var currentBhCoefficient = self.BhCoefficients[currentAttr];
			var currentMeanDiff = self.meanDiff[currentAttr];

			var classDWeightedSum = currentNumberOfDistinctValues * 0.1081 + currentBhCoefficient * -31.4766 + currentMeanDiff * 26.9017 + 21.6703;
			var classDExp = Math.exp(classDWeightedSum);
			
			var classNWeightedSum = currentNumberOfDistinctValues * -0.0063 + currentBhCoefficient * -20.7245 + currentMeanDiff * 10.0124 + 17.9196;
			var classNExp = Math.exp(classNWeightedSum);

			var classDProbability = classDExp / (1 + classDExp + classNExp);

			similarityScore += classDProbability;
		}

		return similarityScore;
	}
}