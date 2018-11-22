var map;
function initmap() {
	// set up the map
	map = new L.Map('mapid');

	// create the tile layer with correct attribution
	var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 12, attribution: osmAttrib});

	// start the map in South-East England
	//map.setView(new L.LatLng(51.3, 0.7),9);
  // start map in buttfuck egypt
  map.setView(new L.LatLng(46.003257147967815399169921875, 8.95168307237327098846435546875),9);
	map.addLayer(osm);
}

initmap();
var marker = L.marker([51.5, -0.09]).addTo(map);
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

function readTextFile(file) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.send(null);
    return rawFile.responseText;
    // rawFile.onreadystatechange = function () {
    //     if(rawFile.readyState === 4) {
    //         if(rawFile.status === 200 || rawFile.status == 0) {
    //             var allText = rawFile.responseText;
    //             return allText;
    //         }
    //     }
    // }
}

//alert(readTextFile('data/running.gpx').substring(20000, 21000));

var xmlFile = readTextFile('data/running.gpx');
//console.log(xmlFile.substring(20000, 21000));

var parser = new DOMParser();

var xmlDoc = parser.parseFromString(xmlFile,"text/xml");
// alert(xmlDoc.getElementsByTagName("trkpt").length);
// alert(xmlDoc.getElementsByTagName("trkpt")[0].getAttribute('lat'));
//document.getElementById('stupid').innerHTML = xmlDoc.getElementsByTagName("gpx")[0].childNodes[0].nodeValue;
var trackPoints  = xmlDoc.getElementsByTagName("trkpt");
for (var i = 0; i < trackPoints.length; i++) {
  var lat = Number(trackPoints[i].getAttribute('lat'));
  var lon = Number(trackPoints[i].getAttribute('lon'));

  L.marker([lat, lon]).addTo(map);
}
