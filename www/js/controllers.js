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
// airQ App - Controller Main
//
//

angular.module('airq.controllers', [])

/////////////////////////////
// Air Quality Controller
//
.controller('AirQCtrl', function ($scope, Geolocation, $ionicLoading, $localstorage, $timeout, _, UTILITY, $ionicModal, Level, Import, GeoJSON, $ionicActionSheet, $cordovaSocialSharing, SHARE, Polluting, async) {

	// Geolocation.watch();

  var data_airq;
  var item_nearest;
  var city_nearest;
  var location;
  var watch;
  var gauges = [];
  var p_sel;

  showSpinner(true, 'initializing ...');
    
  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.refresh(true);
  });

  function _callback_message(message) {
    showSpinner(true, message);
  };

  $scope.stats = function (item) {

    var days = 7;

    window.location.href = '#/tab/charts/' + item.city + '/' + item.polluting + '/' + days;
  };

  //////////////////////////////////
  //
  // Share
  //

  function _share (type, item) {

    var message = '';
    var image = '';
    var link = '';

    var l = _.find(Level.items, function (item_data) {
      return item_data.level === item.aiq.level;
    });

    if (typeof l !== 'undefined') {
      message = 'Rilevato inquinante ' + item.polluting + ' a ' + Math.round(item.aiq.realvalue) + ' ' + item.aiq.um +
                ' a ' + item.city + '(' + item.station  + '),' + l.name;

      image = SHARE.github + l.image;
      link = SHARE.www;
    };

    console.log(message + '\n' + image + '\n' + link);

    if (type === 'facebook') {
      $cordovaSocialSharing
        .shareViaFacebook(message, image, link)
        .then(_success_share, _error_share);
    } else if (type === 'twitter') {
      $cordovaSocialSharing
        .shareViaTwitter(message, image, link)
        .then(_success_share, _error_share);
    } else if (type === 'whatsapp') {
      $cordovaSocialSharing
      .shareViaWhatsApp(message, image, link)
      .then(_success_share, _error_share);
    }
  };

  function _success_share(result) {
    console.log('condivisione avvenuta con successo.');
  };

  function _error_share(err) {
    console.log('errore nella condivisione.');
  };

  $scope.share = function(item) {

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: '<i class="icon ion-social-facebook"></i> Facebook' },
        { text: '<i class="icon ion-social-twitter"></i> Twitter' },
        { text: '<i class="icon ion-social-whatsapp"></i> WhatApp'}
      ],
      titleText: 'Share',
      cancelText: 'Cancel',
      cancel: function() {
          // add cancel code..
        },
      buttonClicked: function(index) {
        if (index == 0) {
          // facebook
          console.log('share with facebook');
          _share('facebook', item);
        } else if (index == 1) {
          // twitter
          console.log('share with twitter');
          _share('twitter', item);
        } else if (index == 2) {
          console.log('share with whatsapp');
          _share('whatsapp', item);
        }

        return true;
      }
   });

   // For example's sake, hide the sheet after two seconds
   $timeout(function() {
     hideSheet();
   }, 2000);

  };

  //////////////////////////////////
  //
  // Modal Info
  //
  
  $ionicModal.fromTemplateUrl('templates/info.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
  
  $scope.openModal = function() {
    $scope.modal.show();
  };
  
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  
    //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
      $scope.modal.remove();
  });
  
    // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
      // Execute action
  });
  
    // Execute action on remove modal
  $scope.$on('modal.removed', function() {
      // Execute action
  });
	
  $scope.view_error = false;
  $scope.view_data = false;
  
  function showSpinner (view, message) {

    var msg = '<ion-spinner icon="spiral"></ion-spinner>';

    if (typeof message !== 'undefined') {
      msg += '<br />' + message;
    };

    if (view) {  
      $ionicLoading.show({
          template: msg
      });
    } else {
      $ionicLoading.hide();
    }
  };

  function _prepare_meters() {

    var data_meters = [];

    for (var i = 0; i < $scope.airqlist.length; i++) {
        $scope.$watch('airqlist[' + i + ']', function (newValue, oldValue) {  
          $scope.airq_meters = _get_meters(newValue);
        });
    };
  };

  function _get_meters(item) {
    
    var v = 0;
    
    if (!isNaN(item.aiq.realvalue)) {
      v = item.aiq.realvalue;
    };

    if (v === 0) {
      var data_meters = {};
    } else {

      var data_meters = {
        title: item.polluting,
        subtitle: Math.round(v) + ' ' + item.aiq.um,
        ranges: [0, 8],
        measures: [parseInt(item.aiq.level)],  
        markers: [2, 6]
      };
    }

    // console.log(JSON.stringify(item)); 
    return data_meters;

  };

  function _load(force) {

    var data_filtered;

    $scope.airqlist = [];

    location = Geolocation.location();

    Import.start(force, function (err, data) {
      
      // console.log('Dataset: ' + JSON.stringify(data.dataset));
      $scope.source = data.source.id;
      $scope.source_link = data.source.url;
      $scope.data_airq = data.source.date;

      $scope.levels = Level.items;

      var data_sorted = _.sortBy(data.dataset, function (item) {
          // console.log('item sorted: ' + JSON.stringify(item));
          return GeoJSON.distance(location.latitude, location.longitude, item.location.latitude, item.location.longitude);
      });

      _prepare_data(data_sorted);

      _last();

      showSpinner(false);

    }, _callback_message, _error);

  };

  function _prepare_data(data) {

    var d = [];

    async.each(data, function (item, callback) {
      var i = {
        item: item,
        polluting: item.polluting,
        meters: _get_meters(item)
      };
      d.push(i);
      callback();
    }, function (err) {
      if (!err) {
        $scope.airqlist = d;
      }
    });

  };

  function _error(message) {
    $scope.view_error = true;
    console.error(message);
    $scope.error = message;
  };

  ///////////////////////
  //
  // Geolocation
  //

  var _callback_geolocation_success = function (position) {
    // showSpinner(true, 'coordinate rilevate...');
    $scope.view_error = false;
    console.log('getting position: ' +  JSON.stringify(position));
    Geolocation.save(position);
    // $scope.refresh();
  };

  var _callback_geolocation_error = function (error) {
    console.error('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
    _error('No GPS');
  };

  // Geolocation.watch(_callback_geolocation_success, _callback_geolocation_error);

  $scope.refresh = function (force) {

    // showSpinner(true, 'leggo i valori dalle centraline...');
    
    $scope.polls = Polluting;
    $scope.level = Level.items;

    location = Geolocation.location();
    
    Geolocation.address(function (err, address) {
      $scope.location = address;
    });

    if (location.latitude == 0 && location.longitude) {
      $scope.view_error = true;
      $scope.error = 'No GPS'
    } else {
      console.log('location: ' + location.latitude + ',' + location.longitude);
      $scope.view_error = false;
    };

    _load(force);

  };

  // calcolo la variazione di valori rispetto ai valori precedenti
  function _last () {

    showSpinner(true, 'confronto i valori ...');

    Import.last(1, function (err, data_last) {

      // console.log('last_data n.:' + _.size(data_last.dataset));
      // console.log('check last value by ' + JSON.stringify(item));

      for (var i = 0; i < $scope.airqlist.length; i++) {
        $scope.$watch('airqlist[' + i + ']', function (newValue, oldValue) {
      
            var item_poll_near = _.find(data_last.dataset, function (item_data) {
              return (newValue.polluting == item_data.polluting && 
                      newValue.city == item_data.city && 
                      newValue.station == item_data.station);
            });

            if (typeof item_poll_near !== 'undefined') {

              // console.log('item founded: ' + JSON.stringify(item_poll));
              
              var value_r = newValue.aiq.realvalue;
              var value_l = item_poll_near.aiq.realvalue;

              $scope.last = (value_l / value_r);

              if (value_l > value_r) {
                $scope.icon_value = 'icon ion-ios-arrow-thin-down';
              } else if (value_l < value_r) {
                $scope.icon_value = 'icon ion-ios-arrow-thin-up';
              } else {
                $scope.icon_value = 'icon ion-ios-minus-empty';
              };

            };
          });
        };
        showSpinner(false);
    });
  };
})

/////////////////////////////
// Weather Controller
//
.controller('WeatherCtrl', function ($scope, $stateParams, Weather, Geolocation, $timeout, UTILITY, $ionicModal, $ionicLoading) {
  
  var weather;
  var location;

  showSpinner(true);

  function showSpinner (view, message) {

    $scope.view_error = view;

    var msg = '<ion-spinner icon="spiral"></ion-spinner>';

    if (typeof message !== 'undefined') {
      msg += '<br />' + message;
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
    showSpinner(true, 'Coordinate rilevate');
    console.log('getting position: ' +  JSON.stringify(position));
    $scope.view_error = false;
    Geolocation.save(position);
    $scope.refresh();
  };

  var _callback_geolocation_error = function (error) {
    console.error('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
    $scope.view_error = true;
    $scope.error = 'No GPS';
  };

  Geolocation.watch(_callback_geolocation_success, _callback_geolocation_error);

  $scope.back = function () {
    window.location.href = '#/tab/airq';
  };

  $ionicModal.fromTemplateUrl('templates/info_weather.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
  
  $scope.openModal = function() {
    $scope.modal.show();
  };
  
  $scope.closeModal = function() {
      $scope.modal.hide();
  };
  
    //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
      $scope.modal.remove();
  });
  
    // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
      // Execute action
  });
  
    // Execute action on remove modal
  $scope.$on('modal.removed', function() {
      // Execute action
  });
  
  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.refresh();
  });

  $scope.refresh = function () {

    showSpinner(true, 'loading data ...');

    Geolocation.address(function (err, address) {
      $scope.location = address;
    });

    Weather.get(function (err, data) {
      if (err) {
        $scope.view_error = true;
        $scope.error = 'non riesco a leggere i dati meteo';
      } else {
        $scope.view_error = false;
        weather = data.list;
        $scope.weathers = weather;
      };
      showSpinner(false);
    }); 
  };

});

