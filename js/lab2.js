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
    // var map = d3
    //   .select("body")
    //   .append("svg")
    //   .attr("class", "map")
    //   .attr("width", width)
    //   .attr("height", height);
    // var g = map.append("g");
    attributes = data[0];
    usmap = data[1];
    console.log(attributes);
    // console.log(usmap);

    var states = topojson.feature(usmap, usmap.objects.states);
    // console.log(states);

    joinData(states, attributes);

    console.log(states);
    // california = states.features.filter(
    //   (f) => f.properties.name === "California"
    // );
    // projection = d3.geoAlbersUsa().fitSize([960, 660], california[0]); // magically fits map geography to width/height!
    projection = d3.geoAlbersUsa().fitSize([width, height], states);
    path = d3.geoPath(projection);
    // console.log("State features");
    // console.log(states.features);
    // console.log(states.features[0]["id"]);

    var colorScale = makeColorScale(attributes);

    // var regions = setEnumerationUnits(states, g, path, colorScale);
    var regions = map
      .selectAll("path")
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
        console.log(d["properties"][expressed]);
        return colorScale(d["properties"][expressed]);
      })
      .append("title")
      .text((state) => `${state.properties.name}`);

    // map
    //   .append("g")
    //   .attr("transform", "translate(610,20)")
    //   .append(() =>
    //     legend({ colorScale, title: "D3 lab", width: 260, tickFormat: ".1f" })
    //   );

    setChart(attributes, colorScale);

    // console.log("region: " + regions);
    // var legends = regions
    //   .selectAll("title")
    //   .data(states.features)
    //   .enter()
    //   .append("title")
    //   .text((state) => `${state.properties.name}`);
    //   .on("mouseover", function (state) {
    //     tooltip.transition().style("visibility", "visible");
    //     console.log(map.select(".Wisconsin"));
    //     // tooltip.text("abchdkkl: " + id);
    //     // tooltip.attr("", st);
    //   })
    //   .on("mouseout", (countyDataItem) => {
    //     tooltip.transition().style("visibility", "hidden");
    //   });

    // var zoom = d3
    //   .zoom()
    //   .scaleExtent([1, 8])
    //   .on("zoom", function () {
    //     d3.select("g").attr(
    //       "transform",
    //       "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
    //     );
    //   });

    // map.call(zoom);
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
  var colorScale = d3
    .scaleLinear()
    .range(["yellow", "red"])
    .domain([
      d3.min(data, (d) => {
        return parseFloat(d[expressed]);
      }),
      d3.max(data, (d) => {
        return parseFloat(d[expressed]);
      }),
    ])
    .unknown("#ccc");

  return colorScale;
}

function setEnumerationUnits(states, map, path, colorScale) {
  var regions = g
    .selectAll("path")
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
      console.log(d["properties"][expressed]);
      return colorScale(d["properties"][expressed]);
    })
    .append("title")
    .text((state) => `${state.properties.name}`);

  // console.log("region: " + regions);
  // var legends = regions
  //   .selectAll("title")
  //   .data(states.features)
  //   .enter()
  //   .append("title")
  //   .text((state) => `${state.properties.name}`);
  //   .on("mouseover", function (state) {
  //     tooltip.transition().style("visibility", "visible");
  //     console.log(map.select(".Wisconsin"));
  //     // tooltip.text("abchdkkl: " + id);
  //     // tooltip.attr("", st);
  //   })
  //   .on("mouseout", (countyDataItem) => {
  //     tooltip.transition().style("visibility", "hidden");
  //   });
  return regions;
}

function setChart(attributes, colorScale) {
  var chartWidth = window.innerWidth * 0.55,
    chartHeight = 460,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

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
      return "bars_" + d["states"];
    })
    .attr("width", chartWidth / attributes.length - 1)
    .attr("x", function (d, i) {
      return i * (chartWidth / attributes.length) + leftPadding;
    })
    .attr("height", (d) => {
      return chartHeight - yScale(parseFloat(d[expressed]));
    })
    .attr("y", (d) => {
      return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    .style("fill", function (d) {
      return colorScale(d[expressed]);
    });

  // var numbers = chart
  //   .selectAll(".numbers")
  //   .data(attributes)
  //   .enter()
  //   .append("text")
  //   .sort((a, b) => {
  //     return b[expressed] - a[expressed];
  //   })
  //   .attr("class", (d) => {
  //     return "numbers_" + d["states"];
  //   })
  //   .attr("text-anchor", "middle")
  //   .attr("x", (d, i) => {
  //     var fraction = chartWidth / attributes.length;
  //     return i * (chartWidth / attributes.length) + (fraction - 1) / 2;
  //   })
  //   .attr("y", (d) => {
  //     return chartHeight - yScale(parseFloat(d[expressed])) + 15;
  //   })
  //   .text((d) => {
  //     return d[expressed];
  //   });

  //create vertical axis generator
  var yAxis = d3.axisLeft().scale(yScale);

  //place axis
  var axis = chart
    .append("g")
    .attr("class", "axis")
    .attr("transform", translate)
    .call(yAxis);
}
