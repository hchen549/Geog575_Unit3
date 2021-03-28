//begin script when window loads
window.onload = setMap();

function setMap() {
  //use Promise.all to parallelize asynchronous data loading
  var width = 960;
  var height = 460;

  //create new svg container for the map

  var map = d3
    .select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

  //create Albers equal area conic projection centered on France

  var promises = [
    d3.csv("data/unitsData.csv"),
    d3.json("data/EuropeCountries.topojson"),
    d3.json("data/FranceRegions.topojson"),
  ];

  var projection = d3
    .geoAlbers()
    .center([0, 46.2])
    .rotate([-2, 0])
    .parallels([43, 62])
    .scale(2500)
    .translate([width / 2, height / 2]);

  var path = d3.geoPath().projection(projection);

  Promise.all(promises).then(callback);

  function callback(data) {
    csvData = data[0];
    europe = data[1];
    france = data[2];
    //translate europe TopoJSON
    var europeCountries = topojson.feature(
        europe,
        europe.objects.EuropeCountries
      ),
      franceRegions = topojson.feature(france, france.objects.FranceRegions)
        .features;

    //add Europe countries to map
    var countries = map
      .append("path")
      .datum(europeCountries)
      .attr("class", "countries")
      .attr("d", path);

    //add France regions to map
    var regions = map
      .selectAll(".regions")
      .data(franceRegions)
      .enter()
      .append("path")
      .attr("class", function (d) {
        return "regions " + d.properties.adm1_code;
      })
      .attr("d", path);
  }
}
