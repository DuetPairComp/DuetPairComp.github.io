var OneGroupOperator = {
	occupiedShelfName: null,
	allAttributes: [],
	numberOfObjectsForEachGroups: {},
	similarAttrForEachGroup: {}, // attributes where each group is similar to the selected group
	differentAttrForEachGroup: {}, // attributes where each group is different to the selected group
	probabilityDistributionForEachGroup: {},
	maxClassProbabilitySumForEachGroup: {},

	// temp data
	BhCoefficients: {},
	meanDiff: {},
	maxClassProbability: {}, // Each attribute has three probability. We get the max.

	differentAttr: [], 
	similarAttr: [],
	probabilityDistribution: [], // attribute: [ { value, prob: { top, bottom } } ] (init with what attribute you want to compute)
	configurationString: null,

	// data from shelf
	objects: { top: [], bottom: [] },

	// results to be exported
	similarGroups: [],
	differentGroups: [],
	similarAttrForExport: {}, // for top similar groups
	differentAttrForExport: {}, // for top different groups
	probabilityDistributionForExport: {}, // only store similar attributes for similar groups and different for different

	compute: function() {
		var self = this;

		Operator.setOperator(self);
		self.clearPreviousData();
		self.retrieveObjects();
		self.computeSimilarAndDiffAttrForEachGroup();
		self.storeTopSimilarAndDiffGroups();
	},
	clearPreviousData: function() {
		var self = this;

		self.occupiedShelfName = null;
		self.allAttributes = [];
		self.similarAttrForEachGroup = {};
		self.differentAttrForEachGroup = {};
		self.probabilityDistributionForEachGroup = {};
		self.maxClassProbabilitySumForEachGroup = {};

		self.objects = { top: [], bottom: [] };

		self.similarGroups = [];
		self.differentGroups = [];
		self.similarAttrForExport = {};
		self.differentAttrForExport = {};
		self.probabilityDistributionForExport = {};

		for (var i = 0; i < Database.numericalAttr.length; i++) {
			var currentAttr = Database.numericalAttr[i];
			self.allAttributes.push(currentAttr);
		}
		for (var i = 0; i < Database.categoricalAttr.length; i++) {
			var currentAttr = Database.categoricalAttr[i];
			if (Database.excludedCategoricalAttr.indexOf(currentAttr) == -1)
				self.allAttributes.push(currentAttr);
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

		for (var i = 0 ; i < self.allAttributes.length; i++) {
			var currentAttr = self.allAttributes[i];
			self.probabilityDistribution[currentAttr] = [];
		}
	},
	storeDataForEachGroup: function() {
		var self = this;
		var similarAttrMaxClassProbabilitySum = 0;
		var differentAttrMaxClassProbabilitySum = 0;

		self.similarAttrForEachGroup[self.configurationString] = self.similarAttr;
		self.differentAttrForEachGroup[self.configurationString] = self.differentAttr;
		self.probabilityDistributionForEachGroup[self.configurationString] = self.probabilityDistribution;
		self.maxClassProbabilitySumForEachGroup[self.configurationString] = { similar: 0, different: 0 };

		for (var i = 0; i < self.similarAttr.length; i++) {
			var currentAttr = self.similarAttr[i];
			var currentMaxClassProbability = self.maxClassProbability[currentAttr];
			similarAttrMaxClassProbabilitySum += currentMaxClassProbability;
		}
		for (var i = 0; i < self.differentAttr.length; i++) {
			var currentAttr = self.differentAttr[i];
			var currentMaxClassProbability = self.maxClassProbability[currentAttr];
			differentAttrMaxClassProbabilitySum += currentMaxClassProbability;
		}

		self.maxClassProbabilitySumForEachGroup[self.configurationString].similar = similarAttrMaxClassProbabilitySum;
		self.maxClassProbabilitySumForEachGroup[self.configurationString].different = differentAttrMaxClassProbabilitySum;
	},
	computeSimilarAndDiffAttrForEachGroup: function() {
		var self = this;
		var anotherShelfName = (self.occupiedShelfName == "bottom") ? "top" : "bottom";
		var numberOfObjectsOnShelf = self.objects[self.occupiedShelfName].length;
		var objectsForSystemDefinedGroups = Helper.sampleSystemDefinedGroups(numberOfObjectsOnShelf);

		for (var configurationString in objectsForSystemDefinedGroups) {
			var retrievedObjects = objectsForSystemDefinedGroups[configurationString];
			var isHighlyOverlapped = Helper.isHighlyOverlapped(retrievedObjects, self.objects[self.occupiedShelfName]);
			self.numberOfObjectsForEachGroups[configurationString] = retrievedObjects.length;

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
			self.storeDataForEachGroup();
		}
	},
	storeTopSimilarAndDiffGroups: function() {
		var self = this;

		// sort groups
		var similarGroups = [];
		for (var group in self.similarAttrForEachGroup)
			similarGroups.push(group);
		var differentGroups = [];
		for (var group in self.differentAttrForEachGroup)
			differentGroups.push(group);

		similarGroups.sort(function(a, b) {
			if (self.similarAttrForEachGroup[b].length == self.similarAttrForEachGroup[a].length)
				return self.maxClassProbabilitySumForEachGroup[b].similar - self.maxClassProbabilitySumForEachGroup[a].similar;

			return self.similarAttrForEachGroup[b].length - self.similarAttrForEachGroup[a].length;
		});
		differentGroups.sort(function(a, b) {
			if (self.differentAttrForEachGroup[b].length == self.differentAttrForEachGroup[a].length)
				return self.maxClassProbabilitySumForEachGroup[b].different - self.maxClassProbabilitySumForEachGroup[a].different;

			return self.differentAttrForEachGroup[b].length - self.differentAttrForEachGroup[a].length;
		});

		// store similar groups
		for (var i = 0; i < similarGroups.length; i++) {
			var currentGroup = similarGroups[i];
			var currentGroupHasSimilarAttr = self.similarAttrForEachGroup[currentGroup].length != 0;

			if (self.similarGroups.length >= 10)
				break;
			if (!currentGroupHasSimilarAttr)
				continue;
			if (!(currentGroup in self.probabilityDistributionForExport))
				self.probabilityDistributionForExport[currentGroup] = {};
			
			self.similarGroups.push(currentGroup);
			self.similarAttrForExport[currentGroup] = self.similarAttrForEachGroup[currentGroup];

			// store prob distribution only for similar attributes
			for (var j = 0; j < self.similarAttrForExport[currentGroup].length; j++) {
				var currentSimilarAttr = self.similarAttrForExport[currentGroup][j];
				self.probabilityDistributionForExport[currentGroup][currentSimilarAttr] = self.probabilityDistributionForEachGroup[currentGroup][currentSimilarAttr];
			}
		}
		
		// store different groups
		for (var i = 0; i < differentGroups.length; i++) {
			var currentGroup = differentGroups[i];
			var currentGroupHasDiffAttr = self.differentAttrForEachGroup[currentGroup].length != 0;

			if (self.differentGroups.length >= 10)
				break;
			if (!currentGroupHasDiffAttr)
				continue;
			if (!(currentGroup in self.probabilityDistributionForExport))
				self.probabilityDistributionForExport[currentGroup] = {};

			self.differentGroups.push(currentGroup);
			self.differentAttrForExport[currentGroup] = self.differentAttrForEachGroup[currentGroup];

			// store prob distributions only for different attributes
			for (var j = 0; j < self.differentAttrForExport[currentGroup].length; j++) {
				var currentDistAttr = self.differentAttrForExport[currentGroup][j]
				self.probabilityDistributionForExport[currentGroup][currentDistAttr] = self.probabilityDistributionForEachGroup[currentGroup][currentDistAttr];
			}
		}
	},
	getResults: function() {
		var self = this;
		var result =  {
			similarGroups: self.similarGroups,
			differentGroups: self.differentGroups,
			similarAttr: self.similarAttrForExport,
			differentAttr: self.differentAttrForExport,
			probabilityDistributions: self.probabilityDistributionForExport
		};

		return result;
	}
}