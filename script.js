/* script.js */
const width = 800;
const height = 500;
const margin = { top: 50, right: 100, bottom: 70, left: 100 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let orientation = "upright";

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

    variableSelect.on("change", function() {
        selectedVariable = this.value;
        updateChart();
    });

    orientationToggle.on("click", function() {
        orientation = orientation === "upright" ? "sideways" : "upright";
        updateChart();
    });

    axisSelection.on("change", function() {
        // Do not update scatterplot here; wait for variable selection
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

    function drawBarChart(data) {
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
        const yAxis = orientation === "upright" ? d3.axisLeft(yScale) : d3.axisRight(yScale);

        svg.append("g")
            .attr("transform", orientation === "upright" ? `translate(0,${innerHeight})` : `translate(0,0)`)
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        svg.selectAll(".bar")
            .data(states)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => orientation === "upright" ? xScale(d) : 0)
            .attr("y", d => orientation === "upright" ? yScale(stateCounts.get(d)) : xScale(d))
            .attr("width", xScale.bandwidth())
            .attr("height", d => orientation === "upright" ? innerHeight - yScale(stateCounts.get(d)) : yScale(stateCounts.get(d)))
            .transition()
            .duration(500);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text("State ID Code");

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", `rotate(-90)`)
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 20)
            .style("text-anchor", "middle")
            .text("Number of Counties");
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

        svg.append("g")
            .attr("transform", orientation === "upright" ? `translate(0,${innerHeight})` : `translate(0,0)`)
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        svg.selectAll(".bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => orientation === "upright" ? xScale(d.x0) : 0)
            .attr("y", d => orientation === "upright" ? yScale(d.length) : xScale(d.x0))
            .attr("width", d => orientation === "upright" ? xScale(d.x1) - xScale(d.x0) : yScale(d.length))
            .attr("height", d => orientation === "upright" ? innerHeight - yScale(d.length) : xScale(d.x1) - xScale(d.x0))
            .transition()
            .duration(500);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text(selectedVariable);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", `rotate(-90)`)
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 20)
            .style("text-anchor", "middle")
            .text(useLogScale ? "Frequency (log scale)" : "Frequency");
    }

    function updateScatterplot() {
        const xVariable = axisSelection.property("value") === "x" ? selectedVariable : "Civilian_labor_force_2020";
        const yVariable = axisSelection.property("value") === "y" ? selectedVariable : "Unemployment_rate_2020";

        const xValues = data.map(d => +d[xVariable]).filter(d => !isNaN(d));
        const yValues = data.map(d => +d[yVariable]).filter(d => !isNaN(d));

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
            .attr("cx", d => xScale(+d[xVariable]))
            .attr("cy", d => yScale(+d[yVariable]))
            .attr("r", 5)
            .style("fill", "steelblue");

        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom)
            .style("text-anchor", "middle")
            .text(xVariable);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", `rotate(-90)`)
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left)
            .style("text-anchor", "middle")
            .text(yVariable);
    }

    updateChart();
});