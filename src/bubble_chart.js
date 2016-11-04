/* Bubble chart
 * 
 * Based on Jim Vallandingham's work
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */

function bubbleChart() {
    /* bubbleChart creation function. Returns a function that will
     * instantiate a new bubble chart given a DOM element to display
     * it in and a dataset to visualize.
    */
    // Constants for sizing
    var width = BUBBLE_PARAMETERS.width;
    var height = BUBBLE_PARAMETERS.height;

    // Tooltip object for mouseover functionality
    var tooltip = floatingTooltip('bubble_chart_tooltip', 240);

    // Locations to move bubbles towards, depending
    // on which view mode is selected.
    var center = { x: width / 2, y: height / 2 };

    // SET COLOURS
    var color_groupsKeys = Object.keys(BUBBLE_PARAMETERS.fill_color.color_groups)
    var color_groupsValues = []
    for (var i=0; i<color_groupsKeys.length; i++) {
        var key = color_groupsKeys[i]
        color_groupsValues.push(BUBBLE_PARAMETERS.fill_color.color_groups[key])
    }
    
    // Nice looking colors - no reason to buck the trend
    var fillColor = d3.scaleOrdinal()
        .domain(color_groupsKeys)
        .range(color_groupsValues);

    // SCALE BUBBLE SIZES
    // Using ^(0.5), size bubbles based on area instead of radius
    var radiusScale = d3.scalePow()
        .exponent(0.5)
        .range([2, 25]);  // Range between 2 and 50 pixels

    // These will be set in createNodes and create_vis
    var svg = null;
    var bubbles = null;
    var forceSim = null;
    var nodes = [];

    function createNodes(rawData) {
        /*
         * This data manipulation function takes the raw data from
         * the CSV file and converts it into an array of node objects.
         * Each node will store data and visualization values to visualize
         * a bubble.
         *
         * rawData is expected to be an array of data objects, read in from
         * one of d3's loading functions like d3.csv.
         *
         * This function returns the new node array, with a node in that
         * array for each element in the rawData input.
         */
        // Use map() to convert raw data into node data.
        // Checkout http://learnjsdata.com/ for more on
        // working with data.
        var myNodes = rawData.map(function (data_row) {
            node = {
                id: data_row.id,
                scaled_radius: radiusScale(+data_row[BUBBLE_PARAMETERS.radius_field]),
                actual_radius: +data_row[BUBBLE_PARAMETERS.radius_field],
                fill_color_group: data_row[BUBBLE_PARAMETERS.fill_color.data_field],
                // Put each node initially in a random location
                x: Math.random() * BUBBLE_PARAMETERS.width,
                y: Math.random() * BUBBLE_PARAMETERS.height
            };
            for(var key in data_row) {
                // Skip loop if the property is from prototype
                if (!data_row.hasOwnProperty(key)) continue;
                node[key] = data_row[key];
            }
            
            return node;
        });

        // Sort them to prevent occlusion of smaller nodes.
        myNodes.sort(function (a, b) { return b.actual_radius - a.actual_radius; });

        return myNodes;
    }

    function getTargetFunction(mode) {
        // Given a mode, return an anonymous function that maps nodes to target coordinates
        return function (node) {
            // Given a mode and node, return the correct target
            if(mode.size == 1) {
                target = mode.gridCenters[""];
                //console.log("targets size 1, so target is ", target)
            } else {
                // If the grid size is greater than 1, look up the appropriate target
                // coordinate using the relevant node_tag for the mode we are in
                node_tag = node[mode.dataField]
                target = mode.gridCenters[node_tag];
            }
            return target;
        }
    }

    function showLabels(mode) {
        /*
         * Shows labels for each of the positions in the grid.
         */
        console.log("Show bubble group labels");

        var currentLabels = mode.labels; 
        var bubble_group_labels = svg.selectAll('.bubble_group_label')
            .data(currentLabels);

        var grid_element_half_height = BUBBLE_PARAMETERS.height / (mode.gridDimensions.rows * 2);
            
        bubble_group_labels.enter().append('text')
            .attr('class', 'bubble_group_label')
            .attr('x', function (d) { return mode.gridCenters[d].x; })
            .attr('y', function (d) { return mode.gridCenters[d].y - grid_element_half_height; })
            .attr('text-anchor', 'middle')                // centre the text
            .attr('dominant-baseline', 'hanging') // so the text is immediately below the bounding box, rather than above
            .text(function (d) { return d; });

        // GRIDLINES FOR DEBUGGING PURPOSES
        /*
        var grid_element_half_height = BUBBLE_PARAMETERS.height / (mode.gridDimensions.rows * 2);
        var grid_element_half_width = BUBBLE_PARAMETERS.width / (mode.gridDimensions.columns * 2);
        
        for (var key in currentMode.gridCenters) {
            if (currentMode.gridCenters.hasOwnProperty(key)) {
                var rectangle = svg.append("rect")
                    .attr("class", "mc_debug")
                    .attr("x", currentMode.gridCenters[key].x - grid_element_half_width)
                    .attr("y", currentMode.gridCenters[key].y - grid_element_half_height)
                    .attr("width", grid_element_half_width*2)
                    .attr("height", grid_element_half_height*2)
                    .attr("stroke", "red")
                    .attr("fill", "none");
                var ellipse = svg.append("ellipse")
                    .attr("class", "mc_debug")
                    .attr("cx", currentMode.gridCenters[key].x)
                    .attr("cy", currentMode.gridCenters[key].y)
                    .attr("rx", 15)
                    .attr("ry", 10);
            }
        } 
        */
    }

    function tooltipContent(d) {
        /*
         * Helper function to generate the tooltip content
         * 
         * Parameters: d, a dict from the node
         * Returns: a string representing the formatted HTML to display
         */
        var content = ''

        // Loop through all lines we want displayed in the tooltip
        for(var i=0; i<BUBBLE_PARAMETERS.tooltip.length; i++) {
            var cur_tooltip = BUBBLE_PARAMETERS.tooltip[i];
            var value_formatted;

            // If a format was specified, use it
            if ("format_string" in cur_tooltip) {
                value_formatted = 
                    d3.format(cur_tooltip.format_string)(d[cur_tooltip.data_field]);
            } else {
                value_formatted = d[cur_tooltip.data_field];
            }
            
            // If there was a previous tooltip line, add a newline separator
            if (i > 0) {
                content += '<br/>';
            }
            content += '<span class="name">'    + cur_tooltip.title + ': </span>';
            content += '<span class="value">' + value_formatted     + '</span>';
        }        

        return content;
    }

    function showTooltip(d) {
        /*
         * Function called on mouseover to display the
         * details of a bubble in the tooltip.
         */
        // Change the circle's outline to indicate hover state.
        d3.select(this).attr('stroke', 'black');

        // Show the tooltip
        tooltip.showTooltip(tooltipContent(d), d3.event);
    }

    function hideTooltip(d) {
        /*
         * Hide tooltip
         */
        // Reset the circle's outline back to its original color.
        var originalColor = d3.rgb(fillColor(d.fill_color_group)).darker()
        d3.select(this).attr('stroke', originalColor);

        // Hide the tooltip
        tooltip.hideTooltip();
    }

    function ticked() {
        bubbles.each(function (node) {})
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }        
    //////////////////////////////////////////////////////////////
    
    var chart = function chart(selector, rawData) {
        /*
         * Main entry point to the bubble chart. This function is returned
         * by the parent closure. It prepares the rawData for visualization
         * and adds an svg element to the provided selector and starts the
         * visualization creation process.
         *
         * selector is expected to be a DOM element or CSS selector that
         * points to the parent element of the bubble chart. Inside this
         * element, the code will add the SVG continer for the visualization.
         *
         * rawData is expected to be an array of data objects as provided by
         * a d3 loading function like d3.csv.
         */

        // Use the max radius in the data as the max in the scale's domain
        // (Ensure the radius is a number by converting it with `+`)
        var maxAmount = d3.max(rawData, function (d) { return +d[BUBBLE_PARAMETERS.radius_field]; });
        radiusScale.domain([0, maxAmount]);

        nodes = createNodes(rawData);

        // Create a SVG element inside the provided selector with desired size.
        svg = d3.select(selector)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        console.log("nodes", nodes);
            
        // Bind nodes data to what will become DOM elements to represent them.
        svg.selectAll('.bubble')
            .data(nodes, function (d) { return d.id; })
            // Create new circle elements each with class `bubble`.
            // There will be one circle.bubble for each object in the nodes array.
            .enter().append('circle')
            .classed('bubble', true)
            // Initially, their radius (r attribute) will be 0.
            .attr('r', 0)
            .attr('fill', function (d) { return fillColor(d.fill_color_group); })
            .attr('stroke', function (d) { return d3.rgb(fillColor(d.fill_color_group)).darker(); })
            .attr('stroke-width', 2)
            .on('mouseover', showTooltip)
            .on('mouseout', hideTooltip);

        bubbles = d3.selectAll('.bubble');

        // Fancy transition to make bubbles appear, ending with the correct radius
        bubbles.transition()
            .duration(2000)
            .on("start", function (d) {console.log("gah");})
            .attr('r', function (d) { return d.scaled_radius; });

        forceSim = d3.forceSimulation(nodes)
            .velocityDecay(0.1)
            .force("collide", d3.forceCollide().radius(function(d) { return d.scaled_radius + 0.5; }).iterations(3))
            .on("tick", ticked);
    };

    chart.switchMode = function (buttonId) {
        /*
         * Externally accessible function (this is attached to the
         * returned chart function). Allows the visualization to toggle
         * between display modes.
         *
         * buttonId is expected to be a string corresponding to one of the modes.
         */
        // Get data on the new mode we have just switched to
        currentMode = new ViewMode(buttonId)

        // Remove current labels
        label_elements = svg.selectAll('.bubble_group_label').remove();
        // Remove current debugging elements
        debug_elements = svg.selectAll('.mc_debug').remove(); // DEBUG

        // Show labels, if we have more than one category to label
        if (currentMode.size > 1) {
            showLabels(currentMode);
        }
        
        // Move the bubbles to their new locations

        // Given the mode we are in, obtain the node -> target mapping
        var targetFunction = getTargetFunction(currentMode)
        
        // Specify the target of the force layout for each of the circles
        forceSim
            .force("x", d3.forceX(function(d) {return targetFunction(d).x}).strength(0.02))
            .force("y", d3.forceY(function(d) {return targetFunction(d).y}).strength(0.02));

        // Restart the force layout simulation
        forceSim.alphaTarget(1).restart();
    };
    
    // Return the chart function from closure.
    return chart;
}

/////////////////////////////////////////////////////////////////////////////////////
// OBJECT
function ViewMode(button_id) {
    /* ViewMode: an object that has useful parameters for each view mode.
     * initialize it with your desired view mode, then use its parameters.
     * Attributes:
     - mode_index (which button was pressed)
     - buttonId     (which button was pressed)
     - gridDimensions    e.g. {"rows": 10, "columns": 20}
     - gridCenters         e.g. {"group1": {"x": 10, "y": 20}, ...}
     - dataField    (string)
     - labels     (an array)
     - size         (number of groups)
     */
    var width = BUBBLE_PARAMETERS.width;
    var height = BUBBLE_PARAMETERS.height;

    // Find which button was pressed
    var mode_index;
    for(mode_index=0; mode_index<BUBBLE_PARAMETERS.modes.length; mode_index++) {
        if(BUBBLE_PARAMETERS.modes[mode_index].button_id == button_id) {
            break;
        }
    }
    if(mode_index>=BUBBLE_PARAMETERS.modes.length) {
        console.log("Error: can't find mode with button_id = ", button_id)
    }
    
    var curMode = BUBBLE_PARAMETERS.modes[mode_index];
    this.buttonId = curMode.button_id;
    this.gridDimensions = curMode.grid_dimensions;
    this.dataField = curMode.data_field;
    this.labels = curMode.labels;
    if (this.labels == null) { this.labels = [""]; }
    this.size = this.labels.length;

    
    // Loop through all grid labels and assign the centre coordinates
    this.gridCenters = {};
    for(var i=0; i<this.size; i++) {
        var cur_row = Math.floor(i / this.gridDimensions.columns);    // indexed starting at zero
        var cur_col = i % this.gridDimensions.columns;    // indexed starting at zero
        var xx = {
            x: (2 * cur_col + 1) * (width / (this.gridDimensions.columns * 2)),
            y: (2 * cur_row + 1) * (height / (this.gridDimensions.rows * 2))
        };
        this.gridCenters[this.labels[i]] = xx;
        console.log("gridcentre", i, xx.x, xx.y);
    }
};


/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

// Set title
document.title = BUBBLE_PARAMETERS.report_title;
report_title.innerHTML = BUBBLE_PARAMETERS.report_title;
// Set footer
document.getElementById("footer_text").innerHTML = BUBBLE_PARAMETERS.footer_text;

// Create a new bubble chart instance
var myBubbleChart = bubbleChart();

// Load data
d3.csv("data/" + BUBBLE_PARAMETERS.data_file, function (error, data) {
    // Once the data is loaded...
    
    if (error) { console.log(error); }

    // Display bubble chart inside the #vis div.
    myBubbleChart('#vis', data);

    // Start the visualization with the first button
    myBubbleChart.switchMode(BUBBLE_PARAMETERS.modes[0].button_id)
});

function setupButtons() {
    // As the data is being loaded: setup buttons
    // Create the buttons
    // TODO: change this to use native d3js selection methods
    for (i = 0; i<BUBBLE_PARAMETERS.modes.length; i++) {
        var button_element = document.createElement("a");
        button_element.href = "#";
        if (i == 0) {
            button_element.className = "button active";
        } else {
            button_element.className = "button";
        }
        button_element.id = BUBBLE_PARAMETERS.modes[i].button_id;
        button_element.innerHTML = BUBBLE_PARAMETERS.modes[i].button_text;
        document.getElementById("toolbar").appendChild(button_element);
    }     

    // Handle button click
    // Set up the layout buttons to allow for toggling between view modes.
    d3.select('#toolbar')
        .selectAll('.button')
        .on('click', function () {
            // Remove active class from all buttons
            d3.selectAll('.button').classed('active', false);

            // Set the button just clicked to active
            d3.select(this).classed('active', true);

            // Get the id of the button
            var buttonId = d3.select(this).attr('id');

            // Switch the bubble chart to the mode of
            // the currently clicked button.
            myBubbleChart.switchMode(buttonId);
        });    
}

setupButtons();
