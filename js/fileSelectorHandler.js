'use strict';

;(function (document, window, index) {
	var fileSelectorEl = document.getElementById("file-selector");
	var label = fileSelectorEl.nextElementSibling;
	var labelVal = label.innerHTML;
	var reader = new FileReader();

	// file reader setting
	reader.onload = function(e) {
	    var contents = e.target.result;
	    var data = d3.csvParse(contents);

  		ViewRenderer.render(data); // render the views
  	};

	fileSelectorEl.onclick = function() {
		// highlight the label on click
		fileSelectorEl.classList.add("selected");
	}
	
	document.body.onfocus = function() {
		// remove label highlight on return focus to document
		fileSelectorEl.classList.remove("selected"); 
	}

	fileSelectorEl.onchange = function(e) {
		// change file name on select file
		var fileName = e.target.value.split( '\\' ).pop();
		fileName = (fileName.length > 10) ? fileName.substring(0, 10) + "..." : fileName;

		if (fileName)
			label.querySelector("span").innerHTML = fileName;
		else
			label.innerHTML = labelVal;

		// load file into the database
		var file = this.files[0];
    	reader.readAsText(file);
	}

}(document, window, 0));