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
// airQ App - START
//
//

angular.module('airq', ['ionic', 'ngCordova', 'ionic.service.core', 'ionic.service.push', 'ionic.service.analytics', 'airq.controllers', 'airq.logincontrollers', 'airq.services', 'airq.filters', 'airq.mapcontrollers', 'airq.chartscontrollers', 'airq.servicesimportio', 'airq.servicesairquality', 'airq.servicesstations', 'airq.servicesgeojson', 'airq.db', 'airq.levels', 'airq.polluting', 'airq.geolocation', 'ionic.utils', 'underscore', 'turf', 'angular-momentjs', 'leaflet-directive', 'frapontillo.gage', 'async', 'S', 'pouchdb', 'nvd3ChartDirectives'])

.run(function ($ionicPlatform, $ionicAnalytics, Geolocation, $cordovaBackgroundGeolocation) {

  $ionicPlatform.ready(function () {

    $ionicAnalytics.register();

    //////////////////////////////////////////////
    // 
    // Background Geolocation
    //
    //

    /*
    var options = {
      // https://github.com/christocracy/cordova-plugin-background-geolocation#config
      desiredAccuracy: 100,
      stationaryRadius: 100,
      stopOnTerminate: true
    };

    $cordovaBackgroundGeolocation.configure(options).then(null, Geolocation.error, Geolocation.save);
    */

    Geolocation.watch();

    //////////////////////////////////////////////
    //
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    };

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    };

  });
})

.constant('MAPQUEST', {
  url: 'http://open.mapquestapi.com/geocoding/v1/',
  key: 'Fmjtd%7Cluu82q62n1%2C25%3Do5-94zw06'
})

.constant('UTILITY', {
  test: false,
  timeout: 60000,
  distance: 1000,
  heatmap: false,
  force: true,
  level: 2
})

.constant('SHARE', {
  www: 'http://opendatabari.github.io/CO2/',
  github: 'https://github.com/opendatabari/CO2/tree/master/www/'
})

// nodeJS Server Proxy (-- deprecated --)
.constant('AIRQ', {
  url: {
    prod: 'http://openpuglia-prod.apigee.net/airq-a127/',
    dev: 'http://127.0.0.1:10010/'
  }
})

.constant('DB', {
  name: 'co2',  // nome del database
  _id: 'airq'
})

.constant('HISTORY', {
  url: 'http://www.vincenzopatruno.org/api/?q=getdata'
})

// dati di importIO 
.constant('IMPORT', {
  config: {
    "auth": 
    {
      "userGuid": "df450de0-1945-4212-9284-e84133bf5c7e",
      "apiKey": "df450de0-1945-4212-9284-e84133bf5c7e:kM1OcWAonh0Mtf3v+f4qaoqts+1MogWSGqAtO+EjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T/twDkq9g=="
    },
    "host": "import.io"
  },
  query: [
  {
    "connectorGuids": [
      "8c04e12b-064f-4f45-a2aa-16353f201b85"
    ],
    "input": {
      "webpage/url": "http://www.arpa.puglia.it/web/guest/qariainq"
    }
  },
  {
    "connectorGuids": [
        "9f6ff387-09f1-4707-9420-2408a6385afc"
    ],
    "input": {
        "webpage/url": "http://www.arpa.puglia.it/web/guest/qariainq"
    }
  }],
  curls: [
  {
    url: 'https://api.import.io/store/connector/8c04e12b-064f-4f45-a2aa-16353f201b85/_query?_user=df450de0-1945-4212-9284-e84133bf5c7e&_apikey=df450de0-1945-4212-9284-e84133bf5c7e%3AkM1OcWAonh0Mtf3v%2Bf4qaoqts%2B1MogWSGqAtO%2BEjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T%2FtwDkq9g%3D%3D',
    method: 'POST',
    data: {"input":{"webpage/url":"http://www.arpa.puglia.it/web/guest/qariainq"}},
    headers: {'Content-Type': 'application/json'}
  },
  {
    url: 'https://api.import.io/store/connector/9f6ff387-09f1-4707-9420-2408a6385afc/_query?_user=df450de0-1945-4212-9284-e84133bf5c7e&_apikey=df450de0-1945-4212-9284-e84133bf5c7e%3AkM1OcWAonh0Mtf3v%2Bf4qaoqts%2B1MogWSGqAtO%2BEjH1MZPdunEpkNODuLmt8aTBNdDfHgEu5Hasfw8T%2FtwDkq9g%3D%3D',
    method: 'POST',
    data: {"input":{"webpage/url":"http://www.arpa.puglia.it/web/guest/qariainq"}},
    headers: {'Content-Type': 'application/json'}
  }]
})

.config(function($momentProvider){
  $momentProvider
    .asyncLoading(false)
    .scriptUrl('lib/moment/moment.js');
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicAppProvider) {

  $ionicConfigProvider.tabs.position('bottom');

  $ionicAppProvider.identify({
    // The App ID (from apps.ionic.io) for the server
    app_id: 'be9c11c6',
    // The public API key all services will use for this app
    api_key: '5e958844de2a91d1df7a8c7780fadde9ead0558d3c0c4ff0',
    // The GCM project ID (project number) from your Google Developer Console (un-comment if used)
    gcm_id: '790973966275'
  });

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // Each tab has its own nav history stack:

  .state('tab.airq', {
    url: '/airq',
    views: {
      'tab-airq': {
        templateUrl: 'templates/tab-airq.html',
        controller: 'AirQCtrl'
      }
    }
  })

  .state('tab.weather', {
      url: '/weather',
      views: {
        'tab-weather': {
          templateUrl: 'templates/tab-weather.html',
          controller: 'WeatherCtrl'
        }
      }
  })

  .state('tab.charts', {
    url: '/charts/:city/:polluting/:days',
    views: {
      'tab-airq': {
        templateUrl: 'templates/tab-airq-charts.html',
        controller: 'ChartsCtrl'
      }
    }
  })

  .state('tab.login', {
    url: '/login',
    views: {
      'tab-airq': {
        templateUrl: 'templates/tab-login.html',
        controller: 'LogInCtrl'
      }
    }
  })

  .state('tab.detail', {
    url: '/airq/:poll',
    views: {
      'tab-airq': {
        templateUrl: 'templates/tab-airq-detail.html',
        controller: 'MapCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/login');

});
