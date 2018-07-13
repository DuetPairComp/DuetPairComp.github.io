var DatasetMenu = {
	init: function() {
		var self = this;

		self.appendDivs();
		self.installClickFileName();
		self.installClickCancel();
		self.installClickConfirm();
	},
	show: function(top, left) {
		$("#dataset-menu")
			.css("display", "block")
			.css("top", top)
			.css("left", left);
	},
	hide: function() {
		$("#dataset-menu")
			.css("display", "none");
	},
	appendDivs: function() {
		$("#dataset-menu .content .container .dummy").append("<div class='file-name'>cars.csv</div>");
		$("#dataset-menu .content .container .dummy").append("<div class='file-name'>cities_small.csv</div>");
		$("#dataset-menu .content .container .dummy").append("<div class='file-name'>cities.csv</div>");
		$("#dataset-menu .content .container .dummy").append("<div class='file-name'>colleges_small.csv</div>");
		$("#dataset-menu .content .container .dummy").append("<div class='file-name'>colleges.csv</div>");
		$("#dataset-menu .content .container .dummy").append("<div class='file-name'>iris.csv</div>");
	},
	installClickFileName: function() {
		$("#dataset-menu .content .container .dummy .file-name").on("click", clickFileName);

		function clickFileName() {
			var isCurrentSelected = $(this).hasClass('selected');

			if (!isCurrentSelected) {
				$("#dataset-menu .content .container .dummy .file-name").removeClass("selected");
				$(this).addClass("selected");
			}

			if (isCurrentSelected)
				$(this).removeClass("selected");
		}
	},
	installClickConfirm: function() {
		$("#dataset-menu .footer .confirm-btn").on("click", clickConfirmButton);

		function clickConfirmButton() {
			var hasSelectedFileName = $("#dataset-menu .content .container .dummy .file-name.selected").length != 0;
			var selectedFileName = hasSelectedFileName ? $("#dataset-menu .content .container .dummy .file-name.selected").text() : null;
			var path = 'csv/' + selectedFileName;

			if (hasSelectedFileName) {
				FileSelectorHandler.changeFileName(selectedFileName);
				ViewRenderer.renderWithDefaultDataset(path);
			}

			$("#dataset-menu").css("display", "none");
		}
	},
	installClickCancel: function() {
		$("#dataset-menu .footer .cancel-btn").on("click", clickCancelButton);

		function clickCancelButton() {
			$("#dataset-menu").css("display", "none");
		}
	}
}