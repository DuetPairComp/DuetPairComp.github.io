var TwoGroupOneAttrOperator = {
	BhCoefficients: {},
	meanDiff: {},
	maxClassProbability: {}, // Each attribute has three probability. We get the max.

	// results to be exported
	objects: { top: [], bottom: [] },
	allAttrConsidered: [],
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

		self.BhCoefficients = {};
		self.meanDiff = {};
		self.maxClassProbability = {};

		self.objects = { top: [], bottom: [] };
		self.allAttrConsidered = [];
		self.probabilityDistribution = {};
		self.differentAttr = [];
		self.similarAttr = [];

		for (var i = 0; i < ComparisonShelves.configOnShelves["attribute"].length; i++) {
			var currentAttr = ComparisonShelves.configOnShelves["attribute"][i];
			self.probabilityDistribution[currentAttr] = [];
			self.allAttrConsidered.push(currentAttr);
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
			allAttrConsidered: self.allAttrConsidered,
			similarAttr: self.similarAttr,
		};

		return result;
	}
}