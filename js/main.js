var map;
function initmap() {
	// set up the map
	map = new L.Map('mapid');

	// create the tile layer with correct attribution
	var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 18, attribution: osmAttrib});

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
    rawFile.open('GET', file, false);
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

// create gpx parser
var xmlFile = readTextFile('data/running.gpx');
// var xmlFile = readTextFile('data/cycling.gpx');
var parser = new DOMParser();
var xmlDoc = parser.parseFromString(xmlFile,'text/xml');

try {
	console.log(xmlDoc.getElementsByTagName('gpx')[0]);
}
catch(err) {
	console.log(err);
}

var trackName = xmlDoc.getElementsByTagName('trk')[0].getElementsByTagName('name')[0].innerHTML;
console.log(trackName);

var trackSegs = xmlDoc.getElementsByTagName('trkseg');

// 2d array. First indice is track seg, second is track point
var trackPoints = new Array();

for (var i = 0; i < trackSegs.length; i++) {
	trackPoints.push(trackSegs[i].getElementsByTagName('trkpt'));
}

// get heartrade of given trkpt (only works with running because different extensions have different tags)
console.log(trackPoints[0][0].getElementsByTagName('extensions')[0].getElementsByTagName('ns3:TrackPointExtension')[0].getElementsByTagName('ns3:hr')[0].innerHTML);

// function trackPointInfo (trkpt) {
// 	trkpt.getAttribute('lat')
// }

var averageHeartRate = 0;
var averageCad = 0;

for (var i = 0; i < trackPoints[0].length; i++) {
	averageHeartRate += Number(trackPoints[0][i].getElementsByTagName('extensions')[0].getElementsByTagName('ns3:TrackPointExtension')[0].getElementsByTagName('ns3:hr')[0].innerHTML);
	averageCad += Number(trackPoints[0][i].getElementsByTagName('extensions')[0].getElementsByTagName('ns3:TrackPointExtension')[0].getElementsByTagName('ns3:cad')[0].innerHTML);
}

averageHeartRate = averageHeartRate / trackPoints[0].length;
averageCad = averageCad / trackPoints[0].length;

var startTime = new Date(trackPoints[0][0].getElementsByTagName('time')[0].innerHTML);
var endTime = new Date(trackPoints[0][trackPoints[0].length-1].getElementsByTagName('time')[0].innerHTML);
var totalMinutes = (endTime - startTime) / 60000

var prevLat = Number(trackPoints[0][0].getAttribute('lat'));
var prevLon = Number(trackPoints[0][0].getAttribute('lon'));

L.marker([prevLat, prevLon], {title : 'Start'}).addTo(map);
L.marker([Number(trackPoints[0][trackPoints[0].length-1].getAttribute('lat')), Number(trackPoints[0][trackPoints[0].length-1].getAttribute('lon'))], {title : 'End'}).addTo(map);

for (var i = 1; i < trackPoints[0].length; i++) {

  var lat = Number(trackPoints[0][i].getAttribute('lat'));
  var lon = Number(trackPoints[0][i].getAttribute('lon'));

	L.polyline([[prevLat, prevLon], [lat, lon]], {color : 'red'}).addTo(map);

	prevLat=lat;
	prevLon=lon;

}

var metadata = document.getElementById('metadata');

metadata.innerHTML = 'Track Name: ' + trackName + ', Total time: ' + totalMinutes + ' minutes, ' + 'Average heart rate: ' + averageHeartRate + ' bpm, ' + 'Average cadence: ' + averageCad + ' absolute cadence units';
