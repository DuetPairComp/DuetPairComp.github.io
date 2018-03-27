var Body = {
	init: function() {
		var self = this;

		self.initClickAnywhereBehaviour();
		self.initEnterBehaviour();
	},
	initClickAnywhereBehaviour: function() { // click to close group container
		$("body").click(function(event) {
			if (!$(event.target).hasClass("not-remove-group-container"))
				GroupContainer.remove();
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