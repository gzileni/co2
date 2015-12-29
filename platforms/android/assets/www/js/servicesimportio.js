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
// airQ App - Service ImportIO Library
//
//

var service = angular.module('airq.servicesimportio', []);

service.factory('Import', function (IMPORT, _, $moment, $http, async, S, AirQuality, Stations, pdb, Geolocation, GeoJSON, UTILITY, DB, HISTORY) {

	var data_response = [];
	var db;
	var isDb = false;

	var data_json = {
    	source: {
      		url: 'http://www.arpa.puglia.it/web/guest/qariainq',
      		id: 'ARPA Puglia',
      		date: ''
    	},
    	dataset: []
	};

	var data_db = {
		_id: '',
		_rev: '',
		data: null
	};

	var importio_json = {

		history: function (city, polluting, days, callback_service, callback_message, callback_error) {

			var url = HISTORY.url + '&callback=JSON_CALLBACK&polluting=' + encodeURI(polluting) + '&comune=' + city + '&giorni=' + days;

			console.log('getting data by: ' + url);

			var options = {
            	method: 'GET',
            	url: url,
            	dataType: 'jsonp',
            }

			$http(options)
            	.success(function (data) {
            	//handle success
            	console.log('Error data type: ' + JSON.stringify(data.errorType));
            	if (typeof data.errorType !== 'undefined') {
            		_error_load_importio(data, status, headers, config, null, callback_error, 'non riesco a leggere i dati storici. Riprova più tardi.');
            	} else {
            		console.log(JSON.stringify(data));
                };
            }).error(function (data, status, headers, config) {
            	_error_load_importio(data, status, headers, config, null, callback_error, 'non riesco a leggere i dati storici. Riprova più tardi.');
            });

		},

		exec: function (data, callback_service, callback_message, callback_error) {
			
			if (typeof callback_message === 'function') {
		    	callback_message('inizio ottimizzazione dati ...');
			};

			console.log('Data: ' + JSON.stringify(data));

			async.series([
				
				/////////////////////////////////////////
			    // 
			    // armonizzazione dei dati
  				
  				function (callback_root) {

  					var isSync = false;
					var i = 0;
					var poll = '';
					var provincia = '';

					console.log('optimizing data n.' + _.size(data_db.data));
					// console.log('optimizing data ' + JSON.stringify(data_db.data))

					if (typeof callback_message === 'function') {
						callback_message('ottimizzo n.' + _.size(data) + ' dati.');
					};

					async.each(data, function (item, callback) {

				    	// console.log('Reading data: ' + JSON.stringify(item));

					    var data_item = {
					      station: item.item.station,
					      city: item.item.comune,
					      state: item.item.provincia,
					      value: parseFloat(item.item['valore/_source']),
					      day: parseInt(item.item.giorni),
					      aiq: {},
					      polluting: item.inquinante,
					      location: {
					        latitude: 0,
					        longitude: 0
					      },
					      data: data_json.source.date
					    };

					    var filter_text = '..';

				        if (typeof item.item.centralina !== 'undefined') {
				        	if (S(item.item.centralina).contains(filter_text)) {
				          		data_item.station =  S(S(item.item.centralina).strip(filter_text).s).trim().s;
				        	} else {
				          		data_item.station = S(item.item.centralina).trim().s;
				        	};
				      	};

					    if (typeof callback_message === 'function') {
					      	var message = data_item.polluting + ': ' + data_item.city;
							callback_message(message, i++);
						};

					    data_json.dataset.push(data_item);

					    callback();

		  			}, function (err) {
		  				callback_root(err, 'next');
		  			});
					
  				},

  				/////////////////////////////////////////
			    // 
			    // calcolo la qualità dell'aria
			      
			    function (callback_root) {

			    		if (typeof callback_message === 'function') {
			    			callback_message('calcolo la qualità dell\'aria');
						};

				    	console.log('start calculating air quality ...');
					  	async.each(data_json.dataset, function (item, callback) {
					    	AirQuality.get(item.polluting, item.value, function (aiq_data) {
					      		item.aiq = aiq_data;
					      		callback(false, 'next'); 
					    	});
					  	}, function (err) {
					    	callback_root(err, 'next');
					  	});
					
			    },

			    /////////////////////////////////////////
			    // 
			    // leggo le coordinate delle stazioni ARPA
			      
			    function (callback_root) {

		    		console.log('init setting locations airq ...');

        			if (typeof callback_message === 'function') {
		    			callback_message('leggo la posizione delle stazioni');
					};
        
			        Stations.get(data_json.dataset, function (err, data) {
			          	data_json.dataset = data;
			          	console.log('founded n.' + _.size(data) + ' stations.');
			        	callback_root(err, 'done');
			        });
				     

			    }], 

			    /////////////////////////////////////////
			    // ---- END
			    // fine dell'import dei dati
			    
			    function (err, results) {
		    		if (typeof callback_service === 'function') {
						callback_service(err, data_json);
					};
  				});
		},

        // carico gli utlimi dati per calcolar la variazione ai dati attuali
		last: function (days, callback_service) {
			var nDays;	// controllo solo i dati negli ultimi sette giorni
			var data_response = null;

			if (days > 7) {
				nDays = 7;
			} else {
				nDays = days;
			};

			pdb.open(DB.name, function (db_istance) {
				
				db = db_istance;

				var array_last = [];
				var i = 1;

				for (i = 1; i <= nDays; i++) {
					var id_last = moment().subtract(i, 'days').format("YYYYMMDD");
					array_last.push(id_last);
				};

				async.each(array_last, function (item, callback) {
					console.log('check: ' + item);
					
					pdb.get(db, item, function (err, data_last) {
						// console.log('data readed: ' + JSON.stringify(data_last));
						if (!err && data_response == null) {
							data_response = data_last;
							// console.log('data founded: ' + JSON.stringify(data_response));
						};
						callback();
					});

				}, function (err) {
					if (data_response == null) {
						console.log('archivio vuoto');
						importio_json.start(callback_service);	
					} else {
						console.log('sono stati trovati dati precedenti');
						if (typeof callback_service === 'function') {
							callback_service(err, data_response);
						};
					};
				});
			});
		},

		sort: function (data, callback_service) {
			var location = Geolocation.location();

			if (location.latitude == 0 && location.longitude == 0) {
				var data_sorted = data;
			} else {
				var data_sorted = _.sortBy(data, function (item) {
	      			// console.log('item sorted: ' + JSON.stringify(item));
	      			return GeoJSON.distance(location.latitude, location.longitude, item.location.latitude, item.location.longitude);
	    		});
			};

    		if (typeof callback_service === 'function') {
    			callback_service(data_sorted);
    		};

		},

		// crea legge i dati
		start: function (force, callback_service, callback_message, callback_error) {

			// var date_now = $moment().format("YYYYMMDD");
  			// tag = date_now;

  			// se i dati non esistono allora bisogna crearli

  			async.series([

  				/////////////////////////////////////////
			    // 
			    // cancello il database

  				function (callback_root) {

  					if (force) {
  						pdb.close(DB.name, function (err) {
  							console.log('cancello di database');
  							callback_root(err, 'next');
  						});  					
  					} else {
  						callback_root(false, 'next');
  					}
  				},

  				/////////////////////////////////////////
			    // 
			    // apro il database
  				
			    function (callback_root) {

			    	console.log('apro il database');
			    	
			    	if (typeof callback_message === 'function') {
						callback_message('connessione ai dati ...');
					};

			    	// controllo il database dei dati
  					pdb.open(DB.name, function (db_istance) {
  						db = db_istance;
  						console.log('db opened.');
  						callback_root(false, 'next');
  					});
			    },

			    /////////////////////////////////////////
			    // 
			    // leggo il documento
  				
			    function (callback_root) {

		    		if (typeof callback_message === 'function') {
						callback_message('reading data ...');
					};

			    	pdb.get(db, DB._id, function(err, data) {
			    		if (!err) {
			    			console.log('documento trovato.');
			    			data_db.data = data.data;
			    			// console.log(JSON.stringify(data_db.data));
			    			callback_root(false, 'next');
			    			isDb = !force;
			    		} else {
			    			console.log('non ho trovato il documento.');
			    			callback_root(false, 'next');
			    			isDb = false;
			    		};
			    	});
			    },

			    /////////////////////////////////////////
			    // 
			    // scraping dei dati
  				
  				function (callback_root) {

  					if (!isDb) {

  						if (typeof callback_message === 'function') {
							callback_message('Leggo i dati dalle centraline ARPA. Potrebbe richiedere un pò di tempo.');
						};
	  				
	  					data_db._id = DB._id;

						// carico i dati da importio
						async.each(IMPORT.curls, function (item, callback) {
							
							$http(item)
                            	.success(function (data, status, headers, config) {

                            		//handle success
				            		console.log('Error data type: ' + JSON.stringify(data.errorType));
				            		
				            		if (typeof data.errorType !== 'undefined') {
				            			_error_load_importio(data, status, headers, config, callback, callback_error, 'non riesco a leggere i dati dalle centraline ARPA. Riprova più tardi.');
				            		} else {

				            			if (typeof callback_message === 'function') {
											callback_message('Preparo i dati importati.');
										};

				            			_create_data(async, data.results, function (err, d, data) {
				            				// console.log('Data: ' + JSON.stringify(d));
				            				data_response = _.union(data_response, d);
				            				console.log('data: ' + data);
				            				data_json.source.date = data; 
                                			console.log('data loaded.');
                                			callback();
				            			});
                                	};

                            }).error(function (data, status, headers, config) {
                            	_error_load_importio(data, status, headers, config, callback, callback_error, 'non riesco a leggere i dati dalle centraline ARPA. Riprova più tardi.');
                            });

						}, function (err) {

							if (!err) {
								// salvo i dati nel database
								if (!isDb) {
									
									if (typeof callback_message === 'function') {
										callback_message('Salvo i dati importati.');
									};

									// console.log(JSON.stringify(data_response));
									data_db.data = data_response;

									// console.log(JSON.stringify(data_db.data));

									pdb.put(db, data_db, function (err, response) {
										//console.log('Response: ' + JSON.stringify(response));
										console.log('saved to db -> Err: ' + err + ' Response:' + JSON.stringify(response));
										callback_root(false, 'next');
									});
								};
							} else {
								// errore to load data
								if (typeof callback_error === 'function') {
									callback_error('non riesco a leggere i dati dalle centraline ARPA. Riprova più tardi.');
									callback_root(true, 'next');
								};
							}
						});
					} else {
						// dati nel database
						callback_root(false, 'next');	
					}
  				}, 

  				/////////////////////////////////////////
			    // 
			    // filtro i dati
  				
  				function (callback_root) {

					if (typeof callback_message === 'function') {
		    			callback_message('filtro i dati');
					};

			        console.log('Filtering data ... ');
		        	
		        	var data_filtered = _.filter(data_db.data, function(item){ 
		            	
		            	var isStation = S(item.item.centralina).isEmpty();
		        		var v = parseFloat(item.item['valore/_source']);

		            	return !isStation && 
		            		   !isNaN(v) &&
		            		   v > 0;	  
		          	});

		          	console.log('-- data filtered n. ' + _.size(data_filtered) + '/' + _.size(data_db.data));
				    
		          	var data_uniq = _.uniq(data_filtered);

		          	console.log('-- data uniq n. ' + _.size(data_uniq) + '/' + _.size(data_filtered));
				    
		          	data_db.data = data_uniq;
		          	    
				    callback_root(false, 'next');

			    }], 

			    /////////////////////////////////////////
			    // ---- END
			    // fine scraping dei dati
			    // inizio ottimizzazione dei dati
			    
			    function (err, results) {
			    	importio_json.exec(data_db.data, callback_service, callback_message, callback_error);
  				});
		}
	};

	return importio_json;

});

function _create_data(async, data, callback_root) {

	var data_result = [];
	var inquinante;
	var isData = false;
	var data;

	async.each(data, function (item, callback) {

		// console.log(JSON.stringify(data));

		if (typeof item.data !== 'undefined') {
			data = item.data;
		} else if (typeof item.inquinante !== 'undefined') {
			isData = true;
			inquinante = S(S(item.inquinante).strip('Inquinante:').s).trim().s;
		} else {
			if (isData) {
				var i = {
					inquinante: inquinante,
					item: item
				};

				data_result.push(i);
			};
		};

		callback();

	}, function (err) {
		callback_root(err, data_result, data);
	});

}

function _error_load_importio(data, status, headers, config, callback, callback_error, message) {
	//handle error.
	console.log('error to load data.');
	
	if (typeof callback_error === 'function') {
		callback_error(message);
	};

	if (typeof callback === 'function') {
		callback(true);
	};
}; 
