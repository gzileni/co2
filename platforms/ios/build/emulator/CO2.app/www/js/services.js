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
// airQ App - Services Main
//
//
// (-- deprecated --)

var service = angular.module('airq.services', []);

service.factory('AirQ', function ($http, _, AIRQ, UTILITY, $localstorage, $moment) {

  var data_airq;
  
  var airq_service = {

    reload: function (callback) {
      var data_airq = {};
      $localstorage.setObject('data', data_airq);
      callback(); 
    },

    last: function(callback) {
      
      var url = _get_last(AIRQ, UTILITY);

      _get($http, url, function (err, data) {
        
        console.log('Data Last Response n.' + _.size(data));
        
        if (typeof callback === 'function') {
          callback(err, data);
        };

      });
    },

    get: function (callback) {

      url = _get_url(AIRQ, UTILITY);

      _get($http, url, function (err, data) {
        
        console.log('Data Response n.' + _.size(data));

        if (typeof callback === 'function') {
          callback(err, data);
        };

      });

    }
  };

  return airq_service;

});

/////////////////////////////////////////////////////////
//
// Service Weather
//

service.factory('Weather', function ($http, _, AIRQ, $localstorage, $moment, Geolocation) {

  var weather_service = {
    
    get: function (callback) {
      
      var location = Geolocation.location();
      
      var url = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + location.latitude + '&lon=' + location.longitude + '&units=metric&callback=JSON_CALLBACK';
      console.log('getting weather by ' + url);
      
      _get($http, url, function (err, data) {
        if (typeof callback === 'function') {
          callback(err, data);  
        };  
      });
      
    } 
  };

  return weather_service;

});

///////////////////

function _get_url(AIRQ, UTILITY) {

  var url = AIRQ.url.prod;
  
  if (UTILITY.test) {
    url = AIRQ.url.dev;
  };

  url = url + 'airq?callback=JSON_CALLBACK';

  console.log('get data by ' + url);

  return url;
};

function _get_last(AIRQ, UTILITY) {
  var url = AIRQ.url.prod;
  
  if (UTILITY.test) {
    url = AIRQ.url.dev;
  };

  url = url + 'last?callback=JSON_CALLBACK';

  console.log('get data by ' + url);

  return url;
};

function _get($http, url, callback) {

  $http.jsonp(url)
    .success(function(data, status, headers, config) {
      if (typeof callback === 'function') {
        callback(false, data);
      };
    })
    .error(function(data, status, headers, config) {
      if (typeof callback === 'function') {
        callback(true, null);
      };
  });

};
