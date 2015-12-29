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
// airQ App - Service GEOJSON
//
//

var service = angular.module('airq.servicesgeojson', []);

service.factory('GeoJSON', function (_, async, S, turf) {

	var geojson_json = {

		/////////////////////////////////////////
	    // 
	    // creo il file geojson

		create: function (input, callback_service) {

			var data_geojson = {
			  type : "FeatureCollection",
			  features: []
			};

			console.log('create geojson ...');

			async.each(input, function (item, callback) {
		        
		        var feature = { 
		          type: "Feature", 
		          properties: item, 
		          "geometry": { 
		              type: "Point", 
		              "coordinates": [ Number(item.location.longitude), Number(item.location.latitude) ] 
		          }
		        };

		        data_geojson.features.push(feature);
		        
		        callback();

		    }, function (err) {
		    	console.log('geojson created ' + _.size(data_geojson.features) + ' elements.')
		        callback_service(err, data_geojson);
		    });

		},

		/////////////////////////////////////////
	    // 
	    // prendo il punto più vicino

		nearest: function (data, lat, lng, callback_service) {

			geojson_json.create(data, function(err, data_g) {

				if (err) {

					if (typeof callback_service === 'function') {
						callback_service(true, null);
					};

				} else {

					var point = {
					    "type": "Feature",
					    "properties": {
					      "marker-color": "#0f0"
					    },
					    "geometry": {
					      "type": "Point",
					      "coordinates": [lng, lat]
					    }
					  };

					var nearest = turf.nearest(point, data_g);

					if (typeof callback_service === 'function') {
						callback_service(err, nearest);
					};

				}

			});

			
		},

		/////////////////////////////////////////
	    // 
	    // cerco per key-value

		search: function (data, key, value, callback_service) {

			geojson_json.create(data, function(err, data_g) {
				if (err) {
					if (typeof callback_service === 'function') {
						callback_service(err, null);
					};
				} else {
					console.log('filtered geojson...')
					var filtered = turf.filter(data_g, key, value);
					if (typeof callback_service === 'function') {
						callback_service(err, filtered);
					};
				}
			});
		},

		/////////////////////////////////////////
	    // 
	    // calcolo la distance

		distance: function (lat1, lng1, lat2, lng2) {
			var point1 = {
			  "type": "Feature",
			  "properties": {
					"marker-color": "#0f0"
				},
				"geometry": {
			    "type": "Point",
			    "coordinates": [lng1, lat1]
			  }
			};
			var point2 = {
			  "type": "Feature",
			  "properties": {
					"marker-color": "#0f0"
				},
				"geometry": {
			    "type": "Point",
			    "coordinates": [lng2, lat2]
			  }
			};
			var units = "kilometers";
			return turf.distance(point1, point2, units);
		}
	};

	return geojson_json;

});