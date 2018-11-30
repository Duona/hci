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
function initmap(startLan, startLon) {
	// set up the map
	map = new L.Map('mapid');

	// create the tile layer with correct attribution
	var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 19, attribution: osmAttrib});

	map.setView(new L.LatLng(startLan, startLon),9);
	map.addLayer(osm);
}



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

function userRouteUpload() {
	var userRoute = document.getElementById("userRouteUpload");
	console.log(userRoute.select());
}


var routes = new Array();

routes.push('data/running.gpx');
routes.push('data/cycling.gpx');
routes.push('data/Activities/activity_1927428247.gpx');
routes.push('data/Activities/activity_1969416308.gpx');
routes.push('data/Activities/activity_2011170049.gpx');
routes.push('data/Activities/activity_2066330123.gpx');
routes.push('data/Activities/activity_1939704174.gpx');
routes.push('data/Activities/activity_1982749380.gpx');
routes.push('data/Activities/activity_2041180865.gpx');
routes.push('data/Activities/activity_2113490927.gpx');
routes.push('data/Activities/activity_1955980791.gpx');
routes.push('data/Activities/activity_1994493937.gpx');
routes.push('data/Activities/activity_2051947649.gpx');
routes.push('data/Activities/activity_2157967385.gpx');


/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */

function dropDown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

var selectedRoute = 0;

console.log(routes.length);

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName('dropdown-content');
		var myDropdown = document.getElementById('myDropdown');
    for (var i = 0; i < routes.length; i++) {

			var list = document.createElement('button');
			list.innerHTML = 'Route ' + i;
			myDropdown.appendChild(list);

      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}


// create gpx parser

var xmlFile = readTextFile(routes[5]);
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
var extensionDic = {'hr' : 'heartrate', 'cad' : 'cadence', 'atemp' : 'atempt I guess'};
var extensionUnitDic = {'hr' : 'bpm', 'cad' : 'ACU', 'atemp' : 'how hard you tried'};
var firstIterration = false;

for (trackSeg; trackSeg < trackSegs.length; trackSeg++) {

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

		elevations.push(Number(trackPoints[trackSeg][i].getElementsByTagName('ele')[0].innerHTML));
		times.push(Date(trackPoints[trackSeg][i].getElementsByTagName('time')[0].innerHTML));

	}

	// calculate average values
	for(var [key, val] of averages.entries()) {
		averages.set(key, val / averagesCount.get(key));
	}

	var startTime = new Date(trackPoints[trackSeg][0].getElementsByTagName('time')[0].innerHTML);
	var endTime = new Date(trackPoints[trackSeg][trackPoints[trackSeg].length-1].getElementsByTagName('time')[0].innerHTML);
	var totalTime = endTime - startTime;


	var prevLat = Number(trackPoints[trackSeg][0].getAttribute('lat'));
	var prevLon = Number(trackPoints[trackSeg][0].getAttribute('lon'));
	var distance = 0;

	initmap(prevLat, prevLon);

	L.marker([prevLat, prevLon], {title : 'Start'}).addTo(map);
	L.marker([Number(trackPoints[trackSeg][trackPoints[0].length-1].getAttribute('lat')), Number(trackPoints[0][trackPoints[0].length-1].getAttribute('lon'))], {title : 'End'}).addTo(map);


	for (var i = 1; i < trackPoints[trackSeg].length; i++) {

		var lat = Number(trackPoints[trackSeg][i].getAttribute('lat'));
		var lon = Number(trackPoints[trackSeg][i].getAttribute('lon'));

		distance += geoDistance(prevLat, prevLon, lat, lon, 'K');

		var line = L.polyline([[prevLat, prevLon], [lat, lon]], {color : 'rgba(91, 208, 114, 0.5)'}).addTo(map);

		L.polylineDecorator(line, {
			patterns: [
				{
					offset: '50%',
					repeat: 0,
					symbol: L.Symbol.arrowHead({pixelSize: 7, polygon: false,  pathOptions: {stroke: true, color:'rgba(91, 208, 114, 0.8)'}})
				}
			]
		}).addTo(map);

		prevLat=lat;
		prevLon=lon;

	}

	var prevEl = elevations[0];
	var totalAscend = 0;
	var totalDescend = 0;
	// total ascend and descend
	for (var i = 1; i < elevations.length; i++) {
		var diff = elevations[i] - prevEl;
		if(diff > 0) {
			totalAscend += diff;
		} else {
			totalDescend += diff;
		}
		prevEl = elevations[i];
	}

	var metadata = document.getElementById('metadata');
	document.getElementById('trackName').innerHTML = 'Track name: ' +  trackName;
	document.getElementById('totalTime').innerHTML = 'Total time: ' + Math.floor(totalTime / 1000 / 60 / 60) + 'h ' +  Math.floor(totalTime / 1000 / 60 % 60)  + 'min ' + Math.floor(totalTime / 1000 % 60) + 's';
	document.getElementById('totalDistance').innerHTML = 'Total distance: ' +  parseFloat(distance).toFixed(2) + ' km';
	document.getElementById('averageSpeed').innerHTML = 'Average speed: ' + parseFloat(distance/(totalTime / 1000 / 60 / 60)).toFixed(2) + ' km/h';

	document.getElementById('totalAscend').innerHTML = 'Total ascend: ' + parseFloat(totalAscend).toFixed(2) + ' m';//'Average heart rate: ' + parseFloat(averages.get('hr')).toFixed(2) + 'bpm';
	document.getElementById('totalDescend').innerHTML = 'Total descend: ' + parseFloat(totalDescend).toFixed(2) + ' m';//'Average cadence: ' +  parseFloat(averages.get('cad')).toFixed(2) + ' ACU';

 var chart = document.getElementById('myChart');
 var marginTop = 0;
 var map = document.getElementById('mapid')
 var mapHeight = 100;
	for(var [key, val] of averages.entries()) {
		var met = document.createElement('div');
		met.innerHTML = 'Average ' + extensionDic[key] + ': ' + parseFloat(val).toFixed(2) + ' ' + extensionUnitDic[key];
		marginTop += 100;
		chart.style.margin = marginTop + 'px 0px 0px 0px';
		mapHeight += 15;
		// map.style.height = mapHeight + '%';
		metadata.appendChild(met);
	}


}
