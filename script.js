/* script.js */
const width = 800;
const height = 500;
const margin = { top: 50, right: 50, bottom: 50, left: 50 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let orientation = "upright";

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
        updateScatterplot();
    });

    function updateChart() {
        svg.selectAll("*").remove();

        if (selectedVariable === "state_po") {
            drawBarChart(data);
        } else {
            drawHistogram(data);
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

        const bars = svg.selectAll(".bar")
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
            .attr("y", innerHeight + margin.bottom)
            .style("text-anchor", "middle")
            .text("State ID Code");

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", `rotate(-90)`)
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left)
            .style("text-anchor", "middle")
            .text("Number of Counties");
    }

    function drawHistogram(data) {
        const values = data.map(d => +d[selectedVariable]).filter(d => !isNaN(d));
        const bins = d3.bin()
            .domain([d3.min(values), d3.max(values)])
            .thresholds(10)(values);

        const xScale = d3.scaleLinear()
            .domain([d3.min(values), d3.max(values)])
            .range(orientation === "upright" ? [0, innerWidth] : [0, innerHeight]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range(orientation === "upright" ? [innerHeight, 0] : [innerWidth, 0]);

        const xAxis = orientation === "upright" ? d3.axisBottom(xScale) : d3.axisLeft(xScale);
        const yAxis = orientation === "upright" ? d3.axisLeft(yScale) : d3.axisRight(yScale);

        svg.append("g")
            .attr("transform", orientation === "upright" ? `translate(0,${innerHeight})` : `translate(0,0)`)
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        const bars = svg.selectAll(".bar")
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
            .attr("y", innerHeight + margin.bottom)
            .style("text-anchor", "middle")
            .text(selectedVariable);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", `rotate(-90)`)
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left)
            .style("text-anchor", "middle")
            .text("Frequency");
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