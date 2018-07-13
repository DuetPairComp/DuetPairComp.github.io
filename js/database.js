var Database = {
	data: null,

	IDAttr: null,
	numericalAttr: [],
	ordinalNumericalAttr: [], // not discretize for these attributes
	categoricalAttr: [],
	binaryAttr: [], // for generating text description
	excludedCategoricalAttr: [], // categorical attributes whic are excluded from the calculation
	numberOfDistinctValues: {}, // if |distinct values| < ref, bin number = |distinct values|

	splittingPoints: {}, // for numerical attributes only
	userDefinedCategory: {}, // attribute:value : { range, type } (type is either [] or [))
	objectsForSystemDefinedGroups: {},

	loadDataIntoMemory: function(data) {
		var self = this;

		self.data = data;
	},
	clearPreviousData: function() {
		var self = this;

		self.data = null;
		self.IDAttr = null;
		self.numericalAttr = [];
		self.ordinalNumericalAttr = [];
		self.categoricalAttr = [];
		self.binaryAttr = [];
		self.excludedCategoricalAttr = [];
		self.numberOfDistinctValues = {};
		self.splittingPoints = {};
		self.userDefinedCategory = {};
		self.objectsForSystemDefinedGroups = {};
	},
	storeUserDefinedCategory: function(attributeName, labels, sortedValuesOnNumberLine) {
		var self = this;

		for (var i = 0; i < labels.length; i++) {
			var lowerValue = sortedValuesOnNumberLine[i];
			var upperValue = sortedValuesOnNumberLine[i + 1];
			var type = (i == labels.length - 1) ? "[]" : "[)";
			var attributeString = attributeName + "=" + labels[i];

			self.userDefinedCategory[attributeString] = {
				lowerValue: lowerValue,
				upperValue: upperValue,
				type: type
			};
		}
	},
	DataProcessor: {
		convertStringToNumbers: function() {
			var self = Database;

			// convert only for numerical attributes
			for (var i = 0; i < self.numericalAttr.length; i++) {
				var currentAttr = self.numericalAttr[i];

				for (var j = 0; j < self.data.length; j++) {
					var currentObject = self.data[j];

					if (currentObject[currentAttr] !== "") // skip missing values
						currentObject[currentAttr] = +currentObject[currentAttr];
				}
			}
		},
		detectID: function() {
			var self = Database;
			var allAttr = Object.keys(self.data[0]);
			var totalNumberOfObjects = self.data.length;
			var foundID = false;

			for (var i = 0; i < allAttr.length; i++) {
				var currentAttr = allAttr[i];
				var distinctValues = Helper.getDistinctValuesExcludingMissing(self.data, currentAttr);

				// check if it is categorical
				var isCategorical = false;
				for (var j = 0; j < distinctValues.length; j++) {
					if (isNaN(distinctValues[j])) {
						isCategorical = true;
						break;
					}
				}

				// store the ID
				var numberOfDistinctValues = distinctValues.length;
				if (numberOfDistinctValues == totalNumberOfObjects && isCategorical) {
					foundID = true;
					self.IDAttr = currentAttr;
				}

				// store the number of distinct values
				self.numberOfDistinctValues[currentAttr] = numberOfDistinctValues;
			}

			// create a new attribute RecordID with value Record#
			if (!foundID) {
				for (var i = 0; i < self.data.length; i++) {
					var currentObject = self.data[i];
					currentObject.RecordID = "Record" + i;
				}

				self.IDAttr = "RecordID";
			}
		},
		detectNumericalAttr: function() {
			var self = Database;
			var allAttr = Object.keys(self.data[0]);

			for (var i = 0; i < allAttr.length; i++) {
				var currentAttr = allAttr[i];

				// check if this attribute contains non-value
				var isNumerical = true;
				var distinctValues = [];

				for (var j = 0; j < self.data.length; j++) {
					var currentObject = self.data[j];
					var currentValue = currentObject[currentAttr];

					// if it is not a number
					if (isNaN(currentObject[currentAttr])) {
						isNumerical = false;
						break;
					}

					// store distinct values
					if (distinctValues.indexOf(currentValue) == -1)
						distinctValues.push(currentValue);
				}

				// store the numerical attribute
				var isBinary = distinctValues.length == 2 && distinctValues.indexOf("0") != -1 && distinctValues.indexOf("1") != -1;
				var isID = currentAttr == self.IDAttr;

				if (isNumerical && !isBinary && !isID) {
					var lessThanOrEqualToTenDistinctValues = (distinctValues.length <= 10);
					var areAllDistinctValuesIntegers = self.DataProcessor.areAllValuesIntegers(distinctValues);

					if (lessThanOrEqualToTenDistinctValues && areAllDistinctValuesIntegers)
						self.ordinalNumericalAttr.push(currentAttr);
					self.numericalAttr.push(currentAttr);
				}
				if (isBinary) {
					self.DataProcessor.convertBinaryAttrToTrueFalse(currentAttr);
					self.binaryAttr.push(currentAttr);
				}
			}
		},
		areAllValuesIntegers: function(valueArray) {
			var allAreInteger = true;

			for (var i = 0; i < valueArray.length; i++) {
				var currentValue = +valueArray[i];
				var isCurrentValueInteger = (currentValue === parseInt(currentValue, 10));

				if (!isCurrentValueInteger) {
					allAreInteger = false;
					break;
				}
			}

			return allAreInteger;
		},
		detectCategoricalAttr: function() {
			var self = Database;
			var allAttr = Object.keys(self.data[0]);

			for (var i = 0; i < allAttr.length; i++) {
				var currentAttr = allAttr[i];
				var distinctValues = Helper.getDistinctValuesExcludingMissing(self.data, currentAttr);
				var numberOfDistinctValues = distinctValues.length;
				var tooManyDistinctValues = numberOfDistinctValues > 20;
				var isID = currentAttr == self.IDAttr;
				var isNumerical = self.numericalAttr.indexOf(currentAttr) != -1;

				if (!isID && !isNumerical)
					self.categoricalAttr.push(currentAttr);
				if (!isID && !isNumerical && tooManyDistinctValues) // exception
					self.excludedCategoricalAttr.push(currentAttr);
			}
		},
		convertBinaryAttrToTrueFalse: function(attributeName) {
			var self = Database;

			for (var i = 0; i < self.data.length; i++) {
				if (self.data[i][attributeName] == 0)
					self.data[i][attributeName] = "False";
				else
					self.data[i][attributeName] = "True";
			}
		},
		computeSplittingPointForNumericalAttr: function() {
			var self = Database;

			for (var i = 0; i < self.numericalAttr.length; i++) {
				var currentAttr = self.numericalAttr[i];
				var allValuesOfCurrentAttr = Helper.getAllValuesExcludingMissing(self.data, currentAttr);
				allValuesOfCurrentAttr.sort(function(a, b) { return a - b; });

				// find first index of each distinct value
				var previousValue = null;
				var indicesOfDistinctValues = {};
				for (var j = 0; j < allValuesOfCurrentAttr.length; j++) {
					var currentValue = allValuesOfCurrentAttr[j];
					if (currentValue != previousValue) {
						previousValue = currentValue;
						indicesOfDistinctValues[currentValue] = j;
					}
				}

				// find value closest to the middle
				var middleIndex = allValuesOfCurrentAttr.length / 2;
				var valueClosestToMiddelPoint = null;
				var smallestAbsDifference = Infinity;
				for (var value in indicesOfDistinctValues) {
					currentAbsDifference = Math.abs(indicesOfDistinctValues[value] - middleIndex);
					if (currentAbsDifference < smallestAbsDifference) {
						valueClosestToMiddelPoint = value;
						smallestAbsDifference = currentAbsDifference;
					}
				}

				// store
				self.splittingPoints[currentAttr] = valueClosestToMiddelPoint;
			}
		},
		retrieveObjectsForSystemDefinedGroups: function() {
			var self = Database;
			var categoricalAttr = self.categoricalAttr.concat([ self.IDAttr ]);
			var numericalAttr = self.numericalAttr;

			for (var i = 0; i < self.data.length; i++) {
				var currentObject = self.data[i];

				for (var currentAttr in currentObject) {
					// skip in case of missing values
					var currentValue = currentObject[currentAttr];
					if (currentValue === "")
						continue;

					// find configuration string
					var isCurrentAttrNumerical = numericalAttr.indexOf(currentAttr) != -1;
					var isCurrentAttrCategorical = categoricalAttr.indexOf(currentAttr) != -1;
					var configurationString = "";

					if (isCurrentAttrNumerical) {
						var splittingPoint = self.splittingPoints[currentAttr];
						configurationString = (currentValue < splittingPoint) ? currentAttr + "=" + "LOW" : currentAttr + "=" + "HIGH";
					}
					if (isCurrentAttrCategorical)
					 	configurationString = currentAttr + "=" + currentValue;

					// push object to the right group
					if (!(configurationString in self.objectsForSystemDefinedGroups))
						self.objectsForSystemDefinedGroups[configurationString] = [];
					self.objectsForSystemDefinedGroups[configurationString].push(currentObject);
				}
			}
		}
	}
}