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
// var xmlFile = readTextFile('data/running.gpx');
var xmlFile = readTextFile('data/cycling.gpx');
var parser = new DOMParser();
var xmlDoc = parser.parseFromString(xmlFile,'text/xml');

try {
	console.log(xmlDoc.getElementsByTagName('gpx')[0]);
}
catch(err) {
	console.log(err);
}

var trackName = xmlDoc.getElementsByTagName('trk')[0].getElementsByTagName('name')[0].innerHTML;

var trackSeg = 0;
var trackSegs = xmlDoc.getElementsByTagName('trkseg');

// 2d array. First indice is track seg, second is track point
var trackPoints = new Array();

for (var i = 0; i < trackSegs.length; i++) {
	trackPoints.push(trackSegs[i].getElementsByTagName('trkpt'));
}

var extensionNames = new Array();
var extensionValues = new Array();
var extensionDic = {'hr' : 'heartrate', 'cad' : 'cadence', 'atemp' : 'Atempt I guess'};
var extensionUnitDic = {'hr' : 'bpm', 'cad' : 'ACU', 'atemp' : 'how hard you tried'};

for (trackSeg; trackSeg < trackSegs.length; trackSeg++) {

	// var averageHeartRate = 0;
	// var averageCad = 0;

	var elevations = new Array();
	var times = new Array();

	var averages = new Map();
	var averagesCount = new Map();

	for (var i = 0; i < trackPoints[trackSeg].length; i++) {
		var trpExt = trackPoints[trackSeg][i].getElementsByTagName('extensions')[0].childNodes;
		// 1 and -1 is sdt
		for (var ext = 0; ext < trpExt.length; ext++) {
			// remove trash
			if (trpExt[ext].nodeName === '#text') {
				continue;
			}
				for (var dat = 0; dat < trpExt[ext].childNodes.length; dat++) {
					// remove trash
					if (trpExt[ext].childNodes[dat].nodeName === '#text') {
						continue;
					}
					var dtag = trpExt[ext].childNodes[dat].nodeName.split(':')[1];
					var dval = Number(trpExt[ext].childNodes[dat].innerHTML);

					if(!averages.has(dtag)) {
						averages.set(dtag, 0);
					}
					if(!averagesCount.has(dtag)) {
						averagesCount.set(dtag, 1);
					} else {
						var temp = averagesCount.get(dtag);
						temp++;
						averagesCount.set(dtag, temp);
					}
					var temp = averages.get(dtag);
					temp += dval;
					averages.set(dtag, temp);

					extensionNames.push(dtag);
					extensionValues.push(dval);
				}
		}
		// averageHeartRate += Number(trackPoints[trackSeg][i].getElementsByTagName('extensions')[0].getElementsByTagName('ns3:TrackPointExtension')[0].getElementsByTagName('ns3:hr')[0].innerHTML);
		// averageCad += Number(trackPoints[trackSeg][i].getElementsByTagName('extensions')[0].getElementsByTagName('ns3:TrackPointExtension')[0].getElementsByTagName('ns3:cad')[0].innerHTML);
		elevations.push(Number(trackPoints[trackSeg][i].getElementsByTagName('ele')[0].innerHTML));
		times.push(Date(trackPoints[trackSeg][i].getElementsByTagName('time')[0].innerHTML));
	}

	// calculate average values
	for(var [key, val] of averages.entries()) {
			averages.set(key, val / averagesCount.get(key));
	}

	// averageHeartRate = averageHeartRate / trackPoints[trackSeg].length;
	// averageCad = averageCad / trackPoints[trackSeg].length;

	var startTime = new Date(trackPoints[trackSeg][0].getElementsByTagName('time')[0].innerHTML);
	var endTime = new Date(trackPoints[trackSeg][trackPoints[trackSeg].length-1].getElementsByTagName('time')[0].innerHTML);
	var totalTime = endTime - startTime;


	var prevLat = Number(trackPoints[trackSeg][0].getAttribute('lat'));
	var prevLon = Number(trackPoints[trackSeg][0].getAttribute('lon'));
	var distance = 0;

	L.marker([prevLat, prevLon], {title : 'Start'}).addTo(map);
	L.marker([Number(trackPoints[trackSeg][trackPoints[0].length-1].getAttribute('lat')), Number(trackPoints[0][trackPoints[0].length-1].getAttribute('lon'))], {title : 'End'}).addTo(map);


	for (var i = 1; i < trackPoints[0].length; i++) {

		var lat = Number(trackPoints[trackSeg][i].getAttribute('lat'));
		var lon = Number(trackPoints[trackSeg][i].getAttribute('lon'));

		distance += geoDistance(prevLat, prevLon, lat, lon, 'K');

		L.polyline([[prevLat, prevLon], [lat, lon]], {color : 'red'}).addTo(map);

		prevLat=lat;
		prevLon=lon;

	}

	var metadata = document.getElementById('metadata');
	document.getElementById('trackName').innerHTML = 'Track name: ' +  trackName;
	document.getElementById('totalTime').innerHTML = 'Total time: ' + Math.floor(totalTime / 1000 / 60 / 60) + 'h ' +  Math.floor(totalTime / 1000 / 60 % 60)  + 'min ' + Math.floor(totalTime / 1000 % 60) + 's';
	document.getElementById('totalDistance').innerHTML = 'Total distance: ' +  parseFloat(distance).toFixed(2) + ' km';
	document.getElementById('averageSpeed').innerHTML = 'Average speed: ' + parseFloat(distance/(totalTime / 1000 / 60 / 60)).toFixed(2) + ' km/h';


	document.getElementById('averageHR').innerHTML = 'Average heart rate: ' + parseFloat(averages.get('hr')).toFixed(2) + 'bpm';
	document.getElementById('cadence').innerHTML = 'Average cadence: ' +  parseFloat(averages.get('cad')).toFixed(2) + ' ACU';

}
