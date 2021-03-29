//begin script when window loads
window.onload = setMap();
var attrArray = ["varA", "varB", "varC", "varD", "varE"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

function setMap() {
  //use Promise.all to parallelize asynchronous data loading
  var width = window.innerWidth * 0.5;
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

    console.log(franceRegions);
    console.log(csvData);

    franceRegions = joinData(franceRegions, csvData);

    console.log(franceRegions);
    //add Europe countries to map
    var countries = map
      .append("path")
      .datum(europeCountries)
      .attr("class", "countries")
      .attr("d", path);

    //add France regions to map
    var colorScale = makeColorScale(csvData);

    //Example 1.3 line 24...add enumeration units to the map

    setEnumerationUnits(franceRegions, map, path, colorScale);

    setChart(csvData, colorScale);
  }
}

function joinData(franceRegions, csvData) {
  for (var i = 0; i < csvData.length; i++) {
    var joinKey = csvData[i].adm1_code;

    for (var j = 0; j < franceRegions.length; j++) {
      if (franceRegions[j].properties.adm1_code == joinKey) {
        // console.log("a");
        var geojsonProps = franceRegions[j].properties; //the current region geojson properties
        var geojsonKey = geojsonProps.adm1_code; //the geojson primary key

        attrArray.forEach((attr) => {
          geojsonProps[attr] = parseFloat(csvData[i][attr]);
        });
      }
    }
  }
  return franceRegions;
}

function makeColorScale(data) {
  var colorClasses = ["#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77", "#980043"];

  //create color scale generator
  var colorScale = d3.scaleQuantile().range(colorClasses);

  //build two-value array of minimum and maximum expressed attribute values
  var minmax = [
    d3.min(data, (d) => {
      return parseFloat(d[expressed]);
    }),
    d3.max(data, (d) => {
      return parseFloat(d[expressed]);
    }),
  ];
  //assign two-value array as scale domain
  colorScale.domain(minmax);
  console.log(colorScale.quantiles());
  return colorScale;
}

function setEnumerationUnits(franceRegions, map, path, colorScale) {
  //...REGIONS BLOCK FROM MODULE 8
  var regions = map
    .selectAll(".regions")
    .data(franceRegions)
    .enter()
    .append("path")
    .attr("class", function (d) {
      return "regions " + d.properties.adm1_code;
    })
    .attr("d", path)
    .style("fill", (d) => {
      var value = d["properties"][expressed];
      if (value) {
        return colorScale(d["properties"][expressed]);
      } else {
        return "#ccc";
      }
      // console.log(colorScale(d["properties"][expressed]));
    });
  return regions;
}

function setChart(csvData, colorScale) {
  var chartWidth = window.innerWidth * 0.425;
  var chartHeight = 460;

  var chart = d3
    .select("body")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");

  var yScale = d3.scaleLinear().range([0, chartHeight]).domain([0, 105]);

  var bars = chart
    .selectAll(".bars")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function (a, b) {
      return a[expressed] - b[expressed];
    })
    .attr("class", (d) => {
      return "bars" + d.adm1_code;
    })
    .attr("width", chartWidth / csvData.length - 1)
    .attr("x", (d, i) => {
      return i * (chartWidth / csvData.length);
    })
    .attr("height", (d) => yScale(parseFloat(d[expressed])))
    .attr("y", (d) => {
      return chartHeight - yScale(parseFloat(d[expressed]));
    })
    .style("fill", function (d) {
      return colorScale(d[expressed]);
    });

  addTitle(chart);

  var numbers = chart
    .selectAll(".numbers")
    .data(csvData)
    .enter()
    .append("text")
    .sort((a, b) => {
      return a[expressed] - b[expressed];
    })
    .attr("class", (d) => {
      return "numbers " + d.adm1_code;
    })
    .attr("text-anchor", "middle")
    .attr("x", (d, i) => {
      var fraction = chartWidth / csvData.length;
      return i * fraction + (fraction - 1) / 2;
    })
    .attr("y", (d) => {
      return chartHeight - yScale(parseFloat(d[expressed])) + 15;
    })
    .text((d) => {
      return d[expressed];
    });
}

function addTitle(chart) {
  var chartTitle = chart
    .append("text")
    .attr("x", 20)
    .attr("y", 40)
    .attr("class", "chartTitle")
    .text("Number of Variable " + expressed + " in each region")
    .style("font-weight", "bold");
}
