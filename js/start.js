var margin = 5;
var full = "100%";

var col1Width = 200;
var col2Width = 300;
var col3Width = "calc(100% - 533px)";

var settingMenuHeight = 100;

var attributeListHeight = "calc(50% - 66.5px)";
var attributeListMinHeight = 50;
var attributeListContainerHeight = "calc(100% - 37px)";
var attributeListHeaderHeight = 30;
var attributeListSearchBoxHeight = 35;

var dataTableHeight = "calc(50% - 66.5px)";
var dataTableMinHeight = 50;
var dataTableSearchBoxHeight = 35;
var dataTableHeaderHeight = 25;
var dataTableContentHeight = "calc(100% - 61px)";
var dataTableFooterHeight = 25;

var comparisonPanelHeight = "calc(100% - 18px)";
var comparisonPanelMinHeight = 216;
var comparisonPanelShelvesHeight = 100;
var comparisonPanelResultsHeight = "calc(100% - 101px)";

var relationshipMapHeight = "calc(100% - 18px)";
var relationshipMapMinHeight = 216;
var storedAttributesPanelHeight = "calc(100% - 2px - 35px - 1.563em)";
var storedAttributesPanelWidth = 240;
var storedAttributesPanelHeaderHeight = 25;
var storedAttributesPanelContentHeight = "calc(100% - 62px)";
var storedAttributesPanelFooterHeight = 35;

var valueDiscretizerHeight = 250;
var valueDiscretizerWidth = 150;
var valueDiscretizerHeaderHeight = 25;
var valueDiscretizerContentHeight = "calc(100% - 53px)";
var valueDiscretizerFooterHeight = 25;
var valueDiscretizerNumberLineWidth = "40%";
var valueDiscretizerTextInputWidth = "calc(60% - 3.5px)";
var valueDiscretizerButtonWidth = "calc(50% - 1px)";

var systemReasoningPanelWidth = 240; // should not set height because content height might change

var groupContainerHeight = 150;
var groupContainerWidth = 217 - 3; // background left + background right + inner rect width - margin
var groupContainerHeaderHeight = 25;
var groupContainerContentHeight = "calc(100% - 26px)";

// dataset menu
const datasetMenuWidth = 230;
const datasetMenuHeaderHeight = 30;
const datasetMenuContentHeight = 150;
const datasetMenuContentContainerWidth = 'calc(100% - 20px)';
const datasetMenuContentContainerHeight = 150;
const datasetMenuFooterHeight = 45;

$(function() {
	$("body, html")
		.css("width", full)
		.css("height", full);

	// outer containers
	$("#col1")
		.css("width", col1Width)
		.css("height", full)
		.css("margin-right", margin);
	$("#col2")
		.css("width", col2Width)
		.css("height", full)
		.css("margin-right", margin);
	$("#col3")
		.css("width", col3Width)
		.css("height", full);

	// setting menu
	$("#setting-menu")
		.css("width", full)
		.css("height", settingMenuHeight)
		.css("min-height", settingMenuHeight)
		.css("margin-bottom", margin + 1);

	// attribute list
	$("#attribute-list")
		.css("width", full)
		.css("height", attributeListHeight)
		.css("min-height", attributeListMinHeight)
		.css("margin-bottom", margin + 1);
	$("#attribute-list .list")
		.css("height", attributeListContainerHeight)
		.css("width", full);
	$("#attribute-list .search-box")
		.css("width", full)
		.css("height", attributeListSearchBoxHeight);
	$("#attribute-list .header")
		.css("height", attributeListHeaderHeight)
		.css("width", full);
	$("#attribute-list .content") // not set height as it changes

	// data table
	$("#data-table")
		.css("width", full)
		.css("height", dataTableHeight)
		.css("min-height", dataTableMinHeight);
	$("#data-table .search-box")
		.css("width", full)
		.css("height", dataTableSearchBoxHeight);
	$("#data-table .header")
		.css("width", full)
		.css("height", dataTableHeaderHeight);
	$("#data-table .content")
		.css("width", full)
		.css("height", dataTableContentHeight);
	$("#data-table .content .wrapper")
		.css("width", full);
	$("#data-table .footer")
		.css("width", col1Width / 2)
		.css("height", dataTableFooterHeight);

	// comparison panel
	$("#comparison-panel")
		.css("width", full)
		.css("height", comparisonPanelHeight)
		.css("min-height", comparisonPanelMinHeight);
	$("#comparison-panel .shelves")
		.css("width", full)
		.css("height", comparisonPanelShelvesHeight);
	$("#comparison-panel .results")
		.css("width", full)
		.css("height", comparisonPanelResultsHeight);

	// relationship map
	$("#relationship-map")
		.css("width", full)
		.css("height", relationshipMapHeight)
		.css("min-height", relationshipMapMinHeight);
	$("#relationship-map #stored-attributes-panel")
		.css("width", storedAttributesPanelWidth)
		.css("height", storedAttributesPanelHeight);
	$("#relationship-map #stored-attributes-panel .header")
		.css("width", full)
		.css("height", storedAttributesPanelHeaderHeight);
	$("#relationship-map #stored-attributes-panel .content")
		.css("width", full)
		.css("height", storedAttributesPanelContentHeight);
	$("#relationship-map #stored-attributes-panel .footer")
		.css("width", full)
		.css("height", storedAttributesPanelFooterHeight);
	$("#relationship-map #stored-attributes-panel .footer .search-box")
		.css("height", full);
	$("#relationship-map #stored-attributes-panel .footer .filters")
		.css("height", full);

	// value discretizer
	var comparisonPanelPosition = $("#comparison-panel").position();

	$("#value-discretizer")
		.css("height", valueDiscretizerHeight)
		.css("width", valueDiscretizerWidth)
		.css("left", comparisonPanelPosition.left - 15);
	$("#value-discretizer .header")
		.css("height", valueDiscretizerHeaderHeight)
		.css("width", full);
	$("#value-discretizer .content")
		.css("height", valueDiscretizerContentHeight)
		.css("width", full);
	$("#value-discretizer .footer")
		.css("height", valueDiscretizerFooterHeight)
		.css("width", full);
	$("#value-discretizer .number-line")
		.css("height", full)
		.css("width", valueDiscretizerNumberLineWidth);
	$("#value-discretizer .text-input")
		.css("height", full)
		.css("width", valueDiscretizerTextInputWidth);
	$("#value-discretizer .button")
		.css("height", full)
		.css("width", valueDiscretizerButtonWidth);

	// system reasoning panel
	$("#system-reasoning-panel")
		.css("width", systemReasoningPanelWidth);

	// group container
	$("#group-container")
		.css("width", groupContainerWidth);
	$("#group-container")
		.css("height", groupContainerHeight);
	$("#group-container .header")
		.css("height", groupContainerHeaderHeight)
		.css("width", full);
	$("#group-container .content")
		.css("height", groupContainerContentHeight)
		.css("width", full);
	$("#group-container .content .container")
		.css("height", full)
		.css("width", full);

	// dataset menu
	$('#dataset-menu')
		.css('width', datasetMenuWidth);
	$('#dataset-menu .header')
		.css('height', datasetMenuHeaderHeight);
	$('#dataset-menu .content')
		.css('width', full)
		.css('height', datasetMenuContentHeight);
	$('#dataset-menu .content .container')
		.css('width', datasetMenuContentContainerWidth)
		.css('height', datasetMenuContentContainerHeight);
	$('#dataset-menu .footer')
		.css('width', full)
		.css('height', datasetMenuFooterHeight);

	// ----- SVG -----

	// data table
	d3.select("#data-table .header svg")
		.attr("width", full)
		.attr("height", full);
	d3.select("#data-table .content svg")
		.attr("width", full)
		.attr("height", "calc(100% - 10px)"); // prevent initial overflow
	d3.select("#data-table .footer svg")
		.attr("width", full)
		.attr("height", full);

	// attribute list
	d3.selectAll("#attribute-list .header svg")
		.attr("width", full)
		.attr("height", full);
	d3.selectAll("#attribute-list .content svg")
		.attr("width", full)
		.attr("height", 0);

	// value discretizer
	d3.select("#value-discretizer .number-line svg")
		.attr("height", full)
		.attr("width", full);

	// comparison panel
	d3.select("#comparison-panel .shelves svg")
		.attr("height", full)
		.attr("width", full);

	// group container
	d3.select("#group-container .content .container svg")
		.attr("height", full)
		.attr("width", full);

	// relationship map
	d3.select("#relationship-map svg")
		.attr("height", full)
		.attr("width", full);

	// init
	FileSelectorHandler.init();
	ValueDiscretizer.init();
	AttributeList.init();
	DataTable.init();
	ComparisonShelves.init();
	DraggableTag.init();
	GroupContainer.init();
	GraphVisualizer.init();
	RelationshipMap.init();
	StoredAttributesPanel.init();
	LongTitleTooltip.init();
	ColourManager.init();
	DatasetMenu.init();
	Body.init();

	// render interface when the essential font is loaded
	var fontLoader = new FontLoader(["News Cycle:n4"], {
		complete: function() {
			ViewRenderer.renderWithDefaultDataset("csv/cars.csv");
		}
	}, 3000).loadFonts();

	d3.selection.prototype.moveToFront = function() {
		return this.each(function() {
			this.parentNode.appendChild(this);
      	});
    };
    d3.selection.prototype.moveToBack = function() {  
        return this.each(function() { 
            var firstChild = this.parentNode.firstChild; 
            if (firstChild) { 
                this.parentNode.insertBefore(this, firstChild); 
            } 
        });
    };
});