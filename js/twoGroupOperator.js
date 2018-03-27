var TwoGroupOperator = {
	BhCoefficients: {},
	meanDiff: {},
	maxClassProbability: {}, // Each attribute has three probability. We get the max.

	// results to be exported
	objects: { top: [], bottom: [] },
	probabilityDistribution: {}, // attribute: [ { value, prob: { top, bottom } } ] (init with what attribute you want to compute)
	differentAttr: [],
	similarAttr: [],

	compute: function() {
		var self = this;

		Operator.setOperator(self);
		self.clearPreviousData();
		self.retrieveObjects();
		self.computeProbabilityDistribution();
		self.computeBhCoefficientForEachAttr();
		self.computeMeanDiffForEachAttr();
		self.classify();
		self.rankAttributes();
	},
	clearPreviousData: function() {
		var self = this;
		var attributeExcluded = Helper.getAttributeToBeExcluded();

		self.BhCoefficients = {};
		self.meanDiff = {};
		self.maxClassProbability = {};
		
		self.objects = { top: [], bottom: [] };
		self.probabilityDistribution = {};
		self.differentAttr = [];
		self.similarAttr = [];

		var allAttributes = Database.numericalAttr.concat(Database.categoricalAttr);
		for (var i = 0; i < allAttributes.length; i++) {
			var currentAttr = allAttributes[i];
			var currentAttrNotExcluded = attributeExcluded.indexOf(currentAttr) == -1;

			if (currentAttrNotExcluded)
				self.probabilityDistribution[currentAttr] = [];
		}
	},
	retrieveObjects: function() {
		Operator.retrieveObjects("top");
		Operator.retrieveObjects("bottom");
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
	classify: function() {
		Operator.classify();
	},
	rankAttributes: function() {
		var self = this;
		self.differentAttr.sort(function(a, b) { return self.maxClassProbability[b] - self.maxClassProbability[a] });
		self.similarAttr.sort(function(a, b) { return self.maxClassProbability[b] - self.maxClassProbability[a] });
	},
	getResults: function() {
		var self = this;
		var result =  {
			objects: self.objects,
			probabilityDistribution: self.probabilityDistribution,
			differentAttr: self.differentAttr,
			similarAttr: self.similarAttr
		};

		return result;
	}
}