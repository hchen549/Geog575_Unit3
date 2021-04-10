window.onload = setMap();

var measures = [
  "vaccinated",
  "income",
  "unemployment",
  "gdp",
  "demo_perc",
  "republican_perc",
];
var expressed = "vaccinated";

var chartWidth = window.innerWidth * 0.55,
  chartHeight = 460,
  leftPadding = 40,
  rightPadding = 2,
  topBottomPadding = 5,
  chartInnerWidth = chartWidth - leftPadding - rightPadding,
  chartInnerHeight = chartHeight - topBottomPadding * 2,
  translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

// var yScale = d3
//   .scaleLinear()
//   .range([chartHeight, 0])
//   .domain([
//     0,
//     d3.max(attributes, (d) => {
//       return parseFloat(d[expressed]);
//     }),
//   ]);

function setMap() {
  let tooltip = d3.select("#tooltip");
  var width = window.innerWidth * 0.4;
  var height = 460;

  //create new svg container for the map

  var map = d3
    .select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

  // var g = map.append("g");

  var promises = [
    d3.csv("data/data_attributes.csv"),
    // d3.json("data/EuropeCountries.topojson"),
    (us = d3.json("https://unpkg.com/us-atlas@3/counties-10m.json")),
  ];

  Promise.all(promises).then(callback);

  function callback(data) {
    attributes = data[0];
    usmap = data[1];
    // console.log(attributes);

    var states = topojson.feature(usmap, usmap.objects.states);
    // console.log(states);

    joinData(states, attributes);

    // console.log(states);

    projection = d3.geoAlbersUsa().fitSize([width, height], states);
    path = d3.geoPath(projection);

    var colorScale = makeColorScale(attributes);

    var regions = setEnumerationUnits(states, map, path, colorScale);

    setChart(attributes, colorScale);
  }
}

function joinData(states, attributes) {
  for (var i = 0; i < states.features.length; i++) {
    var stateName = states.features[i]["properties"]["name"];
    //   console.log(stateName);

    for (var j = 0; j < attributes.length; j++) {
      if (attributes[j]["states"] == stateName) {
        measures.forEach((measure) => {
          states.features[i]["properties"][measure] = parseFloat(
            attributes[j][measure]
          );
        });

        // console.log(stateName + attributes[j]["income"]);
      }
    }
  }
}

function makeColorScale(data) {
  var min = d3.min(data, (d) => {
    return parseFloat(d[expressed]);
  });

  var max = d3.max(data, (d) => {
    return parseFloat(d[expressed]);
  });

  // console.log(min, max);

  var colorScale = d3
    .scaleLinear()
    .range(["yellow", "red"])
    .domain([min, max])
    .unknown("#ccc");

  return colorScale;
}

function setEnumerationUnits(states, map, path, colorScale) {
  var regions = map
    .selectAll(".path")
    .data(states.features)
    .enter()
    .append("path")
    .attr("class", "usstate")
    .attr("id", function (state) {
      // console.log(state.id);
      return state.properties.name;
    })
    .attr("d", (state) => path(state))
    //   .attr()
    .attr("fill", "white")
    .style("fill", (d) => {
      // console.log(d["properties"][expressed]);
      return colorScale(d["properties"][expressed]);
    })
    .on("mouseover", function (event, state) {
      highlightStateMap(state.properties.name);
      highlightStateBar(state.properties.name);
      setLabel(state);
    })
    .on("mouseout", function (event, state) {
      // state = state.properties.name;
      dehighlightMap(state.properties.name);
      dehighlightBar(state.properties.name);
      d3.select(".infolabel").remove();
    })
    .append("title")
    .text((state) => `${state.properties.name}`);

  var desc = regions
    .append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');

  return regions;
}

function setChart(attributes, colorScale) {
  var yScale = d3
    .scaleLinear()
    .range([chartHeight, 0])
    .domain([
      0,
      d3.max(attributes, (d) => {
        return parseFloat(d[expressed]);
      }),
    ]);

  var chart = d3
    .select("body")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");

  var chartTitle = chart
    .append("text")
    .attr("x", 400)
    .attr("y", 40)
    .attr("class", "chartTitle")
    .text("Number of Variable " + expressed + " in each state");

  var bars = chart
    .selectAll(".bars")
    .data(attributes)
    .enter()
    .append("rect")
    .sort(function (a, b) {
      return b[expressed] - a[expressed];
    })
    .attr("class", (d) => {
      return "bars";
    })
    .attr("id", (d) => {
      return d.states;
    })
    .attr("width", chartWidth / attributes.length - 1)
    .on("mouseover", (event, d) => {
      // console.log(d);
      highlightStateMap(d.states);
      highlightStateBar(d.states);
    })
    .on("mouseout", (event, d) => {
      dehighlightMap(d.states);
      dehighlightBar(d.states);
    });

  var desc = bars
    .append("desc")
    .text('{"stroke": "none", "stroke-width": "0px"}');

  updateChart(bars, attributes.length, colorScale);

  //create vertical axis generator
  var yAxis = d3.axisLeft().scale(yScale);

  //place axis
  var axis = chart
    .append("g")
    .attr("class", "axis")
    .attr("transform", translate)
    .call(yAxis);

  createDropdown(attributes);
}

function updateChart(bars, n, colorScale) {
  // Update yScale depending on selected variable
  var yScale = d3
    .scaleLinear()
    .range([chartHeight, 0])
    .domain([
      0,
      d3.max(attributes, (d) => {
        return parseFloat(d[expressed]);
      }),
    ]);

  // Update chart title
  d3.select(".chart")
    .select("text")
    .text("Number of Variable " + expressed + " in each state");

  // Update bar itself
  bars
    .attr("x", function (d, i) {
      return i * (chartInnerWidth / n) + leftPadding;
    })
    //size/resize bars
    .attr("height", function (d, i) {
      return 463 - yScale(parseFloat(d[expressed]));
    })
    .attr("y", function (d, i) {
      return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    //color/recolor bars
    .style("fill", function (d) {
      var value = d[expressed];
      if (value) {
        return colorScale(value);
      } else {
        return "#ccc";
      }
    });

  var yAxis = d3.axisLeft().scale(yScale);

  d3.select(".axis").call(yAxis);

  // //place axis
  // var axis = chart
  //   .append("g")
  //   .attr("class", "axis")
  //   .attr("transform", translate)
  //   .call(yAxis);
}

function createDropdown(attributes) {
  var dropdown = d3
    .select("body")
    .append("select")
    .attr("class", "dropdown")
    .on("change", function () {
      return changeAttributes(this.value, attributes);
    });

  var titleOption = dropdown
    .append("option")
    .attr("class", "titleOption")
    .attr("disabled", "true")
    .text("Select Attribute");

  var attrOptions = dropdown
    .selectAll("attrOptions")
    .data(measures)
    .enter()
    .append("option")
    .attr("value", (d) => {
      return d;
    })
    .text((d) => {
      return d;
    });
}

function changeAttributes(option, attributes) {
  expressed = option;

  var colorScale = makeColorScale(attributes);

  // console.log(expressed);

  var yScale = d3
    .scaleLinear()
    .range([chartHeight, 0])
    .domain([
      0,
      d3.max(attributes, (d) => {
        return parseFloat(d[expressed]);
      }),
    ]);

  var regions = d3
    .selectAll(".usstate")
    .transition()
    .duration(1000)
    .style("fill", function (d) {
      // console.log(expressed);
      var value = d.properties[expressed];
      if (value) {
        // console.log(value);
        return colorScale(value);
      } else {
        return "#ccc";
      }
    });

  // console.log("change bars");

  var bars = d3
    .selectAll(".bars")
    //re-sort bars
    .sort(function (a, b) {
      return b[expressed] - a[expressed];
    })
    .transition()
    .delay((d, i) => {
      return i * 20;
    })
    .duration(500);

  updateChart(bars, attributes.length, colorScale);
}

function highlightStateMap(state) {
  d3.select(".map")
    .select("#" + state)
    // .select("#" + state.properties.name)
    .style("stroke", "blue")
    .style("stroke-width", "2");
}

function highlightStateBar(state) {
  d3.select(".chart")
    .select("#" + state)
    // .select("#" + state.states)
    .style("stroke", "blue")
    .style("stroke-width", "2");
}

function dehighlightMap(state) {
  // {"stroke": "#000", "stroke-width": "0.5px"}
  d3.select(".map")
    // .select("#" + state.properties.name)
    .select("#" + state)
    .style("stroke", "#ccc")
    .style("stroke-width", "2px");
}

function dehighlightBar(state) {
  d3.select(".chart")
    // .select("#" + state.states)
    .select("#" + state)
    .style("stroke", "none")
    .style("stroke-width", "0px");
}

function setLabel(props) {
  var labelAttribute =
    "<h1>" + props.properties[expressed] + "</h1><b>" + expressed + "</b>";

  var infolabel = d3
    .select("body")
    .append("div")
    .attr("class", "infolabel")
    .attr("id", props.properties.name + "_label")
    .html(labelAttribute);

  console.log(props);
  console.log(props.properties.name);
  var stateNAme = infolabel
    .append("div")
    .attr("class", "labelname")
    .html(props.properties.name);
}
