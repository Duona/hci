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
var elevations = new Array();
var times = new Array();

for (var i = 0; i < trackPoints[0].length; i++) {
	averageHeartRate += Number(trackPoints[0][i].getElementsByTagName('extensions')[0].getElementsByTagName('ns3:TrackPointExtension')[0].getElementsByTagName('ns3:hr')[0].innerHTML);
	averageCad += Number(trackPoints[0][i].getElementsByTagName('extensions')[0].getElementsByTagName('ns3:TrackPointExtension')[0].getElementsByTagName('ns3:cad')[0].innerHTML);
	elevations.push(Number(trackPoints[0][i].getElementsByTagName('ele')[0].innerHTML));
	times.push(Date(trackPoints[0][i].getElementsByTagName('time')[0].innerHTML));
}

averageHeartRate = averageHeartRate / trackPoints[0].length;
averageCad = averageCad / trackPoints[0].length;

var startTime = new Date(trackPoints[0][0].getElementsByTagName('time')[0].innerHTML);
var endTime = new Date(trackPoints[0][trackPoints[0].length-1].getElementsByTagName('time')[0].innerHTML);
var totalMinutes = (endTime - startTime) / 60000;
var totalTime = endTime - startTime;


var prevLat = Number(trackPoints[0][0].getAttribute('lat'));
var prevLon = Number(trackPoints[0][0].getAttribute('lon'));
var distance = 0;

L.marker([prevLat, prevLon], {title : 'Start'}).addTo(map);
L.marker([Number(trackPoints[0][trackPoints[0].length-1].getAttribute('lat')), Number(trackPoints[0][trackPoints[0].length-1].getAttribute('lon'))], {title : 'End'}).addTo(map);

// source: https://www.geodatasource.com/developers/javascript
function geoDistance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

for (var i = 1; i < trackPoints[0].length; i++) {

  var lat = Number(trackPoints[0][i].getAttribute('lat'));
  var lon = Number(trackPoints[0][i].getAttribute('lon'));

	distance += geoDistance(prevLat, prevLon, lat, lon, 'K');

	L.polyline([[prevLat, prevLon], [lat, lon]], {color : 'red'}).addTo(map);

	prevLat=lat;
	prevLon=lon;

}

var metadata = document.getElementById('metadata');
document.getElementById('trackName').innerHTML = 'Track name: ' +  trackName;
document.getElementById('totalTime').innerHTML = 'Total time: ' + Math.floor(totalTime / 1000 / 60 / 60) + 'h ' +  Math.floor(totalTime / 1000 / 60)  + 'min ' + Math.floor(totalTime / 1000 / 60 / 60) + 's';
document.getElementById('totalDistance').innerHTML = 'Total distance: ' +  parseFloat(distance).toFixed(2) + ' km';
document.getElementById('averageSpeed').innerHTML = 'Average speed: ' + parseFloat(distance/(totalMinutes/60)).toFixed(2) + ' km/h';
document.getElementById('averageHR').innerHTML = 'Average heart rate: ' + parseFloat(averageHeartRate).toFixed(2) + 'bpm';
document.getElementById('cadence').innerHTML = 'Average cadence: ' +  parseFloat(averageCad).toFixed(2) + ' ACU';



// proof that js was created by sdts for sdts: https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp
var valArray = [...Array(elevations.length).keys()];

var ctx = document.getElementById('myChart').getContext('2d');
var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: valArray,
        datasets: [{
            label: "Elevation graph",
            backgroundColor: 'rgb(167, 232, 29)',
            borderColor: 'rgb(255, 99, 132)',
            data: elevations,
        }]
    },

    // Configuration options go here
    options: {}
});
