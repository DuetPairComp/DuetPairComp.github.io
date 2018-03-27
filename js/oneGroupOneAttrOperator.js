var OneGroupOneAttrOperator = {
	occupiedShelfName: null,
	maxClassProbabilitySum: {},

	// temp data for each group
	BhCoefficients: {},
	meanDiff: {},
	maxClassProbability: {}, // Each attribute has three probability. We get the max.

	differentAttr: [], 
	similarAttr: [],
	probabilityDistribution: [], // attribute: [ { value, prob: { top, bottom } } ] (init with what attribute you want to compute)
	configurationString: null,

	// data from shelf
	attributeList: [],
	objects: { top: [], bottom: [] },

	// results to be exported
	similarGroups: [],
	differentGroups: [],
	probabilityDistributionForEachGroup: {},

	compute: function() {
		var self = this;

		Operator.setOperator(self);
		self.clearPreviousData();
		self.retrieveObjects();
		self.computeSimilarAndDifferentForEachGroup();
	},
	clearPreviousData: function() { // no need to init temp data
		var self = this;

		self.occupiedShelfName = null;
		self.maxClassProbabilitySum = {};

		self.attributeList = [];
		self.objects = { top: [], bottom: [] };

		self.similarGroups = [];
		self.differentGroups = [];
		self.probabilityDistributionForEachGroup = {};

		for (var i = 0 ; i < ComparisonShelves.configOnShelves["attribute"].length; i++) {
			var currentAttr = ComparisonShelves.configOnShelves["attribute"][i];
			self.attributeList.push(currentAttr);
		}
	},
	retrieveObjects: function() {
		var self = this;

		if (ComparisonShelves.configOnShelves["top"].length == 0)
			self.occupiedShelfName = "bottom";
		else if (ComparisonShelves.configOnShelves["bottom"].length == 0)
			self.occupiedShelfName = "top";

		Operator.retrieveObjects(self.occupiedShelfName);
	},
	initForEachPairwiseComparison: function(configurationString) {
		var self = this;

		self.BhCoefficients = {};
		self.meanDiff = {};
		self.maxClassProbability = {};

		self.probabilityDistribution = {};
		self.differentAttr = [];
		self.similarAttr = [];
		self.configurationString = configurationString;

		for (var i = 0 ; i < ComparisonShelves.configOnShelves["attribute"].length; i++) {
			var currentAttr = ComparisonShelves.configOnShelves["attribute"][i];
			self.probabilityDistribution[currentAttr] = [];
		}
	},
	classifyGroupNComputeMaxClassProbabilitySum: function() {
		var self = this;
		var isDiffInAllSelectedAttr = self.differentAttr.length == self.attributeList.length;
		var isSimilarInAllSelectedAttr = self.similarAttr.length == self.attributeList.length;
		
		// store the group as different group
		if (isDiffInAllSelectedAttr) {
			self.differentGroups.push(self.configurationString);
			self.probabilityDistributionForEachGroup[self.configurationString] = self.probabilityDistribution;
			self.maxClassProbabilitySum[self.configurationString] = self.computeMaxClassProbilitySum();
		}

		// store the group as similar group
		if (isSimilarInAllSelectedAttr) {
			self.similarGroups.push(self.configurationString);
			self.probabilityDistributionForEachGroup[self.configurationString] = self.probabilityDistribution;
			self.maxClassProbabilitySum[self.configurationString] = self.computeMaxClassProbilitySum();
		}
	},
	computeMaxClassProbilitySum: function() {
		var self = this;
		var sum = 0;

		for (var currentAttr in self.probabilityDistribution)
			sum += self.maxClassProbability[currentAttr];

		return sum;
	},
	computeSimilarAndDifferentForEachGroup: function() {
		var self = this;
		var anotherShelfName = (self.occupiedShelfName == "bottom") ? "top" : "bottom";
		var numberOfObjectsOnShelf = self.objects[self.occupiedShelfName].length;
		var objectsForSystemDefinedGroups = Helper.sampleSystemDefinedGroups(numberOfObjectsOnShelf);

		for (var configurationString in objectsForSystemDefinedGroups) {
			var retrievedObjects = objectsForSystemDefinedGroups[configurationString];
			var isHighlyOverlapped = Helper.isHighlyOverlapped(retrievedObjects, self.objects[self.occupiedShelfName]);

			// skip it if two groups are highly overlapped
			if (isHighlyOverlapped)
				continue;

			// compute scores for the group
			self.initForEachPairwiseComparison(configurationString);
			self.objects[anotherShelfName] = retrievedObjects; // dynamically add objects to another shelf
			Operator.computeProbabilityDistribution();
			Operator.computeBhCoefficientForEachAttr();
			Operator.computeMeanDiffForEachAttr();
			Operator.classify();
			self.classifyGroupNComputeMaxClassProbabilitySum();
		}

		// sort by object count
		self.similarGroups.sort(function(a, b) { return self.maxClassProbabilitySum[b] - self.maxClassProbabilitySum[a] });
		self.differentGroups.sort(function(a, b) { return self.maxClassProbabilitySum[b] - self.maxClassProbabilitySum[a] });
	},
	getResults: function() {
		var self = this;

		var result =  {
			similarGroups: self.similarGroups,
			differentGroups: self.differentGroups,
			probabilityDistributions: self.probabilityDistributionForEachGroup
		};

		return result;
	}
}