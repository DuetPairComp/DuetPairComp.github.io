var AttributeList = {
	marginLeft: { header: 10, attribute: 20 },
	height: { header: 30, attribute: 25 },

	IDHeaderSVG: null,
	IDContentSVG: null,
	categoricalListHeaderSVG: null,
	categoricalListContentSVG: null,
	numericalListHeaderSVG: null,
	numericalListContentSVG: null,

	init: function() {
		var self = this;

		self.IDHeaderSVG = d3.select("#attribute-list .id.header svg");
		self.IDContentSVG = d3.select("#attribute-list .id.content svg");

		self.categoricalListHeaderSVG = d3.select("#attribute-list .categorical.header svg");
		self.categoricalListContentSVG = d3.select("#attribute-list .categorical.content svg");

		self.numericalListHeaderSVG = d3.select("#attribute-list .numerical.header svg");
		self.numericalListContentSVG = d3.select("#attribute-list .numerical.content svg");

		$("#attribute-list .search-box input").on("input", inputSearchBox);

		function inputSearchBox() {
			var keyword = $(this).val().toLowerCase();
			self.remove();

			// id attribute
			var willDrawID = Database.IDAttr.toLowerCase().indexOf(keyword) != -1
			if (willDrawID)
				self.drawID(Database.IDAttr);
			else
				self.hide("id");

			// categorical attribute
			var categoricalAttrWithKeyword = [];
			for (var i = 0; i < Database.categoricalAttr.length; i++)
				if (Database.categoricalAttr[i].toLowerCase().indexOf(keyword) != -1)
					categoricalAttrWithKeyword.push(Database.categoricalAttr[i]);

			var willDrawID = categoricalAttrWithKeyword.length != 0;
			if (willDrawID)
				self.drawCategoricalList(categoricalAttrWithKeyword);
			else
				self.hide("categorical");
			
			// numerical attribute
			var numericalAttrWithKeyword = [];
			for (var i = 0; i < Database.numericalAttr.length; i++)
				if (Database.numericalAttr[i].toLowerCase().indexOf(keyword) != -1)
					numericalAttrWithKeyword.push(Database.numericalAttr[i]);

			var willDrawID = numericalAttrWithKeyword.length != 0;
			if (willDrawID)
				self.drawNumericialList(numericalAttrWithKeyword);
			else
				self.hide("numerical");
		}
	},
	hide: function(type) {
		$("#attribute-list ." + type + ".header").css("display", "none");
		$("#attribute-list ." + type + ".content").css("display", "none");
	},
	show: function() {
		var self = this;

		self.remove();
		self.drawID(Database.IDAttr);
		self.drawCategoricalList(Database.categoricalAttr);
		self.drawNumericialList(Database.numericalAttr);
	},
	remove: function() {
		var self = this;

		self.IDHeaderSVG.selectAll("*").remove();
		self.IDContentSVG.selectAll("*").remove();
		self.categoricalListHeaderSVG.selectAll("*").remove();
		self.categoricalListContentSVG.selectAll("*").remove();
		self.numericalListHeaderSVG.selectAll("*").remove();
		self.numericalListContentSVG.selectAll("*").remove();

		// the class may be removed previosly
		$("#attribute-list .header").addClass("expanded");
		$("#attribute-list .header").css("display", "");
		$("#attribute-list .content").css("display", "");
	},
	drawID: function(IDAttr) {
		var self = this;

		// draw header
		var IDHeader = self.IDHeaderSVG.append("g")
			.style("cursor", "pointer")
			.on("click", clickHeader);

		IDHeader.append("rect") // background rect
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", full)
			.attr("height", full)
			.style("fill", "white");

		var IDHeaderText = IDHeader.append("text")
			.attr("x", self.marginLeft.header)
			.attr("y", self.height.header / 2)
			.style("alignment-baseline", "middle")
			.style("font-weight", "bold")
			.text("ID");

		IDHeader.append("text")
			.attr("class", "caret")
			.attr("x", 27)
			.attr("y", self.height.header / 2 + 3)
			.style("text-anchor", "start")
			.style("font-family", "FontAwesome")
			.text("\uf0d8");

		// draw ID
		var ID = self.IDContentSVG.append("g")
			.attr("class", "attribute");

		ID.append("text")
			.attr("x", self.marginLeft.attribute)
			.attr("y", self.height.attribute / 2)
			.style("alignment-baseline", "middle")
			.text(IDAttr);

		// change height
		self.IDContentSVG
			.attr("height", self.height.attribute);

		function clickHeader() {
			if ($(".id.header").hasClass("expanded")) {
				$(".id.header").removeClass("expanded");
				d3.select(this).select(".caret").text("\uf0d7");
			}
			else {
				$(".id.header").addClass("expanded");
				d3.select(this).select(".caret").text("\uf0d8");
			}
		}
	},
	drawCategoricalList: function(categoricalAttrList) {
		var self = this;

		// draw header
		var categoricalListHeader = self.categoricalListHeaderSVG.append("g")
			.style("cursor", "pointer")
			.on("click", clickHeader);

		categoricalListHeader.append("rect") // background rect
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", full)
			.attr("height", full)
			.style("fill", "white");

		var categoricalListHeaderText = categoricalListHeader.append("text")
			.attr("x", self.marginLeft.header)
			.attr("y", self.height.header / 2)
			.style("alignment-baseline", "middle")
			.style("font-weight", "bold")
			.text("Categorical Attributes");

		categoricalListHeader.append("text")
			.attr("class", "caret")
			.attr("x", 128)
			.attr("y", self.height.header / 2 + 3)
			.style("text-anchor", "start")
			.style("font-family", "FontAwesome")
			.text("\uf0d8");

		// draw list
		var categoricalList = self.categoricalListContentSVG.selectAll(".attribute")
			.data(categoricalAttrList)
			.enter()
			.append("g")
			.attr("class", "attribute")
			.attr("transform", function(d, i) {
				return "translate(0," + i * self.height.attribute + ")";
			})
			.attr("attribute-name", function(d) {
				return d;
			})
			.on("mouseenter", mouseenterAttribute);

		categoricalList.each(function(d) {
			var shortText = Helper.createShortString(d, 30);

			var attrText = d3.select(this).append("text")
				.attr("x", self.marginLeft.attribute)
				.attr("y", self.height.attribute / 2)
				.style("alignment-baseline", "middle")
				.text(shortText);

			var bbox = attrText.node().getBBox();
			d3.select(this).insert("rect", "text")
				.attr("rx", 3)
				.attr("ry", 3)
				.attr("x", bbox.x - 5)
				.attr("y", bbox.y)
				.attr("width", bbox.width + 10)
				.attr("height", bbox.height);
		});

		// change height
		self.categoricalListContentSVG
			.attr("height", categoricalAttrList.length * self.height.attribute);

		function clickHeader() {
			if ($(".categorical.header").hasClass("expanded")) {
				$(".categorical.header").removeClass("expanded");
				d3.select(this).select(".caret").text("\uf0d7");
			}
			else {
				$(".categorical.header").addClass("expanded");
				d3.select(this).select(".caret").text("\uf0d8");
			}
		}

		function mouseenterAttribute(d) {
			if (DraggableTag.dragged) // disable action on drag
				return;

			var textNode = d3.select(this).select("text").node();
			var position = $(textNode).position();
			var textInTag = d;

			DraggableTag.display(position.top, position.left, textInTag);
			self.TagBahaviour.storeTargetObject(this);
			DraggableTag.storeBehaviourName("attribute|click:changeSecondColumn"); // for checking if it can be put into a shelf
			DraggableTag.storeConfiguration(d);
			DraggableTag.storeGroupName("");
		}
	},
	drawNumericialList: function(numericalAttrList) {
		var self = this;

		// draw header
		var numericalListHeader = self.numericalListHeaderSVG.append("g")
			.style("cursor", "pointer")
			.on("click", clickHeader);

		numericalListHeader.append("rect") // background rect
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", full)
			.attr("height", full)
			.style("fill", "white");
		var numericalListHeaderText = numericalListHeader.append("text")
			.attr("x", self.marginLeft.header)
			.attr("y", self.height.header / 2)
			.style("alignment-baseline", "middle")
			.style("font-weight", "bold")
			.text("Numerical Attributes");
		numericalListHeader.append("text")
			.attr("class", "caret")
			.attr("x", 122)
			.attr("y", self.height.header / 2 + 3)
			.style("font-family", "FontAwesome")
			.text("\uf0d8");

		// draw list
		var numericalList = self.numericalListContentSVG.selectAll(".attribute")
			.data(numericalAttrList)
			.enter()
			.append("g")
			.attr("class", "attribute")
			.attr("transform", function(d, i) {
				return "translate(0," + i * self.height.attribute + ")";
			});

		numericalList.each(function(d) {
			var shortText = Helper.createShortString(d, 23);
			var attrText = d3.select(this).append("text")
				.attr("x", self.marginLeft.attribute)
				.attr("y", self.height.attribute / 2)
				.style("alignment-baseline", "middle")
				.text(shortText)
				.on("mouseenter", mouseenterAttribute);;

			var bbox = attrText.node().getBBox();
			d3.select(this).insert("rect", "text")
				.attr("rx", 3)
				.attr("ry", 3)
				.attr("x", bbox.x - 5)
				.attr("y", bbox.y)
				.attr("width", bbox.width + 10)
				.attr("height", bbox.height);
			d3.select(this).append("text")
				.attr("class", "cog")
				.attr("x", bbox.x - 5 + bbox.width + 10 + 10)
				.attr("y", bbox.y + bbox.height / 2 + 2)
				.style("alignment-baseline", "middle")
				.style("font-family", "FontAwesome")
				.style("cursor", "pointer")
				.text("\uf013")
				.on("mouseenter", mouseenterDiscretizeButton)
				.on("mouseleave", mouseleaveDiscretizeButton)
				.on("click", clickDiscretizeButton);
		});

		// change height
		self.numericalListContentSVG
			.attr("height", numericalAttrList.length * self.height.attribute);

		function clickHeader() {
			if ($(".numerical.header").hasClass("expanded")) {
				$(".numerical.header").removeClass("expanded");
				d3.select(this).select(".caret").text("\uf0d7");
			}
			else {
				$(".numerical.header").addClass("expanded");
				d3.select(this).select(".caret").text("\uf0d8");
			}
		}

		function mouseenterAttribute(d) {
			if (DraggableTag.dragged) // disable action on drag
				return;

			var textNode = d3.select(this).node();
			var position = $(textNode).position();
			var textInTag = d;

			DraggableTag.display(position.top, position.left, textInTag);
			self.TagBahaviour.storeTargetObject(this);
			DraggableTag.storeBehaviourName("attribute|click:changeSecondColumn"); // for checking if it can be put into a shelf
			DraggableTag.storeConfiguration(d);
			DraggableTag.storeGroupName("");
		}

		function mouseenterDiscretizeButton() {
			var bbox = this.getBoundingClientRect();

			// show tooltip
			$("#tooltip")
				.attr("data-tooltip", "Click to Discretize")
				.css("top", bbox.top - 5)
				.css("left", bbox.left + bbox.width / 2)
				.addClass("show")
				.removeClass("right"); // make sure it is not right
		}

		function mouseleaveDiscretizeButton() {
			$("#tooltip").removeClass("show");
		}

		function clickDiscretizeButton() {
			$("#tooltip").removeClass("show");

			// if already selected, remove it
			if (d3.select(this).classed("selected")) {
				ValueDiscretizer.remove();
				d3.select(this).classed("selected", false);
			}

			// if not already selected, show
			else {
				var attributeTop = this.getBoundingClientRect().top;
				var attributeName = d3.select(this).datum();
				
				ValueDiscretizer.show(attributeName, attributeTop);
				self.numericalListContentSVG.selectAll("text.cog.selected").classed("selected", false);
				d3.select(this).classed("selected", true);
			}
		}
	},

	// for routing event on tag
	TagBahaviour: {
		targetObject: null, // the full attribute name

		storeTargetObject: function(targetObject) {
			var self = AttributeList;

			self.TagBahaviour.targetObject = targetObject;
		},
		clickAttributeName: function() {
			var self = AttributeList;
			var attributeName = d3.select(self.TagBahaviour.targetObject).datum();

			DataTable.changeSecondColumnHeader(attributeName);
			DataTable.changeSecondColumnContent(attributeName, false);
			DataTable.SortButton.changeToOriginal();
		}
	}
}