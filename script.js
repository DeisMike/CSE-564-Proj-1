/* script.js */
d3.csv("FINAL CSE 564 Proj 1 Dataset.csv").then(function(data) {
    // Convert numerical values
    data.forEach(d => {
        d.Employed_2020 = +d.Employed_2020;
        d.Unemployment_rate_2020 = +d.Unemployment_rate_2020;
        d.Median_Household_Income_2022 = +d.Median_Household_Income_2022;
        d["Bachelor's degree or higher, 2019-23"] = +d["Bachelor's degree or higher, 2019-23"];
    });
    
    // Set dimensions
    const width = 800;
    const height = 500;
    const margin = {top: 50, right: 30, bottom: 50, left: 70};
    
    // Create SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Create dropdown menu
    const variables = Object.keys(data[0]).filter(d => d !== "county_fips" && d !== "state_po");
    d3.select("#variableSelect")
        .selectAll("option")
        .data(variables)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    
    // Create toggle button for orientation
    let isUpright = true;
    d3.select("#toggleOrientation").on("click", function() {
        isUpright = !isUpright;
        updateChart(d3.select("#variableSelect").property("value"));
    });
    
    // Create radio buttons for scatterplot axis selection
    d3.select("#xAxisSelect")
        .selectAll("option")
        .data(variables)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    
    d3.select("#yAxisSelect")
        .selectAll("option")
        .data(variables)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);
    
    function updateChart(selectedVar) {
        svg.selectAll("*").remove();
        
        if (isCategorical(selectedVar)) {
            drawBarChart(selectedVar);
        } else {
            drawHistogram(selectedVar);
        }
    }
    
    function isCategorical(variable) {
        return variable.includes("Votes") || variable.includes("state_po");
    }
    
    function drawBarChart(selectedVar) {
        const counts = d3.rollup(data, v => v.length, d => d[selectedVar]);
        const xScale = d3.scaleBand()
            .domain([...counts.keys()])
            .range(isUpright ? [margin.left, width - margin.right] : [margin.top, height - margin.bottom])
            .padding(0.1);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(counts.values())])
            .range(isUpright ? [height - margin.bottom, margin.top] : [width - margin.right, margin.left]);
        
        svg.selectAll("rect")
            .data(counts)
            .enter().append("rect")
            .transition().duration(500)
            .attr(isUpright ? "x" : "y", d => xScale(d[0]))
            .attr(isUpright ? "y" : "x", d => yScale(d[1]))
            .attr(isUpright ? "width" : "height", xScale.bandwidth())
            .attr(isUpright ? "height" : "width", d => height - margin.bottom - yScale(d[1]))
            .attr("fill", "steelblue");
        
        // Add labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Bar Chart: " + selectedVar);
    }
    
    function drawHistogram(selectedVar) {
        const xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d[selectedVar]))
            .range([margin.left, width - margin.right]);
        
        const histogram = d3.histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(10));
        
        const bins = histogram(data.map(d => d[selectedVar]));
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([height - margin.bottom, margin.top]);
        
        svg.selectAll("rect")
            .data(bins)
            .enter().append("rect")
            .transition().duration(500)
            .attr("x", d => xScale(d.x0))
            .attr("y", d => yScale(d.length))
            .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
            .attr("height", d => height - margin.bottom - yScale(d.length))
            .attr("fill", "steelblue");
        
        // Add labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Histogram: " + selectedVar);
    }
    
    d3.select("#variableSelect").on("change", function() {
        updateChart(this.value);
    });
    
    updateChart("Employed_2020");
});
