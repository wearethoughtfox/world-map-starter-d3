(function () {
// Calls the resize function
d3.select(window).on("resize", throttle);

var windowWidth = window.innerWidth;

// Set the height and width
var padding = 5;
var scaleSetting = 1.6;
var scaleSetting2 = 0.602;
var width = document.getElementById('map').offsetWidth-padding;
var height = width * scaleSetting2;
var activeCountries, topo, borders, coastline, projection, path, svg, g;
var tooltip = d3.select("#map").append("div").attr("class", "tooltip hidden");

setup(width,height);

var mapZoom = d3.zoom().on("zoom", freeZoom);

function freeZoom() {
    map.attr("transform", d3.event.transform);
}

d3.select("#reset").on("click", function() {
    svg.transition().duration(500).call(mapZoom.transform, d3.zoomIdentity);
});

d3.select("#zoom_in").on("click", function() {
    mapZoom.scaleBy(svg.transition().duration(500), 1.1);
});

d3.select("#zoom_out").on("click", function() {
    mapZoom.scaleBy(svg.transition().duration(500), 0.9);
});

//initial setup
function setup(width,height){

  //Try d3.geoWinkel3() / d3.geoMercator() / d3.geoNaturalEarth1() / d3.geoTimes()
  projection =  d3.geoWinkel3()
    .translate([(width/2), (height/scaleSetting)])
    .scale(width / scaleSetting / Math.PI)
    .rotate([-11,0]);

  path = d3.geoPath().projection(projection);

  svg = d3.select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g");

  g = svg.append("g");
}

var promises = [];

promises.push(d3.json("/data/world-topo.json"));
promises.push(d3.csv("/data/active.csv"));

Promise.all(promises)
.then(ready)
.catch(function(err) {
    throw err;
});

function ready(data) {
  var world = data[0];
  var countries = topojson.feature(world, world.objects.world).features;
  topo = countries;
  activeCountries = data[1];

  coastline = topojson.mesh(world, world.objects.world, function(a, b) { return a === b });

  topo.forEach(function(d, i) {
      activeCountries.forEach(function(e, j) {
          if (d.id === e.id) {
              e.geometry = d.geometry;
              e.type = d.type;
          }
      });
  });

  draw(topo, activeCountries, coastline);
}

function draw(topo, activeCountries, coastline) {

  var activeCountry = g.selectAll(".activeCountry").data(activeCountries);

   g.selectAll(".country")
        .data(topo)
        .enter().append("path")
        .attr("class", "country")
        .attr("id", function(d) { return d.id; })
        .attr("d", path);

   g.insert("path", ".graticule")
      .datum(coastline)
      .attr("class","coastline")
      .attr("d", path);

   activeCountry.enter().append("path")
      .attr("class", "member")
      .attr("id", function(d) { return d.id; })
      .attr("d", path);

   //ofsets plus width/height of transform, plus 20 px of padding, plus 20 extra for tooltip offset off mouse
  var offsetL = document.getElementById('map').offsetLeft+(width/60);
  var offsetT =document.getElementById('map').offsetTop+(height/60);

  if (windowWidth > 752) {
    console.log (activeCountry);
    activeCountry
      .on("mousemove", function(d,i) {

          var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
              .classed("hidden", false)
              .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
              .html('<a href="'+ d.url + '">' + d.name + '</a>');
          })
          .on("mouseout",  function(d,i) {
            tooltip.classed("hidden", true);
          });

    //when you click on a country go to the member page
    activeCountry.on('click', function(d){ window.location = d.url;});

    activeCountry
      .on("mouseover", function() {
        d3.select(this)
          .classed("active", true);
        })
      .on("mouseout",  function() {
        d3.select(this)
          .classed("active", false);
        });
     }

}

function redraw() {
  windowWidth = window.innerWidth;
  width = document.getElementById('map').offsetWidth-padding;
  height = width / scaleSetting;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo, activeCountries, coastline);
}

var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      redraw();
    }, 200);
}

})();
