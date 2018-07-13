var FileSelectorHandler = {
	init: function() {
		var self = this;

		self.installClickChangButton();
		self.installMouseenterChangeButton();
	},
	changeFileName: function(newFileName) {
		var shortFileName = (newFileName.length > 20) 
						  ? newFileName.substring(0, 20) + "..." 
						  : newFileName;

		$("#setting-menu .file-menu .file-name")
			.text(shortFileName);
	},
	installClickChangButton: function() {
		$("#setting-menu .file-menu .change-file-button")
			.on("click", clickChangeButton);

		function clickChangeButton() {
			var changeButtonPosition = $(this).offset();
			var changeButtonTop = changeButtonPosition.top;
			var changeButtonLeft = changeButtonPosition.left;
			var changeButtonWidth = $(this).width();
			var changeButtonHeight = $(this).height();
			var top = changeButtonTop + changeButtonHeight / 2;
			var left = changeButtonLeft + changeButtonWidth / 2;

			DatasetMenu.show(top, left);
		}
	},
	installMouseenterChangeButton: function() {
		$("#setting-menu .file-menu .change-file-button")
			.on("mouseenter", mouseenterChangeButton);
		$("#setting-menu .file-menu .change-file-button")
			.on("mouseleave", mouseleaveChangeButton);

		function mouseenterChangeButton() {
			var changeButtonPosition = $(this).offset();
			var changeButtonTop = changeButtonPosition.top;
			var changeButtonLeft = changeButtonPosition.left;
			var changeButtonWidth = $(this).width();

			$("#tooltip")
				.attr("data-tooltip", "Change Data set")
				.css("top", changeButtonTop - 5)
				.css("left", changeButtonLeft + changeButtonWidth / 2)
				.addClass("show")
				.removeClass("right");
		}

		function mouseleaveChangeButton() {
			$("#tooltip")
				.removeClass('show');
		}
	}
}

// 'use strict';

// ;(function (document, window, index) {
// 	var fileSelectorEl = document.getElementById("file-selector");
// 	var label = document.getElementById("file-name");
// 	var labelVal = label.innerHTML;
// 	var reader = new FileReader();

// 	// file reader setting
// 	reader.onload = function(e) {
// 	    var contents = e.target.result;
// 	    var data = d3.csvParse(contents);

//   		ViewRenderer.render(data); // render the views
//   	};

// 	fileSelectorEl.onclick = function() {
// 		fileSelectorEl.classList.add("selected"); // highlight the label on click
// 	}
	
// 	document.body.onfocus = function() {
// 		fileSelectorEl.classList.remove("selected"); // remove label highlight on return focus to document
// 	}

// 	fileSelectorEl.onchange = function(e) {
// 		var fileName = e.target.value.split( '\\' ).pop();

// 		if (fileName !== "") {
// 			var file = this.files[0];
// 			var shortFileName = (fileName.length > 15) ? fileName.substring(0, 15) + "..." : fileName;

// 			label.innerHTML = shortFileName;
// 			reader.readAsText(file);
// 		}
// 	}

// }(document, window, 0));