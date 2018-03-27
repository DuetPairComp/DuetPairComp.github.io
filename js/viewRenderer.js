var ViewRenderer = {
	renderWithDefaultDataset: function(path) {
		d3.csv(path, function(d) {
			// load data
			Database.data = d;
			Database.DataProcessor.detectID();
			Database.DataProcessor.detectNumericalAttr();
			Database.DataProcessor.detectCategoricalAttr();
			Database.DataProcessor.convertStringToNumbers();
			Database.DataProcessor.computeSplittingPointForNumericalAttr();
			Database.DataProcessor.retrieveObjectsForSystemDefinedGroups();

			// draw view
			AttributeList.show();
			DataTable.show();
		})
	},
	render: function(data) {
		// clear views
		ComparisonShelves.clear();
		Card.removeAll();
		RelationshipMap.clear();
		
		// load data
		Database.clearPreviousData();
		Database.loadDataIntoMemory(data);
		Database.DataProcessor.detectID();
		Database.DataProcessor.detectNumericalAttr();
		Database.DataProcessor.detectCategoricalAttr();
		Database.DataProcessor.convertStringToNumbers();
		Database.DataProcessor.computeSplittingPointForNumericalAttr();
		Database.DataProcessor.retrieveObjectsForSystemDefinedGroups();

		// draw view
		AttributeList.show();
		DataTable.show();
	}
}