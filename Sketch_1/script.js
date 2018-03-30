//plot
var margin = {
    t: 5,
    r: 25,
    b: 20,
    l: 25
};

var width = d3.select('#plot1').node().clientWidth - margin.r - margin.l,
    height = d3.select('#plot1').node().clientHeight - margin.t - margin.b;

var plot1 = d3.select('#plot1')
    .append('svg')
    .attr('width', width + margin.r + margin.l)
    .attr('height', height + margin.t + margin.b);

// function to draw the map
var path = d3.geoPath();

// prepare map (array) of data values
var populationPerState = d3.map();

// queue data files, parse them and use them
var queue = d3.queue()
    .defer(d3.csv, "data/data.csv", parseData)
    .defer(d3.json, "data/us_map.json")
    .defer(d3.csv, "data/population.csv", parsePopulation)
    .await(dataloaded);

function dataloaded(err, data, map) {
    console.log(data);
    console.log(map);
    console.log(populationPerState);


    // get max and min values of data
    var enrolledExtent = d3.extent(data, function (d) {
        return d.total
    });

    var extentData = d3.extent(data, function (d) {
        return d.total
    });

    var enrolledPerCapitaExtent = d3.extent(data, function (d) {
        var id = +d.id.toString();
        var statePopulation = (populationPerState.get(id)).estimate2017;
        return d.total / statePopulation
    });

    // scale Color for the map
    var scaleColor = d3.scaleLinear()
        .range(["#ffc5c0", "#ab0405"])
        .domain(enrolledPerCapitaExtent);

    // Bind the data to the SVG and create one path per GeoJSON feature
    var node = plot1.selectAll(".state")
        .data(data)
        .enter()
        .append("g")
        .on("mouseover", function (d) {
            //            var thisTooltip = d3.select(this.childNodes[2])
            tooltip.html(d.state + "<br/>" + d.total + "%");
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function () {
            return tooltip
                .attr("x", d3.event.clientX - 220 + "px")
                .attr("y", d3.event.clientY - 70 + "px");
        })
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });


    var circle = node.append("circle")
        .style("r", function (d) {
            var mapID = +d.id;
            var r = 0; //default radius for those without information

            var statePopulation = (populationPerState.get(mapID)).estimate2017;

            data.forEach(function (e) {
                if (mapID === e.id) {
                    r = (e.total) * 3
                }
            });

            return r;
        })

    node.append("text")
        .attr("text-anchor", "middle")
        .text(function (d) {
            console.log(d);
            for (i = 0; i < us_states.length; i++) {
                if (us_states[i].name == d.state.toUpperCase()) {
                    return us_states[i].abbreviation;
                }
            }
        });

    var tooltip = d3.select('svg').append("foreignObject")
        .attr("class", "tooltip")

    tooltip
        .append("div")
        .text("");

    var force = d3.forceSimulation(data)
        .force("charge", d3.forceManyBody().strength(-100))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force('collision', d3.forceCollide().radius(function (d) {
            console.log(d);
            console.log(d.radius);
            return d.radius
        }))
        .on("tick", ticked);

    function ticked(e) {
        node.attr("transform", function (d) {
            return "translate(" + [d.x + (width / 2), d.y + ((height) / 2)] + ")";
        });
    }
}

function parseData(d) {
    var id = d.Id.split("US")[1];
    var total = d["Percent; Estimate; Population 18 to 24 years - Less than high school graduate"]
    console.log(total);
    var radius = total * 3

    return {
        id: +id,
        state: d.Geography,
        total: +total,
        radius: +radius
    }
}

function parsePopulation(d) {
    var id;
    if (d.id !== "") {
        id = +d.id.split("US")[1];
    } else {
        id = d["Geographic Area"];
    }

    populationPerState.set(id, {
        state: d["Geographic Area"],
        april2010: +d["April 1, 2010, Census"],
        estimate2017: +d["Estimate 2017"],
    });
}
