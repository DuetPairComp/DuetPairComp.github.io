'use strict';

;(function (document, window, index) {
	var fileSelectorEl = document.getElementById("file-selector");
	var label = document.getElementById("file-name");
	var labelVal = label.innerHTML;
	var reader = new FileReader();

	// file reader setting
	reader.onload = function(e) {
	    var contents = e.target.result;
	    var data = d3.csvParse(contents);

  		ViewRenderer.render(data); // render the views
  	};

	fileSelectorEl.onclick = function() {
		fileSelectorEl.classList.add("selected"); // highlight the label on click
	}
	
	document.body.onfocus = function() {
		fileSelectorEl.classList.remove("selected"); // remove label highlight on return focus to document
	}

	fileSelectorEl.onchange = function(e) {
		var fileName = e.target.value.split( '\\' ).pop();

		if (fileName !== "") {
			var file = this.files[0];
			var shortFileName = (fileName.length > 15) ? fileName.substring(0, 15) + "..." : fileName;

			label.innerHTML = shortFileName;
			reader.readAsText(file);
		}
	}

}(document, window, 0));