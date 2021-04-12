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
  // translate = "translate(" + leftPadding + "," + 0 + ")";
  translate = "translate(" + leftPadding + "," + topBottomPadding / 2 + ")";

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

    projection = d3.geoAlbersUsa().fitSize([width - 30, height - 30], states);
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
    .range(["white", "blue"])
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
    .attr("transform", "translate(0,15)")

    .style("fill", (d) => {
      // console.log(d["properties"][expressed]);
      return colorScale(d["properties"][expressed]);
    })
    .on("mouseover", function (event, state) {
      highlightStateMap(state.properties.name);
      highlightStateBar(state.properties.name);
      setLabelMap(state);
    })
    .on("mouseout", function (event, state) {
      // state = state.properties.name;
      dehighlightMap(state.properties.name);
      dehighlightBar(state.properties.name);
      d3.select(".infolabel").remove();
    })
    .on("mousemove", moveLabel)
    .append("title")
    .text((state) => `${state.properties.name}`);

  var desc = regions
    .append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');

  var map = d3.select(".map");
  map
    .append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(410,5)");

  var legendLinear = d3
    .legendColor()
    .shapeWidth(30)
    // .cells([1, 2, 3, 6, 8])
    // .orient("horizontal")
    .scale(colorScale);

  map.select(".legendLinear").call(legendLinear);

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
    .style("font-size", "22px")
    .text("Number of " + expressed + " in each state");

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
    .attr("width", chartInnerWidth / attributes.length - 1.3)
    .on("mouseover", (event, d) => {
      console.log(d);
      highlightStateMap(d.states);
      highlightStateBar(d.states);
      setLabelChart(d);
    })
    .on("mouseout", (event, d) => {
      dehighlightMap(d.states);
      dehighlightBar(d.states);
      d3.select(".infolabel").remove();
    })
    .on("mousemove", moveLabel);

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
    .text("Number of " + expressed + " in each state");

  // Update bar itself
  bars
    .attr("x", function (d, i) {
      // return i * (chartInnerWidth / n) + leftPadding;
      return i * (chartInnerWidth / n - 1) + leftPadding;
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
    // .attr("transform", "translate(0,125)")
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

  var legendLinear = d3
    .legendColor()
    .shapeWidth(30)
    // .cells([1, 2, 3, 6, 8])
    // .orient("horizontal")
    .scale(colorScale);

  d3.select(".legendLinear").call(legendLinear);

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
    .style("stroke", "red")
    .style("stroke-width", "2");
}

function highlightStateBar(state) {
  d3.select(".chart")
    .select("#" + state)
    // .select("#" + state.states)
    .style("stroke", "red")
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

function setLabelMap(props) {
  var labelAttribute =
    "<h1>" + props.properties[expressed] + "</h1><b>" + expressed + "</b>";

  var infolabel = d3
    .select("body")
    .append("div")
    .attr("class", "infolabel")
    .attr("id", props.properties.name + "_label");
  // .html(labelAttribute);

  console.log(props);
  console.log(props.properties.name);
  var stateName = infolabel
    .append("div")
    .attr("class", "labelname")
    .html("<b>" + "State: " + props.properties.name + "</b>");

  var attributeName = infolabel
    .append("div")
    .attr("class", "labelname")
    .html("<b>" + "Attr: " + expressed + "</b>");

  var attributeValue = infolabel
    .append("div")
    .attr("class", "labelname")
    .html("<b>" + "Value: " + props.properties[expressed] + "<b>");
}

function setLabelChart(d) {
  var infolabel = d3
    .select("body")
    .append("div")
    .attr("class", "infolabel")
    .attr("id", d.states + "_label");
  // .html(labelAttribute);

  var stateName = infolabel
    .append("div")
    .attr("class", "labelname")
    .html("<b>" + "State: " + d.states + "</b>");

  var attributeName = infolabel
    .append("div")
    .attr("class", "labelname")
    .html("<b>" + "Attr: " + expressed + "</b>");

  var attributeValue = infolabel
    .append("div")
    .attr("class", "labelname")
    .html("<b>" + "Value: " + d[expressed] + "<b>");
}
function moveLabel() {
  //use coordinates of mousemove event to set label coordinates
  var labelWidth = d3.select(".infolabel").node().getBoundingClientRect().width;

  //use coordinates of mousemove event to set label coordinates
  var x1 = event.clientX + 10,
    y1 = event.clientY - 75,
    x2 = event.clientX - labelWidth - 10,
    y2 = event.clientY + 25;

  //horizontal label coordinate, testing for overflow
  var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
  //vertical label coordinate, testing for overflow
  var y = event.clientY < 75 ? y2 : y1;

  d3.select(".infolabel")
    .style("left", x + "px")
    .style("top", y + "px");
}
