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
// airQ App - Services Air Quality
//
//

var service = angular.module('airq.servicesairquality', []);

service.factory('AirQuality', function (_, $moment, $http, async, S) {

	var airquality_json = {

		get: function (polluting, value, callback) {
			_calc_aiq(polluting, parseFloat(value), callback);
		} 

	};

	return airquality_json;

});

function _calc_aiq(poll, value, callback) {

  var clow = 0;
  var chigh = 0;
  var ilow = 0;
  var ihigh = 0;
  var isUrban = false;

  var aiq = {
      value: 0,
      realvalue: value,
      type: 'industriale',
      warning: 0,
      color: '#FFFFFF',
      text: 'non rilevato',
      level: 0,
      um: 'µg/m³',
      limit: 50
    };
  
  if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {

    if (S(poll).contains('PM10')) {
      aiq.type = 'urbano';
      isUrban = true;
      if (value >= 0 && value <= 54) {
        clow=0;
        chigh=54;
        ilow=0;
        ihigh=50;
      } else if (value >= 55 && value <= 154) {
        clow=55;
        chigh=154;
        ilow=51;
        ihigh=100;  
      } else if (value >= 155 && value <= 254) {
        clow=155;
        chigh=254;
        ilow=101;
        ihigh=150;
      } else if (value >= 255 && value <= 354) {
        clow=255;
        chigh=354;
        ilow=151;
        ihigh=200;
      } else if (value >= 355 && value <= 424) {
        clow=355;
        chigh=424;
        ilow=201;
        ihigh=300;
      } else if (value >= 425 && value <= 504) {
        clow=425;
        chigh=504;
        ilow=301;
        ihigh=400;
      } else if (value >= 505 && value <= 604) {
        clow=505;
        chigh=604;
        ilow=401;
        ihigh=500;
      }
    };

    if (S(poll).contains('NO2')) {
      aiq.type = 'urbano';
      isUrban = true;
      if (value >= 0 && value <= 53) {
        clow=0;
        chigh=53;
        ilow=0;
        ihigh=50;
      } if (value >= 54 && value <= 100) {
        clow=54;
        chigh=100;
        ilow=51;
        ihigh=100;
      } if (value >= 101 && value <= 360) {
        clow=101;
        chigh=360;
        ilow=101;
        ihigh=150;
      } if (value >= 361 && value <= 649) {
        clow=361;
        chigh=649;
        ilow=151;
        ihigh=200;
      } if (value >= 650 && value <= 1249) {
        clow=650;
        chigh=1249;
        ilow=201;
        ihigh=300;
      } if (value >= 1250 && value <= 1649) {
        clow=1250;
        chigh=1649;
        ilow=301;
        ihigh=400;
      } if (value >= 1650 && value <= 2049) {
        clow=1650;
        chigh=2049;
        ilow=401;
        ihigh=500;
      };
    };

    if (S(poll).contains('O3')) {
      aiq.type = 'urbano';
      isUrban = true;
      if (value >= 0 && value <= 164) {
        clow=0;
        chigh=164;
        ilow=101;
        ihigh=150;
      } else if (value >= 165 && value <= 204) {
        clow=165;
        chigh=204;
        ilow=151;
        ihigh=200;
      } else if (value >= 205 && value <= 404) {
        clow=205;
        chigh=404;
        ilow=201;
        ihigh=300;
      } else if (value >= 405 && value <= 504) {
        clow=405;
        chigh=504;
        ilow=301;
        ihigh=400;
      } else if (value >= 505 && value <= 604) {
        clow=505;
        chigh=604;
        ilow=401;
        ihigh=500;
      }; 
    };

    if (S(poll).contains('CO')) {
      aiq.type = 'urbano';
      isUrban = true;
      if (value >= 0.0 && value <= 4.4) {
        clow=0.0;
        chigh=4.4;
        ilow=0;
        ihigh=50;
      } else if (value >= 4.5 && value <= 9.4) {
        clow=4.5;
        chigh=9.4;
        ilow=51;
        ihigh=100;
      } else if (value >= 9.5 && value <= 12.4) {
        clow=9.5;
        chigh=12.4;
        ilow=101;
        ihigh=150;
      } else if (value >= 12.5 && value <= 15.4) {
        clow=12.5;
        chigh=15.4;
        ilow=151;
        ihigh=200;
      } else if (value >= 15.5 && value <= 30.4) {
        clow=15.5;
        chigh=30.4;
        ilow=201;
        ihigh=300;
      } else if (value >= 30.5 && value <= 40.4) {
        clow=30.5;
        chigh=40.4;
        ilow=301;
        ihigh=400;
      } else if (value >= 40.5 && value <= 50.4) {
        clow=40.5;
        chigh=50.4;
        ilow=401;
        ihigh=500;
      };
    };

    if (S(poll).contains('SO2')) {
      aiq.type = 'urbano';
      isUrban = true;
      if (value >= 0 && value <= 35) {
        clow=0;
        chigh=35;
        ilow=0;
        ihigh=50;  
      } else if (value >= 36 && value <= 75) {
        clow=36;
        chigh=75;
        ilow=51;
        ihigh=100;  
      } else if (value >= 76 && value <= 185) {
        clow=76;
        chigh=185;
        ilow=101;
        ihigh=150;  
      } else if (value >= 186 && value <= 304) {
        clow=186;
        chigh=304;
        ilow=151;
        ihigh=200;  
      } else if (value >= 305 && value <= 604) {
        clow=305;
        chigh=604;
        ilow=201;
        ihigh=300;  
      } else if (value >= 605 && value <= 804) {
        clow=605;
        chigh=804;
        ilow=301;
        ihigh=400;  
      } else if (value >= 805 && value <= 1004) {
        clow=805;
        chigh=1004;
        ilow=401;
        ihigh=500;  
      }
    };

    if (S(poll).contains('BLACK CARB')) {
      aiq.type = 'industriale';
      isUrban = false;
      limit = 50;
    };

    if (S(poll).contains('PM10 ENV')) {
      aiq.type = 'industriale';
      isUrban = false;
      aiq.limit = 50;
    };

    if (S(poll).contains('IPA')) {
      aiq.type = 'industriale';
      isUrban = false;
      aiq.limit = 10;
    };

    if (S(poll).contains('PM2.5 SWAM')) {
      aiq.type = 'industriale';
      isUrban = false;
      aiq.limit = 50;
    };

    if (S(poll).contains('PM10 SWAM')) {
      aiq.type = 'industriale';
      isUrban = false;
      aiq.limit = 50;
    };

    if (S(poll).contains('PM10 B')) {
      aiq.type = 'industriale';
      isUrban = false;
      aiq.limit = 50;
    };

    if (S(poll).contains('H2S')) {
      aiq.type = 'industriale';
      isUrban = false;
      aiq.limit = 10;
    };

    if (isUrban) {
      aiq.warning = 0;
      aiq.limit = 0;
      aiq.value = ((ihigh - ilow) / (chigh - clow)) * (value - clow) + ilow;
    } else {

      // inquinante industriale, calcolo il valore oltre il limite consentito
      // PM10 ENV (50)
      // BLACK CARB (50)
      // IPA (10)
      // PM2.5 SWAM 
      // PM10 SWAM
      // PM10 B
      // H2S (10)
      aiq.warning = parseFloat(aiq.realvalue / aiq.limit);
      aiq.value = parseFloat(aiq.warning * 100);

    };

    // set colors
    if (aiq.value > 0) {
      if (aiq.value <= 50) {
        aiq.color = '#37e400';
        aiq.text = 'good';
        aiq.level = 1;
      } else if (aiq.value <= 100 ) {
        aiq.color = '#ffff01';
        aiq.text = 'moderate';
        aiq.level = 2;
      } else if (aiq.value <= 150 ) {
        aiq.color = '#fb7e01';
        aiq.text = 'unhealthy for Sensitive Groups';
        aiq.level = 3;
      } else if (aiq.value <= 200 ) {
        aiq.color = '#fa1100';
        aiq.text = 'unhealthy';
        aiq.level = 4;
      } else if (aiq.value <= 300 ) {
        aiq.color = '#99024c';
        aiq.text = 'Very Unhealthy'; 
        aiq.level = 5; 
      } else if (aiq.value <= 400 ) {
        aiq.color = '#7e0322';
        aiq.text = 'Hazardous';
        aiq.level = 6;
      } else if (aiq.value <= 500 ) {
        aiq.color = '#660000';
        aiq.text = 'Hazardous';
        aiq.level = 7;
      } else {
        aiq.color = '#000000';
        aiq.text = 'Run!! Very Dangerous.';
        aiq.level = 8;
      };
    };
  };

  // console.log('callback color: ' + JSON.stringify(aiq));

  callback(aiq);

};