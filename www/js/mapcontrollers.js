/*!
 * Copyright 2014 Giuseppe Zileni
 * http://giuseppezileni.github.io
 *
 * Ionic, v1.0.0
 * http://ionicframework.com/
 *
 * By @gzileni
 *
 * Licensed under the MIT license. Please see LICENSE for more information.
 *
 */

//////////////////////////////////////////////
// 
// airQ App - Controller's Map
//
//

var mapctrl = angular.module('airq.mapcontrollers', ['leaflet-directive']);

var marker; 
var layer;
var map;

mapctrl.controller('MapCtrl', function ($scope, $stateParams, Geolocation, $ionicLoading, leafletData, UTILITY, Level, Import, GeoJSON, S) {
  	
  	var location;
  	var poll_data;
	var layer_control;
    var layer_geojson;
	var weather_control;
	var geojson;
	
	var poll = $stateParams.poll;
	var city = $stateParams.city;

	$scope.title = poll;

	console.log('Params Poll: ' + poll);
	
	showSpinner(true);
	
	$scope.back = function () {
		window.location.href = '#/tab/airq';
	};
  
	$scope.$on('$ionicView.beforeEnter', function() {
    	$scope.refresh(false);
    });

    function showSpinner (view, message) {

	    var msg = '<ion-spinner icon="lines"></ion-spinner>';

	    if (typeof message !== 'undefined') {
	      msg = message;
	    };

	    if (view) {  
	      $ionicLoading.show({
	          template: msg
	      });
	    } else {
	      $ionicLoading.hide();
	    }
  	};

  	var _callback_geolocation_success = function (position) {
	    console.log('getting position: ' +  JSON.stringify(position));
	    Geolocation.save(position);
	    $scope.refresh(false);
	};

	var _callback_geolocation_error = function (error) {
	    console.error('code: '    + error.code    + '\n' +
	                  'message: ' + error.message + '\n');
	};

  	// Geolocation.watch(_callback_geolocation_success, _callback_geolocation_error);

	$scope.refresh = function (force) {

		showSpinner(true);

        console.log('polluting parameter: ' + poll);

        location = Geolocation.location();

    	if (location.latitude != 0 && location.longitude != 0) {
			console.log('**** Center ' + location.latitude + ',' + location.longitude);
		};

		angular.extend($scope, {
			defaults: {
		        scrollWheelZoom: true
		    }
		});

		Import.start(force, function (err, data) {
	      
	      if (!err) {

      		console.log('filtering data by poll: ' + poll);
      		$scope.title = poll;
      		poll_data = _.filter(data.dataset, function (item) {
				return S(item.polluting).contains(poll);
		  	});
	    
		    console.log('n. elements filtered: ' + _.size(poll_data));
		    // console.log('elements filtered: ' + JSON.stringify(poll_data));

			GeoJSON.create(poll_data, function (err, data_geojson) {
				geojson = data_geojson;
				$scope.geojson();
			});

	      } else {
	      	// error 
	      }

	      showSpinner(false);

	    }, _callback_message, _error);

	    showSpinner(false);
	
	};

	function _callback_message(message, counter) {
    	showSpinner(true, message);
  	};

  	function _error(message) {
    	// $scope.view_error = true;
    	console.error(message);
    	// $scope.error = message;
  	}

    // visualizzo i dati geojson
	$scope.geojson = function () {

		showSpinner(true);

		leafletData.getMap('map').then(function(map) {

			// map.spin(true);

			$scope.initMap(map, location.latitude, location.longitude);

			layer_geojson = L.geoJson(geojson, {
			    style: function (feature) {
			        return {
			        	color: feature.properties.aiq.color
			        };
			    },
			    onEachFeature: function (feature, layer) {
			    	// console.log('Features: ' + JSON.stringify(feature));
			    	layer.bindPopup(_html_feature(feature.properties, Geolocation, Level));
			    },
			    pointToLayer: function ( feature, latlng ) {

			    	var options = {
			    		stroke: false,
			    		//opacity: 0.1,
			    		fillOpacity: _get_opacity(feature.properties.aiq.level)
			    	};

			    	var circle = L.circleMarker( latlng, options);
			    	circle.setRadius(_get_radius(feature.properties.aiq.value));
			    	return circle;
			    }
			});
                                       
            layer_geojson.addTo(map);

            map.invalidateSize();

            // map.spin(false);

            showSpinner(false);

		});
	};

	// Initialize Map
	$scope.initMap = function (map, lat, lng) {

		showSpinner(false);

		map.spin(true);

		if (layer) {
			map.removeLayer(layer);
		};

		if (layer_control) {
			layer_control.removeFrom(map);
		};
                   
        if (layer_geojson) {
            map.removeLayer(layer_geojson);
        };

		var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		var osmAttribution = 'Map data © OpenStreetMap contributors, CC-BY-SA';
		var osm = new L.TileLayer(osmUrl, {
			maxZoom: 18, 
			attribution: osmAttribution
		}).addTo(map);

		if (marker) {
			map.removeLayer(marker);
		};

		// marker della posizione del device
		if (lat != 0 && lng != 0) {

			var ll = L.latLng(lat, lng);

			marker = L.userMarker(ll, {
				pulsing: true, 
				accuracy: 100, 
				smallIcon: true,
				opacity: 0.2
			});
			marker.addTo(map);

			map.setView([lat, lng], 9);
		};

		var options_weather_layer = {
			showLegend: false, 
			opacity: 0.2 
		};

		var clouds = L.OWM.clouds(options_weather_layer);
		var city = L.OWM.current({intervall: 15, lang: 'it'});
		var precipitation = L.OWM.precipitation(options_weather_layer);
		var rain = L.OWM.rain(options_weather_layer);
		var snow = L.OWM.snow(options_weather_layer);
		var temp = L.OWM.temperature(options_weather_layer);
		var wind = L.OWM.wind(options_weather_layer);

		var baseMaps = { "OSM Standard": osm };
		var overlayMaps = { 
			"Clouds": clouds, 
			"Precipitazioni": precipitation,
			"Neve": snow,
			"Temperature": temp,
			"vento": wind,
			"Cities": city 
		};
		layer_control = L.control.layers(baseMaps, overlayMaps).addTo(map);

		map.spin(false);

		map.invalidateSize();
	};

	$scope.heatmap = function () {

		showSpinner(false);
            
		console.log('**** Draw HeatMap by ' + location.latitude + ',' + location.longitude);

		//////////////////////////////////
		// HeatMap Leaflet

		var heatmap_data = {
		  max: 8,
		  data: []
		};

		var i = 0;

		while (poll_data[i]) {
		  
		  var item = {
		    lat: poll_data[i].location.latitude,
		    lng: poll_data[i].location.longitude,
		    value: poll_data[i].aiq.level
		  };

		  heatmap_data.data.push(item);
		  i++;  
		};

		console.log('Data data heatmap n.' + _.size(heatmap_data.data));

		var cfg = {
		  // radius should be small ONLY if scaleRadius is true (or small radius is intended)
		  "radius": 48,
		  "maxOpacity": .95, 
		  "minOpacity": .1,
		  // scales the radius based on map zoom
		  "scaleRadius": false, 
		  // if set to false the heatmap uses the global maximum for colorization
		  // if activated: uses the data maximum within the current map boundaries 
		  //   (there will always be a red spot with useLocalExtremas true)
		  "useLocalExtrema": true,
		  "blur": 0.5,
		  // which field name in your data represents the latitude - default "lat"
		  latField: 'lat',
		  // which field name in your data represents the longitude - default "lng"
		  lngField: 'lng',
		  // which field name in your data represents the data value - default "value"
		  valueField: 'value'
		};

		var heatmapLayer = new HeatmapOverlay(cfg);

		leafletData.getMap('map').then(function(map) {

			map.spin(true);

			$scope.initMap(map, location.latitude, location.longitude);

			layer = heatmapLayer;

			console.log('drawing heatmap...');

			map.addLayer(heatmapLayer);
			heatmapLayer.setData(heatmap_data);
			  
		});

		map.invalidateSize();

		map.spin(false);
		
	};

});

function _get_radius(val) {

	var v = Math.round(val / 10);
	var o;

	if (v < 24) {
		o = 24;
	} else if (v > 64) {
		o = 64;
	};
	
	return o;

};

function _get_opacity(val) {

	var v = (val / 10);

	// min: 0.1 - max: 0.7

	var o = 0.1;

	if (v <= 1) {
		o = 0.2
	} else if (v <= 4) {
		o = 0.4
	} else if (v <= 8) {
		o = 0.9
	};

	return o;

};

function _html_feature(feature, Geolocation, Level) {
	/*

		{
			"station":"Altamura",
			"city":"Altamura",
			"state":"Bari",
			"value":11,
			"day":3,
			"distance":31317,
			"aiq":{
				"value":10.185185185185185,
				"realvalue":11,
				"type":"urbano",
				"warning":0,
				"color":"#37e400",
				"text":"good",
				"level":1,
				"um":"µg/m³",
				"limit":0
				},
			"polluting":"PM10",
			"location":{
				"latitude":40.82786543446942,
				"longitude":16.56019549806092
			}
		}
		*/

	var html = '<h4>' + feature.polluting + '</h4>' +
			   '<h5>' + feature.city + ' (' + feature.station + ')</h5>' +
			   '<p>Valore misurato è <strong>' + Math.round(feature.aiq.realvalue) + '</strong> ' + feature.aiq.um + ' <br />' +
			   'Inquinamento di tipo ' + feature.aiq.type + '<br />' +
			   'Indice di qualità dell\'aria è di <strong>' + Math.round(feature.aiq.value) + '</strong><br />' + Level.getInfo(feature.aiq.level) + '<br />' + 
			   'Distanza: ' + Geolocation.distance(feature.location.latitude, feature.location.longitude) + ' km' + '</p>';

	return html;
}

