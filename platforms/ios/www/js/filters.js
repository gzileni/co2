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
// airQ App - Filters
//
//

var filters = angular.module('airq.filters', []);

filters.filter('unique', function() {
    return function (arr, field) {
        return _.uniq(arr, function(a) { 
          return a[field]; 
        });
    };
});

filters.filter("location", function () {

  return function (input) {

    var location; 
    if (typeof input === 'undefined') {
      location = ' ';
    } else {
      location = input.address + ',' + input.city;
    };

    return location;

  };

});

filters.filter("last", function () {

  return function (input) {

    var l = Math.round((1 - input) * 100);

    if (isNaN(l)) {
      return ' ';
    } else {
      return ' (' + l + ' %)';
    }

  };

});

filters.filter("polluting", function (_, Polluting) {

  return function (input) {

    var polluting = _.find(Polluting, function (item) {
      return item.name === input;
    });

    var poll_descr = ''

    if (typeof polluting !== 'undefined') {
      poll_descr = polluting.description;
    };

    return poll_descr;
  };

});

filters.filter("polluting_link", function (_, Polluting) {

  return function (input) {

    var polluting = _.find(Polluting, function (item) {
      return item.name === input;
    });

    var poll_descr = ''

    if (typeof polluting !== 'undefined') {
      poll_descr = polluting.link;
    };

    return poll_descr;
  };

});

filters.filter("polluting_element", function (_, Polluting) {

  return function (input) {

    var polluting = _.find(Polluting, function (item) {
      return item.name === input;
    });

    var poll_descr = ''

    if (typeof polluting !== 'undefined') {
      poll_descr = polluting.element;
    };

    return poll_descr;
  };

});

filters.filter("weather_data", function ($moment) {
  return function (input) {

    return $moment.unix(input).format('DD/MM/YYYY HH:mm');
 
  }
});

filters.filter("distance", function (Geolocation, GeoJSON) {
  return function (input) {

    var distance = '';

    // console.log('check distace: ' + JSON.stringify(input));

    if (typeof input !== 'undefined') {
      var location = Geolocation.location();
      var distance = Math.round(GeoJSON.distance(location.latitude, location.longitude, input.latitude, input.longitude)) + ' Km';
    };

    return distance;
 
  }
});

filters.filter("wind", function () {
  return function (input) {

    var speed = '';
    
    var directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    speed = input.speed + ' m/s';

    var degree;

    if (parseFloat(input.deg) > 338) {
      degree = 360 - parseFloat(input.deg);
    } else {
      degree = parseFloat(input.deg);
    };

    var index = Math.floor((degree + 22) / 45);
    var dir = directions[index];

    // { "speed": 2.74, "deg": 159.001 }

    return dir + ' ' + speed;
 
  }
});

filters.filter("weather", function () {

  var host = 'http://openweathermap.org/img/w/';
  var icon = '';

  return function (input) {

    if (input[0].id >= 200 && input[0].id <= 232) {
      icon = '11d.png';
    };

    if ((input[0].id >= 300 && input[0].id <= 321) || (input[0].id >= 520 && input[0].id <= 531)) {
      icon = '09d.png';
    };

    if (input[0].id >= 500 && input[0].id <= 504) {
      icon = '10d.png';
    };

    if ((input[0].id == 511) || (input[0].id >= 600 && input[0].id <= 622)) {
      icon = '13d.png';
    };

    if ((input[0].id >= 701 && input[0].id <= 781)) {
      icon = '50d.png';
    };

    if ((input[0].id >= 701 && input[0].id <= 781)) {
      icon = '50d.png';
    };

    if (input[0].id == 800) {
      icon = '01d.png';
    };

    if (input[0].id == 801) {
      icon = '02d.png';
    };

    if (input[0].id == 802) {
      icon = '03d.png';
    };

    if ((input[0].id >= 803 && input[0].id <= 804)) {
      icon = '04d.png';
    };

    return host + icon;

  }
});

filters.filter("level_descr", function (_, Level) {
  
  return function (input) {

    var l = _.find(Level.items, function (item) {
      return item.level === input;
    });

    if (typeof l === 'undefined') {
      return Level.items[0].name;
    } else {
      return l.name;   
    };
     
  }
});

filters.filter("level_colors", function (Level) {
  return function (input) {
    if (typeof input !== 'undefined') {
      return Level.getColors();
    };  
  }
});

filters.filter("level_sector", function (Level) {
  return function (input) {
    if (typeof input !== 'undefined') {
      return Level.getSectors();
    };  
  }
});

filters.filter("level_image", function (Level) {
  return function (input) {

    // console.log('level color: ' + input);
    var image = '';

    if (typeof input !== 'undefined') {
      var l = _.find(Level.items, function (item) {
        return item.level === input;
      });

      if (typeof l !== 'undefined') {
        image = l.image;
      } else {
        image = Level.items[0].image;
      }
    };

    return image;

  }
});