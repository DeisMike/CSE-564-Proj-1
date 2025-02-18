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
let scatterXVariable = null;
let scatterYVariable = null;

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

    variableSelect.on("change", function() {
        selectedVariable = this.value;
        if (axisSelection.property("value") === "x") {
            scatterXVariable = selectedVariable;
        } else {
            scatterYVariable = selectedVariable;
        }
        updateChart();
    });

    orientationToggle.on("click", function() {
        orientation = orientation === "upright" ? "sideways" : "upright";
        updateChart();
    });

    axisSelection.on("change", function() {
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
            .on("mouseover", function(event, d) {
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
            .on("mouseout", function() {
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
            .attr("y", innerHeight + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text(selectedVariable);

        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", orientation === "upright" ? `translate(${-margin.left + 
                20},${innerHeight / 2}) rotate(-90)` : `translate(${innerWidth / 2},${innerHeight + margin.bottom - 10})`)
            .style("text-anchor", "middle")
            .text(useLogScale ? "Frequency (log scale)" : "Frequency");
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
});