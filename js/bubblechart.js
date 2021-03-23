window.onload = function () {
  var w = 900;
  var h = 900;
  var container = d3
    .select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("class", "container")
    .style("background-color", "rgba(0,0,0,0.2)");

  var innerRect = container

    .append("rect")
    .datum(400)
    .attr("width", function (d) {
      return d * 2;
    })
    .attr("height", function (d) {
      return d;
    })
    .attr("class", "innerRect")
    .attr("x", 50)
    .attr("y", 50)
    .style("fill", "#FFFFFF");

  //   var dataArray = [10, 20, 30, 40, 50];
  //   var circles = container
  //     .selectAll(".circles")
  //     .data(dataArray)
  //     .enter()
  //     .append("circle")
  //     .attr("class", "circles")
  //     .attr("r", function (d, i) {
  //       console.log("d:", d, "i:", i);
  //       return d;
  //     })
  //     .attr("cx", function (d, i) {
  //       return 70 + i * 180;
  //     })
  //     .attr("cy", function (d) {
  //       return 450 - d * 5;
  //     });

  var cityPop = [
    {
      city: "Madison",
      population: 233209,
    },
    {
      city: "Milwaukee",
      population: 594833,
    },
    {
      city: "Green Bay",
      population: 104057,
    },
    {
      city: "Superior",
      population: 27244,
    },
  ];

  var x = d3.scaleLinear().range([90, 750]).domain([0, 3]);
  var minPop = d3.min(cityPop, function (d) {
    return d.population;
  });

  var maxPop = d3.max(cityPop, function (d) {
    return d.population;
  });

  var y = d3
    .scaleLinear()
    .range([450, 50]) //was 440, 95
    .domain([0, 700000]); //was minPop, maxPop

  var color = d3
    .scaleLinear()
    .range(["#FDBE85", "#D94701"])
    .domain([minPop, maxPop]);

  var yAxis = d3.axisLeft(y);

  var circles = container
    .selectAll(".circles")
    .data(cityPop)
    .enter()
    .append("circle")
    .attr("class", "circles")
    .attr("id", function (d) {
      return d.city;
    })
    .attr("r", function (d) {
      var area = d.population * 0.01;
      return Math.sqrt(area / Math.PI);
    })
    .attr("cx", function (d, i) {
      return x(i);
    })
    .attr("cy", function (d) {
      return y(d.population);
    })
    .style("fill", function (d, i) {
      return color(d.population);
    })
    .style("stroke", "#000");

  var axis = container
    .append("g")
    .attr("class", "axis")
    .attr("transform", "translate(50, 0)")
    .call(yAxis);

  var title = container
    .append("text")
    .attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", 450)
    .attr("y", 30)
    .text("City Populations");

  var labels = container
    .selectAll(".labels")
    .data(cityPop)
    .enter()
    .append("text")
    .attr("class", "labels")
    .attr("text-anchor", "left")
    .attr("y", function (d) {
      //vertical position centered on each circle
      return y(d.population);
    });

  //first line of label
  var nameLine = labels
    .append("tspan")
    .attr("class", "nameLine")
    .attr("x", function (d, i) {
      //horizontal position to the right of each circle
      return x(i) + Math.sqrt((d.population * 0.01) / Math.PI) + 5;
    })
    .text(function (d) {
      return d.city;
    });

  var format = d3.format(",");
  //second line of label
  var popLine = labels
    .append("tspan")
    .attr("class", "popLine")
    .attr("x", function (d, i) {
      //horizontal position to the right of each circle
      return x(i) + Math.sqrt((d.population * 0.01) / Math.PI) + 5;
    })
    .attr("dy", "15")
    .text(function (d) {
      return "Pop. " + format(d.population);
    });

  console.log(container);
};
