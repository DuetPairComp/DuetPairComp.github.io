var Operator = {
	currentOperator: null,

	setOperator: function(operator) {
		var self = this;

		self.currentOperator = operator;
	},
	retrieveObjects: function(shelfName) {
		var self = this;
		var operator = self.currentOperator;
		var isEverythingElse = (ComparisonShelves.configOnShelves[shelfName][0] == "Everything Else");
		var anotherShelfName = (shelfName == "top") ? "bottom" : "top";
		var configList = !isEverythingElse ? ComparisonShelves.configOnShelves[shelfName] : ComparisonShelves.configOnShelves[anotherShelfName];
		var retrievedObjects = Helper.retrieveGroups(configList, isEverythingElse);

		operator.objects[shelfName] = retrievedObjects;
	},
	computeProbabilityDistribution: function() {
		var self = this;
		var operator = self.currentOperator;
		var attributesToBeRemoved = []; // if one or both groups do not have values in an attribute remove it

		for (var currentAttr in operator.probabilityDistribution) {
			// get values without missing
			var topGroupValues = Helper.getAllValuesExcludingMissing(operator.objects.top, currentAttr);
			var bottomGroupValues = Helper.getAllValuesExcludingMissing(operator.objects.bottom, currentAttr);

			if (topGroupValues.length == 0 || bottomGroupValues.length == 0) {
				attributesToBeRemoved.push(currentAttr);
				continue;
			}

			// determine the number of bins for current attribute
			var meanGroupSize = (topGroupValues.length + bottomGroupValues.length) / 2;
			var referenceBinNumber = Math.min(Math.ceil(Math.sqrt(meanGroupSize)), 20); // 20 is the upper bound
			var allValuesOfTwoGroups = topGroupValues.concat(bottomGroupValues);
			var isCurrentAttrOrdinal = Database.ordinalNumericalAttr.indexOf(currentAttr) != -1;
			var isCurrentAttrNumerical = Database.numericalAttr.indexOf(currentAttr) != -1;
			var currentAttrNeedDiscretization = isCurrentAttrNumerical && !isCurrentAttrOrdinal;
			var minValue = d3.min(allValuesOfTwoGroups);
			var maxValue = d3.max(allValuesOfTwoGroups);
			var count = {};

			// counting
			for (var i = 0; i < topGroupValues.length; i++) {
				var currentValue = currentAttrNeedDiscretization
								 ? Helper.convertValueToBinIndex(topGroupValues[i], minValue, maxValue, referenceBinNumber)
								 : topGroupValues[i];

				if (!(currentValue in count))
					count[currentValue] = { top: 0, bottom: 0 };
				count[currentValue].top++;
			}
			for (var i = 0; i < bottomGroupValues.length; i++) {
				var currentValue = currentAttrNeedDiscretization
								 ? Helper.convertValueToBinIndex(bottomGroupValues[i], minValue, maxValue, referenceBinNumber)
								 : bottomGroupValues[i];

				if (!(currentValue in count))
					count[currentValue] = { top: 0, bottom: 0 };
				count[currentValue].bottom++;
			}

			// create and store distribution array
			var probabilityDistributionArray = self.convertCountToProbabilityArray(count, currentAttr, topGroupValues.length, bottomGroupValues.length);

			if (currentAttrNeedDiscretization) { // hacky! storing redundant information to indicate whether discretized
				for (var i = 0; i < probabilityDistributionArray.length; i++) {
					var probablityObject = probabilityDistributionArray[i];
					probablityObject.min = minValue;
					probablityObject.max = maxValue;
					probablityObject.binNumber = referenceBinNumber;
				}
			}
			
			operator.probabilityDistribution[currentAttr] = probabilityDistributionArray;
		}

		// remove attributes with too many missing values
		for (var i = 0; i < attributesToBeRemoved.length; i++)
			delete operator.probabilityDistribution[attributesToBeRemoved[i]];
	},
	convertCountToProbabilityArray: function(countObject, attributeName, topGroupTotal, bottomGroupTotal) {
		// create distribution array
		var probabilityDistributionArray = [];
		for (var value in countObject) {
			var topProbability = countObject[value].top / topGroupTotal;
			var bottomProbability = countObject[value].bottom / bottomGroupTotal;
			var probablityObject = { 
				value: value,
				probability: { top: topProbability, bottom: bottomProbability },
				count: { top: countObject[value].top, bottom: countObject[value].bottom }
			};

			probabilityDistributionArray.push(probablityObject);
		}

		// for numerical, sort by values
		var isCurrentAttrNumerical = Database.numericalAttr.indexOf(attributeName) != -1;
		if (isCurrentAttrNumerical) {
			probabilityDistributionArray.sort(function(a, b) { return +a.value - +b.value; });
		}

		// for categorical, sort to maximize mean difference
		else if (!isCurrentAttrNumerical) {
			for (var i = 0; i < probabilityDistributionArray.length; i++)
				probabilityDistributionArray[i].probDiff = probabilityDistributionArray[i].probability.top - probabilityDistributionArray[i].probability.bottom;

			probabilityDistributionArray.sort(function(a, b) { return a.probDiff - b.probDiff; });
		}

		return probabilityDistributionArray;
	},
	computeBhCoefficientForEachAttr: function() {
		var self = this;
		var operator = self.currentOperator;

		for (var currentAttr in operator.probabilityDistribution) {
			var BhCoefficientOfCurrentAttr = self.computeBhCoefficientForOneAttr(operator.probabilityDistribution[currentAttr]);
			operator.BhCoefficients[currentAttr] = BhCoefficientOfCurrentAttr;
		}
	},
	computeBhCoefficientForOneAttr: function(probabilityDistribution) {
		var BhCoefficient = 0;

		for (var i = 0; i < probabilityDistribution.length; i++) {
			var topProbability = probabilityDistribution[i].probability.top;
			var bottomProbability = probabilityDistribution[i].probability.bottom;
			BhCoefficient += Math.sqrt(topProbability * bottomProbability);
		}

		return BhCoefficient;
	},
	computeMeanDiffForEachAttr: function() {
		var self = this;
		var operator = self.currentOperator;

		for (var currentAttr in operator.probabilityDistribution) {
			var meanDiffOfCurrentAttr = self.computeMeanDiffForOneAttr(operator.probabilityDistribution[currentAttr], currentAttr);
			operator.meanDiff[currentAttr] = meanDiffOfCurrentAttr;
		}
	},
	computeMeanDiffForOneAttr: function(probabilityDistribution, attributeName) { // assume sorted for categorical
		// if length = 1, range = 0 -> need to continue
		if (probabilityDistribution.length == 1) 
			return 0;

		// compute means for both groups
		var isAttrNumerical = Database.numericalAttr.indexOf(attributeName) != -1;
		var mean1 = 0, mean2 = 0;
		var minValue = null, maxValue = null, range = null;

		if (isAttrNumerical) {
			var lastBarIndex = probabilityDistribution.length - 1;
			minValue = probabilityDistribution[0].value;
			maxValue = probabilityDistribution[lastBarIndex].value;
			range = maxValue - minValue;

			for (var i = 0; i < probabilityDistribution.length; i++) {
				var currentValue = probabilityDistribution[i].value;
				var normalizedValue = (currentValue - minValue) / range;
				
				mean1 += normalizedValue * probabilityDistribution[i].probability.top;
				mean2 += normalizedValue * probabilityDistribution[i].probability.bottom;
			}
		}
		else {
			minValue = 0;
			maxValue = probabilityDistribution.length - 1;
			range = maxValue - minValue;

			for (var i = 0; i < probabilityDistribution.length; i++) {
				var normalizedValue = (i - minValue) / range;

				mean1 += normalizedValue * probabilityDistribution[i].probability.top;
				mean2 += normalizedValue * probabilityDistribution[i].probability.bottom;
			}
		}

		return Math.abs(mean1 - mean2);
	},
	classify: function() {
		var self = this;
		var operator = self.currentOperator;

		for (var currentAttr in operator.probabilityDistribution) {
			var currentNumberOfDistinctValues = operator.probabilityDistribution[currentAttr].length;
			var currentBhCoefficient = operator.BhCoefficients[currentAttr];
			var currentMeanDiff = operator.meanDiff[currentAttr];

			var classDWeightedSum = currentNumberOfDistinctValues * 0.1081 + currentBhCoefficient * -31.4766 + currentMeanDiff * 26.9017 + 21.6703;
			var classDExp = Math.exp(classDWeightedSum);
			
			var classNWeightedSum = currentNumberOfDistinctValues * -0.0063 + currentBhCoefficient * -20.7245 + currentMeanDiff * 10.0124 + 17.9196;
			var classNExp = Math.exp(classNWeightedSum);

			var classDProbability = classDExp / (1 + classDExp + classNExp);
			var classNProbability = classNExp / (1 + classDExp + classNExp);
			var classSProbability = 1 - classDProbability - classNProbability;

			// classify as similar
			if (classSProbability > classNProbability && classSProbability > classDProbability) {
				operator.similarAttr.push(currentAttr);
				operator.maxClassProbability[currentAttr] = classSProbability;
			}

			// classify as different
			else if (classDProbability > classNProbability && classDProbability > classSProbability) {
				operator.differentAttr.push(currentAttr);
				operator.maxClassProbability[currentAttr] = classDProbability;
			}

			// classify as somewhere in the middle
			else {
				operator.maxClassProbability[currentAttr] = classNProbability;
			}
		}
	},
	computePValues: function(attributeList, numberOfIterations) {
		var self = this;
		var operator = self.currentOperator;
		
		for (var i = 0; i < attributeList.length; i++) {
			var currentAttr = attributeList[i];
			var allBhCoefficients = [];
			var allMeanDiff = [];

			// determine the number of bins for current attribute
			var topGroupValues = Helper.getAllValuesExcludingMissing(operator.objects.top, currentAttr);
			var bottomGroupValues = Helper.getAllValuesExcludingMissing(operator.objects.bottom, currentAttr);
			var meanGroupSize = (topGroupValues.length + bottomGroupValues.length) / 2;
			var referenceBinNumber = Math.min(Math.ceil(Math.sqrt(meanGroupSize)), 20);
			var allValuesOfTwoGroups = topGroupValues.concat(bottomGroupValues);
			var allValuesOfCurrentAttrInDatabase = Helper.getAllValuesExcludingMissing(Database.data, currentAttr);
			var isCurrentAttrOrdinal = Database.ordinalNumericalAttr.indexOf(currentAttr) != -1;
			var isCurrentAttrNumerical = Database.numericalAttr.indexOf(currentAttr) != -1;
			var currentAttrNeedDiscretization = isCurrentAttrNumerical && isCurrentAttrOrdinal;
			var minValue = d3.min(allValuesOfTwoGroups);
			var maxValue = d3.max(allValuesOfTwoGroups);

			for (var j = 0; j < numberOfIterations; j++) {
				var sampleCount = {};
				var sampleBhCoefficient = 0;
				var sampleMeanDiff = 0;

				// generate for top group
				for (var k = 0; k < topGroupValues.length; k++) {
					var randomIndex = Math.floor(Math.random() * allValuesOfCurrentAttrInDatabase.length);
					var currentValue = allValuesOfCurrentAttrInDatabase[randomIndex];

					if (currentAttrNeedDiscretization)
						currentValue = Helper.convertValueToBinIndex(currentValue, minValue, maxValue, referenceBinNumber);
					if (!(currentValue in sampleCount))
						sampleCount[currentValue] = { top: 0, bottom: 0 };
					sampleCount[currentValue].top++;
				}

				// generate for bottom group
				for (var k = 0; k < bottomGroupValues.length; k++) {
					var randomIndex = Math.floor(Math.random() * allValuesOfCurrentAttrInDatabase.length);
					var currentValue = allValuesOfCurrentAttrInDatabase[randomIndex];

					if (currentAttrNeedDiscretization)
						currentValue = Helper.convertValueToBinIndex(currentValue, minValue, maxValue, referenceBinNumber);
					if (!(currentValue in sampleCount))
						sampleCount[currentValue] = { top: 0, bottom: 0 };
					sampleCount[currentValue].bottom++;
				}

				// compute and store BhCoefficient and mean diff
				var probabilityDistributionArray = self.convertCountToProbabilityArray(sampleCount, currentAttr, topGroupValues.length, bottomGroupValues.length);
				var sampleBhCoefficient = self.computeBhCoefficientForOneAttr(probabilityDistributionArray);
				var sampleMeanDiff = self.computeMeanDiffForOneAttr(probabilityDistributionArray, currentAttr);
				allBhCoefficients.push(sampleBhCoefficient);
				allMeanDiff.push(sampleMeanDiff);
			}

			// store p value
			var BhCoefficientPValue = self.computePValueGivenProbDistribution(allBhCoefficients, operator.BhCoefficients[currentAttr]);
			var meanDiffPValue = self.computePValueGivenProbDistribution(allMeanDiff, operator.meanDiff[currentAttr]);
			operator.pValues[currentAttr] = BhCoefficientPValue * meanDiffPValue;
		}
	},
	computePValueGivenProbDistribution: function(samples, currentValue) {
		var sampleSize = samples.length;
		var midPoint = sampleSize / 2;
		var numberLessThanOrEqual = sampleSize - 1;
		var inFirstHalf = null;
		var pValue = null;

		samples.sort(function(a, b) { return a - b });

		for (var j = 0; j < samples.length; j++) {
			var sampleValue = samples[j];

			if (sampleValue > currentValue) {
				numberLessThanOrEqual = j;
				break;
			}
		}
		
		inFirstHalf = (numberLessThanOrEqual <= midPoint);
		pValue = inFirstHalf ? (numberLessThanOrEqual / sampleSize) : ((sampleSize - numberLessThanOrEqual) / sampleSize);

		return pValue;
	}
}