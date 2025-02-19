/* script.js */
const width = 800;
const height = 500;
const margin = { top: 50, right: 100, bottom: 70, left: 100 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const svg_map = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

const image = svg_map.append("image")
    .attr("xlink:href", "US_map.jpg")
    .attr("width", 700)
    .attr("height", 400)
    .attr("x", 800)
    .attr("y", -500);

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let orientation = "upright";
let scatterXVariable = null;
let scatterYVariable = null;
let toggled = 1; // 1 for upright, 0 for sideways orientation

// State abbreviation mapping
const stateAbbreviation = {
    "1": "NY", "2": "PA", "3": "CO", "4": "ME", "5": "MA", "6": "CA", "7": "TX"
};

// Variables that should use a logarithmic scale due to high skewness
const logScaleVariables = [
    "Civilian_labor_force_2020", "Employed_2020", "Unemployed_2020",
    "Less than high school graduate, 2019-23", "High school graduate (or equivalency), 2019-23",
    "Some college or associate degree, 2019-23", "Bachelor's degree or higher, 2019-23",
    "CENSUS_2020_POP", "Joseph Biden Votes, 2020", "Donald Trump Votes, 2020",
    "Jo Jorgensen Votes, 2020", "Green Party Votes, 2020", "Other Votes, 2020", "Total Votes, 2020"
];

d3.csv("FINAL CSE 564 Proj 1 Dataset.csv").then(data => {
    const variableSelect = d3.select("#variable-select");
    const orientationToggle = d3.select("#orientation-toggle");
    const axisSelection = d3.selectAll("input[name='axis']");

    let selectedVariable = variableSelect.property("value");

    variableSelect.on("change", function () {
        selectedVariable = this.value;
        if (axisSelection.property("value") === "x") {
            scatterXVariable = selectedVariable;
        } else {
            scatterYVariable = selectedVariable;
        }
        if (toggled === 1) {
            updateChart();
        }
        if (selectedVariable === "state_po" && toggled === 0) {
            drawHorizontalBarChart();
        } else if (toggled === 0) {
            drawHorizontalHistogram();
        }
    });

    orientationToggle.on("click", function () {
        orientation = orientation === "upright" ? "sideways" : "upright";
        if (selectedVariable === "state_po" && toggled === 1) {
            drawHorizontalBarChart();
            toggled = 0;
        } else if (toggled === 1){
            drawHorizontalHistogram();
            toggled = 0;
        } else {
            updateChart();
            toggled = 1;
        }
        
    });

    axisSelection.on("change", function () {
        // Update scatterplot only if both x and y variables are selected
        if (scatterXVariable && scatterYVariable) {
            updateScatterplot();
        }
    });

    function updateChart() {
        svg.selectAll("*").remove();

        if (selectedVariable === "state_po") {
            drawBarChart(data);
        } else if (logScaleVariables.includes(selectedVariable)) {
            drawHistogram(data, true); // Use log scale
        } else {
            drawHistogram(data, false); // Use linear scale
        }
    }

    function drawHorizontalBarChart() {
        svg.selectAll("*").remove();
        const stateCounts = d3.rollup(data, v => v.length, d => d.state_po);
        const states = Array.from(stateCounts.keys());
        const counts = Array.from(stateCounts.values());

        const xScale = d3.scaleBand()
            .domain(states)
            .range([0, innerHeight])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(counts)])
            .range([innerWidth, 0]);

        const yVisualScale = d3.scaleLinear()
            .domain([d3.max(counts), 0])
            .range([innerWidth, 0]);

        const xAxis = d3.axisLeft(xScale);
        const yAxis = d3.axisBottom(yVisualScale);

        svg.append("g")
            .attr("transform", `translate(0,0)`)
            .call(xAxis);

        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(yAxis);

        const bars = svg.selectAll(".bar")
            .data(states)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d) * -1 - 50) //From our perspective, this is the "y" position
            .attr("y", 0) //From our perspective, this is the "x" position
            .attr("width", xScale.bandwidth()) //This is the "height" from our perspective
            .attr("height", d => innerWidth - yScale(stateCounts.get(d))) // This is actually the "width" from our perspective
            .attr("transform", `rotate(270)`)
            .on("mouseover", function (event, d) {
                // Show tooltip on hover
                const stateAbbr = stateAbbreviation[d];
                const count = stateCounts.get(d);
                d3.select(this).attr("fill", "orange");
                svg.append("text")
                    .attr("class", "tooltip")
                    .attr("x", yScale(count) / 2)
                    .attr("y", xScale(d) + 15)
                    .style("text-anchor", "middle")
                    .text(`${stateAbbr}: ${count}`);
            })
            .on("mouseout", function () {
                // Hide tooltip on mouse out
                d3.select(this).attr("fill", "steelblue");
                svg.selectAll(".tooltip").remove();
            })
            .transition()
            .duration(500);

        // Add x-axis label
        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", 0 + 315) 
            .attr("y", 435) 
            .style("text-anchor", "middle")
            .text(orientation === "upright" ? "State ID Code" : "Number of Counties");

        // Add y-axis label
        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", orientation === "upright" ? `rotate(0)` : `rotate(-90)`)
            .attr("x", -200) 
            .attr("y", -50) 
            .style("text-anchor", "middle")
            .text(orientation === "upright" ? "Number of Counties" : "State ID Code");
        
        // Add title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", (width / 2) - 75)             
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .style("text-decoration", "underline")  
            .text("Number of Counties by State");
    }

    function drawHorizontalHistogram() {
        svg.selectAll("*").remove();
        const values = data.map(d => +d[selectedVariable]).filter(d => !isNaN(d));
        const bins = d3.bin()
            .domain([d3.min(values), d3.max(values)])
            .thresholds(10)(values);

        const xScale = d3.scaleLinear()
            .domain([d3.min(values), d3.max(values)])
            .range([0, innerHeight]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([innerWidth, 0]);

        const yVisualScale = d3.scaleLinear()
            .domain([d3.max(bins, d => d.length), 0])
            .range([innerWidth, 0]);

        const xAxis = d3.axisLeft(xScale);
        const yAxis = d3.axisBottom(yVisualScale);

        svg.append("g")
            .attr("transform", `translate(0,0)`)
            .call(xAxis);

        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(yAxis);

        const bars = svg.selectAll(".bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.x0) * -1 - 50) //From our perspective, this is the "y" position
            .attr("y", 0) //From our perspective, this is the "x" position
            .attr("width", xScale(d.x1) - xScale(d.x0)) //This is the "height" from our perspective
            .attr("height", d => innerWidth - yScale(d.length)) // This is actually the "width" from our perspective
            .attr("transform", `rotate(270)`)
            .on("mouseover", function (event, d) {
                // Show tooltip on hover
                const count = d.length;
                d3.select(this).attr("fill", "orange");
                svg.append("text")
                    .attr("class", "tooltip")
                    .attr("x", yScale(count) / 2)
                    .attr("y", xScale(d.x0) + 15)
                    .style("text-anchor", "middle")
                    .text(`Counties ${count}`);
            })
            .on("mouseout", function () {
                // Hide tooltip on mouse out
                d3.select(this).attr("fill", "steelblue");
                svg.selectAll(".tooltip").remove();
            })
            .transition()
            .duration(500);
    }

    function drawBarChart(data) {
        svg.selectAll("*").remove();
        const stateCounts = d3.rollup(data, v => v.length, d => d.state_po);
        const states = Array.from(stateCounts.keys());
        const counts = Array.from(stateCounts.values());

        const xScale = d3.scaleBand()
            .domain(states)
            .range(orientation === "upright" ? [0, innerWidth] : [0, innerHeight])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(counts)])
            .range(orientation === "upright" ? [innerHeight, 0] : [innerWidth, 0]);

        const xAxis = orientation === "upright" ? d3.axisBottom(xScale) : d3.axisLeft(xScale);
        const yAxis = orientation === "upright" ? d3.axisLeft(yScale) : d3.axisBottom(yScale);

        svg.append("g")
            .attr("transform", orientation === "upright" ? `translate(0,${innerHeight})` : `translate(0,0)`)
            .call(xAxis);

        svg.append("g")
            .attr("transform", orientation === "upright" ? `translate(0,0)` : `translate(0,${innerHeight})`)
            .call(yAxis);

        const bars = svg.selectAll(".bar")
            .data(states)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => orientation === "upright" ? xScale(d) : 0)
            .attr("y", d => orientation === "upright" ? yScale(stateCounts.get(d)) : xScale(d))
            .attr("width", xScale.bandwidth())
            .attr("height", d => orientation === "upright" ? innerHeight - yScale(stateCounts.get(d)) : yScale(stateCounts.get(d)))
            .on("mouseover", function (event, d) {
                // Show tooltip on hover
                const stateAbbr = stateAbbreviation[d];
                const count = stateCounts.get(d);
                d3.select(this).attr("fill", "orange");
                svg.append("text")
                    .attr("class", "tooltip")
                    .attr("x", orientation === "upright" ? xScale(d) + xScale.bandwidth() / 2 : yScale(count) / 2)
                    .attr("y", orientation === "upright" ? yScale(count) - 5 : xScale(d) + 15)
                    .style("text-anchor", "middle")
                    .text(`${stateAbbr}: ${count}`);
            })
            .on("mouseout", function () {
                // Hide tooltip on mouse out
                d3.select(this).attr("fill", "steelblue");
                svg.selectAll(".tooltip").remove();
            })
            .transition()
            .duration(500);

        // Add x-axis label
        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", orientation === "upright" ? innerWidth / 2 : -innerHeight / 2)
            .attr("y", orientation === "upright" ? innerHeight + margin.bottom - 10 : -margin.left + 20)
            .style("text-anchor", "middle")
            .text(orientation === "upright" ? "State ID Code" : "Number of Counties");

        // Add y-axis label
        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", orientation === "upright" ? `rotate(-90)` : `rotate(0)`)
            .attr("x", orientation === "upright" ? -innerHeight / 2 : innerWidth / 2)
            .attr("y", orientation === "upright" ? -margin.left + 20 : innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text(orientation === "upright" ? "Number of Counties" : "State ID Code");
        
        // Add title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", (width / 2) - 75)             
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .style("text-decoration", "underline")  
            .text("Number of Counties by State");
    }

    function drawHistogram(data, useLogScale) {
        const values = data.map(d => +d[selectedVariable]).filter(d => !isNaN(d));
        const bins = d3.bin()
            .domain([d3.min(values), d3.max(values)])
            .thresholds(10)(values);

        const xScale = d3.scaleLinear()
            .domain([d3.min(values), d3.max(values)])
            .range(orientation === "upright" ? [0, innerWidth] : [0, innerHeight]);

        const yScale = useLogScale ? d3.scaleLog() : d3.scaleLinear();
        yScale.domain([1, d3.max(bins, d => d.length)]) // Log scale starts at 1
            .range(orientation === "upright" ? [innerHeight, 0] : [innerWidth, 0]);

        const xAxis = orientation === "upright" ? d3.axisBottom(xScale) : d3.axisLeft(xScale);
        const yAxis = orientation === "upright" ? d3.axisLeft(yScale) : d3.axisRight(yScale);

        // Append x-axis and y-axis

        svg.append("g")
            .attr("transform", orientation === "upright" ? `translate(0,${innerHeight})` : `translate(0,0)`)
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        // Draw bars
        const bars = svg.selectAll(".bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => orientation === "upright" ? xScale(d.x0) : 0)
            .attr("y", d => orientation === "upright" ? yScale(d.length) : xScale(d.x0))
            .attr("width", d => orientation === "upright" ? xScale(d.x1) - xScale(d.x0) : yScale(d.length))
            .attr("height", d => orientation === "upright" ? innerHeight - yScale(d.length) : xScale(d.x1) - xScale(d.x0))
            .on("mouseover", function (event, d) {
                // Show tooltip on hover
                const frequency = d.length;
                d3.select(this).attr("fill", "orange");
                svg.append("text")
                    .attr("class", "tooltip")
                    .attr("x", orientation === "upright" ? xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2 : yScale(frequency) / 2)
                    .attr("y", orientation === "upright" ? yScale(frequency) - 5 : xScale(d) + 15)
                    .style("text-anchor", "middle")
                    .text(`Number of Counties: ${frequency}`);
            })
            .on("mouseout", function () {
                // Hide tooltip on mouse out
                d3.select(this).attr("fill", "steelblue");
                svg.selectAll(".tooltip").remove();
            })
            .transition()
            .duration(500);

        // Add x-axis label
        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text(selectedVariable);

        // Add y-axis label
        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", orientation === "upright" ? `translate(${-margin.left +
                20},${innerHeight / 2}) rotate(-90)` : `translate(${innerWidth / 2},${innerHeight + margin.bottom - 10})`)
            .style("text-anchor", "middle")
            .text(useLogScale ? "Frequency (log scale)" : "Frequency");

        // Add title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", (width / 2) - 75)             
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")  
            .style("font-size", "16px") 
            .style("text-decoration", "underline")  
            .text(useLogScale ? `Total ${selectedVariable} by County` : (selectedVariable === "Unemployment_rate_2020" ? "2020 Unemployment Rates by County" : "2022 Median Household Incomes by County"));
    }

    function updateScatterplot() {
        if (!scatterXVariable || !scatterYVariable) return;


        const xValues = data.map(d => +d[scatterXVariable]).filter(d => !isNaN(d));
        const yValues = data.map(d => +d[scatterYVariable]).filter(d => !isNaN(d));

        const xScale = d3.scaleLinear()
            .domain([d3.min(xValues), d3.max(xValues)])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(yValues), d3.max(yValues)])
            .range([innerHeight, 0]);

        svg.selectAll("*").remove();

        svg.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(+d[scatterXVariable]))
            .attr("cy", d => yScale(+d[scatterYVariable]))
            .attr("r", 5)
            .style("fill", "steelblue")
            .transition()
            .duration(500);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text(scatterXVariable);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", `translate(${-margin.left + 20},${innerHeight / 2}) rotate(-90)`)
            .style("text-anchor", "middle")
            .text(scatterYVariable);
    }

     updateChart();
    //drawHorizontalBarChart();
});