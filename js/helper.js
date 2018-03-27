var Helper = {
	createShortString: function(string, length) {
		return (string.length > length) ? string.substring(0, length) + "..." : string;
	},
	computeMode: function(objects, attributeName) {
		// count
		var count = {};
		for (var i = 0; i < objects.length; i++) {
			var currentValue = objects[i][attributeName];
			if (currentValue === "") // skip missing values
				continue;

			if (!(currentValue in count))
				count[currentValue] = 0;
			count[currentValue]++;
		}

		// find mode
		var maxCount = -1;
		var mode = null;
		for (var value in count) {
			if (count[value] > maxCount) {
				maxCount = count[value];
				mode = value;
			}
		}

		return mode;
	},
	computeMean: function(objects, attributeName) {
		var mean = 0;
		var numberOfValuesExceptMissing = 0;

		for (var i = 0; i < objects.length; i++) {
			var currentValue = objects[i][attributeName];
			if (currentValue === "") // skip missing values
				continue;

			numberOfValuesExceptMissing++;
			mean += currentValue;
		}
		mean = mean / numberOfValuesExceptMissing;

		return mean;
	},
	retrieveGroups: function(configList, everythingElse = false) {
		var retrievedObjects = [];
		
		for (var i = 0; i < Database.data.length; i++) {
			var currentObject = Database.data[i];
			var satisfiedAll = true;

			for (var j = 0; j < configList.length; j++) {
				var attributeName = configList[j].split("=")[0];
				var attributeValue = configList[j].split("=")[1];
				var currentObjectValue = currentObject[attributeName];
				var currentConfig = configList[j];
				var isNumerical = Database.numericalAttr.indexOf(attributeName) != -1;
				var currentConfigUserDefined = currentConfig in Database.userDefinedCategory;

				if (isNumerical && currentConfigUserDefined) {
					var lowerValue = Database.userDefinedCategory[currentConfig].lowerValue;
					var upperValue = Database.userDefinedCategory[currentConfig].upperValue;
					var type = Database.userDefinedCategory[currentConfig].type;

					if (type == "[]" && (currentObjectValue < lowerValue || currentObjectValue > upperValue))
						satisfiedAll = false;
					if (type == "[)" && (currentObjectValue < lowerValue || currentObjectValue >= upperValue))
						satisfiedAll = false;
				}
				if (isNumerical && attributeValue == "LOW" && !currentConfigUserDefined) {
					var splittingPoint = Database.splittingPoints[attributeName];

					if (currentObjectValue >= splittingPoint)
						satisfiedAll = false;
				}
				if (isNumerical && attributeValue == "HIGH" && !currentConfigUserDefined) {
					var splittingPoint = Database.splittingPoints[attributeName];

					if (currentObjectValue < splittingPoint)
						satisfiedAll = false;
				}
				if (!isNumerical || isNumerical && attributeValue != "HIGH" && attributeValue != "LOW" && !currentConfigUserDefined) {
					if (attributeValue != currentObjectValue)
						satisfiedAll = false;
				}

				// stop if not satisfies at least one condition
				if (!satisfiedAll)
					break;
			}

			if (!everythingElse && satisfiedAll)
				retrievedObjects.push(currentObject);
			else if (everythingElse && !satisfiedAll)
				retrievedObjects.push(currentObject);
		}

		return retrievedObjects;
	},
	isHighlyOverlapped: function(group1, group2) {
		var group1ID = group1.map(function(d) { return d[Database.IDAttr]; });
		var group2ID = group2.map(function(d) { return d[Database.IDAttr]; });

		var duplicateCount = 0;
		for (var i = 0; i < group1ID.length; i++) {
			var currentGroup1ID = group1ID[i];

			if (group2ID.indexOf(currentGroup1ID) != -1)
				duplicateCount++;
		}

		// decision
		var jaccardIndex = duplicateCount / (group1.length + group2.length - duplicateCount);
		var hasLargeOverlapping = jaccardIndex > 0.3;
		var isSubset = (duplicateCount == group1.length) || (duplicateCount == group2.length);
		
		if (hasLargeOverlapping || isSubset)
			return true;
		
		return false;
	},
	getAttributeToBeExcluded: function() {
		var attributesToBeExcluded = [];
		var allConfigNameTheSame = true;
		var topConfig = ComparisonShelves.configOnShelves["top"];
		var bottomConfig = ComparisonShelves.configOnShelves["bottom"];
		var referenceConfigAttrName = topConfig[0].split("=")[0];

		// check if all attribute names are the same
		for (var i = 0; i < topConfig.length; i++) {
			var currentConfigAttrName = topConfig[i].split("=")[0];
			if (currentConfigAttrName != referenceConfigAttrName)
				allConfigNameTheSame = false;
		}
		for (var i = 0; i < bottomConfig.length; i++) {
			var currentConfigAttrName = bottomConfig[i].split("=")[0];
			if (currentConfigAttrName != referenceConfigAttrName)
				allConfigNameTheSame = false;
		}
		
		// store attributes to be excluded
		if (allConfigNameTheSame)
			attributesToBeExcluded.push(referenceConfigAttrName)
		attributesToBeExcluded = attributesToBeExcluded.concat(Database.excludedCategoricalAttr);
		
		return attributesToBeExcluded;
	},
	firstIsSubsetOfSecond: function(set1, set2) {
		var isSubset = true;

		for (var i = 0; i < set1.length; i++) {
			if (set2.indexOf(set1[i]) == -1) {
				isSubset = false;
				break;
			}
		}

		return isSubset;
	},
	getDistinctValuesOfTwoGroups: function(attributeName, barChartData) { // compute all distinct values of an attribute given the bar chart data
		var isNumerical = Database.numericalAttr.indexOf(attributeName) != -1;
		var distinctValuesOfTwoGroups = [];
		var hasDiscretized = "binNumber" in barChartData[0];

		// fill in the holes if discretized
		if (isNumerical && hasDiscretized) {
			var minBinIndex = barChartData[0].value;
			var maxBinIndex = barChartData[barChartData.length - 1].value;
			
			for (var i = minBinIndex; i <= maxBinIndex; i++) {
				var currentBinName = i;
				distinctValuesOfTwoGroups.push(currentBinName)
			}
		}

		// fill in the holes if not discretized (few distinct values)
		else if (isNumerical && !hasDiscretized) {
			var nestedData = d3.nest().key(function(object) { return object[attributeName]; }).object(Database.data);
			var allDistinctValues = Object.keys(nestedData);
			var minValueOfTwoGroups = d3.min(barChartData, function(d) { return d.value; });
			var maxValueOfTwoGroups = d3.max(barChartData, function(d) { return d.value; });

			for (var i = 0; i < allDistinctValues.length; i++) {
				if (allDistinctValues[i] >= minValueOfTwoGroups && allDistinctValues[i] <= maxValueOfTwoGroups)
					distinctValuesOfTwoGroups.push(allDistinctValues[i]);
			}

			distinctValuesOfTwoGroups.sort(function(a, b) { return d3.ascending(a, b); });
		}

		// if is categorical attributes
		else if (!isNumerical) {
			distinctValuesOfTwoGroups = barChartData.map(function(d) { return d.value });
		}

		return distinctValuesOfTwoGroups;
	},
	convertOneGroupCardDataToTwoGroupCardData: function(oldCardData, selectedAttrEl) {
		var attributeDivEl = $(selectedAttrEl).closest(".attributes")[0];
		var groupDivEl = $(attributeDivEl).prev(".group-group")[0];
		var groupName = d3.select(groupDivEl).select("g").datum();
		var occupiedShelfName = (oldCardData.configOnShelves["top"].length == 0) ? "bottom" : "top";
		var anotherShelfName = (occupiedShelfName == "top") ? "bottom" : "top";

		// get objects
		var objects = { top: [], bottom: [] };
		objects[occupiedShelfName] = Helper.retrieveGroups(oldCardData.configOnShelves[occupiedShelfName]);
		objects[anotherShelfName] = Helper.retrieveGroups([ groupName ]);
		
		// get prob distribution
		var probabilityDistribution = oldCardData.probabilityDistributions[groupName];

		// get similar and different attributes
		var similarAttr = [];
		var differentAttr = [];
		var isOneGroup = "similarAttr" in oldCardData || "differentAttr" in oldCardData;
		var selectedGroupIsSimilar = oldCardData.similarGroups.indexOf(groupName) != -1;

		if (!isOneGroup && selectedGroupIsSimilar) {
			similarAttr = Object.keys(probabilityDistribution);
			differentAttr = [];
		}
		if (!isOneGroup && !selectedGroupIsSimilar) {
			similarAttr = [];
			differentAttr = Object.keys(probabilityDistribution);
		}
		if (isOneGroup) {
			differentAttr = (groupName in oldCardData.differentAttr) ? oldCardData.differentAttr[groupName] : [];
			similarAttr = (groupName in oldCardData.similarAttr) ? oldCardData.similarAttr[groupName] : [];
		}

		// get groupNameOnShelves and configOnShelves
		var groupNamesOnShelves = { top: "", attribute: "", bottom: "" };
		var configOnShelves = { top: [], attribute: [], bottom: [] };
		configOnShelves[occupiedShelfName] = oldCardData.configOnShelves[occupiedShelfName];
		configOnShelves[anotherShelfName] = [ groupName ];
		groupNamesOnShelves[occupiedShelfName] = oldCardData.groupNamesOnShelves[occupiedShelfName];
		groupNamesOnShelves[anotherShelfName] = groupName;

		// return newCardData
		return {
			objects: objects,
			probabilityDistribution: probabilityDistribution,
			differentAttr: differentAttr,
			similarAttr: similarAttr,
			configOnShelves: configOnShelves,
			groupNamesOnShelves: groupNamesOnShelves
		}
	},
	getDistinctValuesExcludingMissing: function(objects, attributeName) {
		var distinctValuesObjects = {};

		for (var i = 0; i < objects.length; i++) {
			var currentValue = objects[i][attributeName];
			var currentValueNotStored = !(currentValue in distinctValuesObjects);
			var currentValueNotMissing = !(currentValue === "");

			if (currentValueNotStored && currentValueNotMissing) // skip missing values
				distinctValuesObjects[currentValue] = {};
		}

		return Object.keys(distinctValuesObjects);
	},
	getAllValuesExcludingMissing: function(objects, attributeName) {
		var allValues = [];

		for (var i = 0; i < objects.length; i++) {
			var currentValue = objects[i][attributeName];
			var currentValueNotMissing = !(currentValue === "");

			if (currentValueNotMissing) // skip missing values
				allValues.push(currentValue);
		}

		return allValues;
	},
	convertValueToBinIndex: function(value, min, max, binNumber) {
		var interval = (max - min) / binNumber;
		var binIndex = Math.floor((value - min) / interval);
		binIndex = (binIndex >= binNumber) ? binNumber - 1 : binIndex;

		return binIndex;
	},
	sampleSystemDefinedGroups: function(numberOfObjectsOnShelf) {
		var self = this;
		var numberOfSystemDefinedGroups = Object.keys(Database.objectsForSystemDefinedGroups).length;
		var objectsBySystemDefinedGroups = {};

		// compare with "groups" with only one object
		if (numberOfObjectsOnShelf == 1) {
			for (var systemDefinedGroup in Database.objectsForSystemDefinedGroups)
				if (Database.objectsForSystemDefinedGroups[systemDefinedGroup].length == 1)
					objectsBySystemDefinedGroups[systemDefinedGroup] = Database.objectsForSystemDefinedGroups[systemDefinedGroup];
		}

		// compare with groups with more than 2 objects
		if (numberOfObjectsOnShelf > 1) {
			for (var systemDefinedGroup in Database.objectsForSystemDefinedGroups)
				if (Database.objectsForSystemDefinedGroups[systemDefinedGroup].length > 1)
					objectsBySystemDefinedGroups[systemDefinedGroup] = Database.objectsForSystemDefinedGroups[systemDefinedGroup];
		}

		return self.sampleGroupsIfNeeded(objectsBySystemDefinedGroups);
	},
	sampleGroupsIfNeeded: function(objectsBySystemDefinedGroups) {
		var self = this;
		var maxNumberOfGroups = 800;
		var groupsAfterSampling = objectsBySystemDefinedGroups;
		var systemDefinedGroups = Object.keys(objectsBySystemDefinedGroups);
		var numberOfSystemDefinedGroups = systemDefinedGroups.length;

		if (numberOfSystemDefinedGroups > maxNumberOfGroups) {
			var shuffledSystemDefinedGroups = self.shuffle(systemDefinedGroups);
			groupsAfterSampling = {};

			for (var i = 0; i < maxNumberOfGroups; i++) {
				var currentSystemDefinedGroup = shuffledSystemDefinedGroups[i];
				groupsAfterSampling[currentSystemDefinedGroup] = Database.objectsForSystemDefinedGroups[currentSystemDefinedGroup];
			}
		}

		return groupsAfterSampling;
	},
	shuffle: function(array) { // seems to be mutatable?
	    var tmp, current, top = array.length;

	    if(top) while(--top) {
	        current = Math.floor(Math.random() * (top + 1));
	        tmp = array[current];
	        array[current] = array[top];
	        array[top] = tmp;
	    }

	    return array;
	},
	getRoundedRectPath: function(x, y, w, h, r) {
	    var retval;
	    retval  = "M" + (x + r) + "," + y;
	    retval += "h" + (w - 2*r);
	    retval += "a" + r + "," + r + " 0 0 1 " + r + "," + r;
	    retval += "v" + (h - 2*r);
		retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + r;
	    retval += "h" + (2*r - w);
	    retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + -r;
	    retval += "v" + (2*r - h);
	    retval += "a" + r + "," + r + " 0 0 1 " + r + "," + -r;
	    retval += "z";

	    return retval;
	},
	getTopRoundedRectPath: function(x, y, w, h, r) {
		var retval;
	    retval  = "M" + (x + r) + "," + y;
	    retval += "h" + (w - 2*r);
	    retval += "a" + r + "," + r + " 0 0 1 " + r + "," + r;
	    retval += "v" + (h - 2*r);
	    retval += "v" + r; retval += "h" + -r;
	    retval += "h" + (2*r - w);
	    retval += "h" + -r; retval += "v" + -r;
	    retval += "v" + (2*r - h);
	    retval += "a" + r + "," + r + " 0 0 1 " + r + "," + -r;
	    retval += "z";
	    
	    return retval;
	}
}