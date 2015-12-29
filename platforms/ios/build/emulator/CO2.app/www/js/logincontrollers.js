

/////////////////////////////
// Charts Controller
//

var loginctrl = angular.module('airq.logincontrollers', ['leaflet-directive']);

loginctrl.controller('LogInCtrl', function ($scope, $rootScope, $stateParams, $ionicUser, $ionicPush, $localstorage) {

	var user = $localstorage.getObject('user');
	var uuid;

	var deviceInformation = ionic.Platform.device();
	
	var isWebView = ionic.Platform.isWebView();
  	var isIPad = ionic.Platform.isIPad();
  	var isIOS = ionic.Platform.isIOS();
  	var isAndroid = ionic.Platform.isAndroid();
  	var isWindowsPhone = ionic.Platform.isWindowsPhone();

  	if (typeof user.user_id === 'undefined') {
  		uuid = $ionicUser.generateGUID();
  		console.log('uuid test: ' + uuid);
  	} else {
  		uuid = user.user_id;
  		console.log('uuid saved: ' + uuid);
  	}

  	if (isIPad || isIOS || isAndroid || isWindowsPhone) {
  		console.log('isIOS: ' + isIOS + '-isAndroid: ' + isAndroid + '-isIPad: ' + isIPad + '-isWindowsPhone: ' + isWindowsPhone);
  		console.log('device: ' + JSON.stringify(deviceInformation));
  		
  		if (typeof deviceInformation.uuid !== 'undefined') {
  			uuid = deviceInformation.uuid;
  			console.log('uuid device: ' + uuid);
  		};
  	};

	$scope.user = {
		user_id: uuid,
		name: user.name,
		bio: user.bio
	};

	angular.extend($scope.user, {
      name: user.name,
      bio: user.bio
    });

    console.log('user identified -> ' + JSON.stringify($scope.user));
                     
	$ionicUser.identify($scope.user).then(function(){
	  console.log('user identified -> ' + JSON.stringify($scope.user));
	  $scope.run();
	}, function(err) {
		// error
		console.log('error to identify user -> ' + JSON.stringify($scope.user));
	});

	$scope.register = function () {

		console.log('Ionic User: Identifying with Ionic User service');

	    var options = {
		  user_id: uuid,
		  name: $scope.user.name,
		  bio: $scope.user.bio
		};

	    $ionicUser.identify(options).then(function(){
	      $scope.identified = true;
	      console.log('user identified -> ' + JSON.stringify(options));
	    }, function(err) {
 			// error
 			console.log('error to identify user -> ' + JSON.stringify(options));
		});

		$localstorage.setObject('user', options);

		$ionicPush.register({
	      canShowAlert: true, //Can pushes show an alert on your screen?
	      canSetBadge: true, //Can pushes update app icon badges?
	      canPlaySound: true, //Can notifications play a sound?
	      canRunActionsOnWake: true, //Can run actions outside the app,
	      onNotification: function(notification) {
	        // Handle new push notifications here
	        // console.log(notification);
	        return true;
	      }
	    }, options);

	    console.log('done user registration');

	    $scope.run();
	};

	$rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
    	console.log("Successfully registered token " + data.token);
    	console.log('Ionic Push: Got token ', data.token, data.platform);
    	$scope.token = data.token;
  	});

  	$scope.run = function () {
  		window.location.href = '#/tab/airq';
  	}

});