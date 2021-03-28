window.onload = setMap();

function setMap() {
  let tooltip = d3.select("#tooltip");
  var width = 960;
  var height = 660;

  //create new svg container for the map

  var map = d3
    .select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

  var promises = [
    // d3.csv("data/unitsData.csv"),
    d3.json("data/EuropeCountries.topojson"),
    (us = d3.json("https://unpkg.com/us-atlas@3/counties-10m.json")),
  ];

  Promise.all(promises).then(callback);

  function callback(data) {
    europe = data[0];
    usmap = data[1];
    console.log(europe);
    console.log(usmap);

    var europeCountries = topojson.feature(
      europe,
      europe.objects.EuropeCountries
    );
    var states = topojson.feature(usmap, usmap.objects.states);
    console.log(states);

    california = states.features.filter(
      (f) => f.properties.name === "California"
    );
    // projection = d3.geoAlbersUsa().fitSize([960, 660], california[0]); // magically fits map geography to width/height!
    projection = d3.geoAlbersUsa();
    path = d3.geoPath(projection);
    // console.log("State features");
    // console.log(states.features);
    // console.log(states.features[0]["id"]);

    var regions = map
      .selectAll("path")
      .data(states.features)
      .enter()
      .append("path")
      .attr("class", "usstate")
      .attr("id", function (state) {
        console.log(state.id);
        // return state.id;
        return state.properties.name;
      })
      .attr("d", (state) => path(state))
      //   .attr()
      .attr("fill", "white")
      .on("mouseover", function (state) {
        tooltip.transition().style("visibility", "visible");
        console.log(map.select(".Wisconsin"));
        // tooltip.text("abchdkkl: " + id);
        // tooltip.attr("", st);
      })
      .on("mouseout", (countyDataItem) => {
        tooltip.transition().style("visibility", "hidden");
      });
  }
}
