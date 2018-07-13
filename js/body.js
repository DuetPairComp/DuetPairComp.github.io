var Body = {
	init: function() {
		var self = this;

		self.initClickAnywhereBehaviour();
		self.initEnterBehaviour();
	},
	initClickAnywhereBehaviour: function() { // click to close group container
		$("body").click(function(event) {
			var needToRemoveGroupContainer = !$(event.target).hasClass("not-remove-group-container");
			var clickedDatasetMenu = $(event.target).closest("#dataset-menu").length > 0;
			var clickedChangeDataButton = $(event.target).closest("#setting-menu .file-menu .change-file-button").length > 0;
			var isDatasetMenuOpened = $("#dataset-menu").css("display") != "none";

			if (needToRemoveGroupContainer)
				GroupContainer.remove();

			if (!clickedChangeDataButton && !clickedDatasetMenu && isDatasetMenuOpened)
				DatasetMenu.hide();
		});
	},
	initEnterBehaviour: function() { // enter to close group container
		$("body").keypress(function (e) {
			var key = e.which;

			if (key == 13) {
				GroupContainer.remove();
				DraggableTag.remove();
				return false;  
			}
		});   
	}
}