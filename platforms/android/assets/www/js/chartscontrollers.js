

/////////////////////////////
// Charts Controller
//

var chartsctrl = angular.module('airq.chartscontrollers', ['leaflet-directive']);


chartsctrl.controller('ChartsCtrl', function ($scope, $stateParams, Geolocation, $ionicLoading, $localstorage, $timeout, _, UTILITY, $ionicModal, Level, Import, GeoJSON, $ionicActionSheet, $cordovaSocialSharing, SHARE, Polluting, async) {

  var city = $stateParams.city;
  var polluting = $stateParams.polluting;
  var days = $stateParams.days;

  console.log('getting charts by ' + city + ',' + polluting + ',' + days);

  $scope.title = 'Statistiche ' + city;

  // showSpinner(true, 'initializing charts ...');

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
    
  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.refresh();
  });

  function _callback_message(message, counter) {
    showSpinner(true, message);
  };

  function _error(message) {
    $scope.view_error = true;
    console.error(message);
    $scope.error = message;
  };

  $scope.refresh = function () {

  	Import.history(city, polluting, days, function (err, data) {

  		showSpinner(false);
  	}, _callback_message, _error);

  };
  

});
