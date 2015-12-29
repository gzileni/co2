/**
 * Import.io JavaScript Client Library
 * 
 * Copyright 2013 Import.io
 */
var importio = (function($) {
	
	//******************************
	//********** Private classes ***
	//******************************
	
	$(document).ajaxSend(function (event, xhr, settings) {
		settings.xhrFields = {
			withCredentials: true
		};
	});
	
	// Encapsulates a query
	var q = function($, config, query, deferred, callbacks, sys_finished) {

		// Setup the ID
		var id = ((new Date()).getTime()) + (Math.random() * 1e19);
		
		// Whether or not finished
		var finished = false;
		
		// Count the messages
		var messages = 0;
		
		// Whether initialising
		var initialising = false;
		
		// Array of results returned
		var results = [];
		
		// Timeout function
		var timer = false;
		
		// Count the pages
		var pages = {
			"queued": 0,
			"started": 0,
			"completed": 0
		};
		
		// Return the ID to the user
		function getId() {
			return id;
		}
		
		// Start function to begin the query
		function start() {
			if (config.hasOwnProperty("auth")) {
				var auth = config.auth;
				if (auth instanceof Object && config.auth.hasOwnProperty("userGuid") && config.auth.hasOwnProperty("apiKey")) {
					// Internally signed query
					var extraTime = 300;
					if (config.auth.hasOwnProperty("validPeriod")) {
						extraTime = config.auth.hasOwnProperty("validPeriod");
					}
					
					var orgGuid = "00000000-0000-0000-0000-000000000000";
					if (config.auth.hasOwnProperty("orgGuid")) {
						orgGuid = config.auth.hasOwnProperty("orgGuid");
					}
					
					// Internally sign query
					doStart("signed_query", sign(query, config.auth.userGuid, orgGuid, config.auth.apiKey, extraTime));
					
					return;
					
				} else if (auth instanceof Function) {
					// Is a function so call that, with the callback
					return auth(query, function(newQuery) {
						doStart("signed_query", newQuery);
					});
				} else if (typeof auth === "string") {
					// Is a URL, so POST to it
					return $.post(auth, JSON.stringify(query), function(data) {
						doStart("signed_query", data);
					}, "json");
				}
			}
			// No other auth specified, do cookie
			doStart("query", query);
		}
		
		// The start callback
		function doStart(type, query) {
			query.requestId = id;
			$.cometd.publish("/service/" + type, query);
			if (callbacks && callbacks.hasOwnProperty("start") && typeof callbacks.start == "function") {
				callbacks.start();
			}
			timer = setTimeout(function() {
				if (!finished) {
					// Has timed out, so want to fail
					error({
						"data": {
							"errorType": "TIMEOUT",
							"data": "Timed out."
						}
					});
				}
			}, config.timeout * 1000);
		}
		
		// Do local signing
		function sign(query, userGuid, orgGuid, apiKey, extraTime) {
		    
		    var signed_query = {
				queryJson: JSON.stringify(query),
				expiresAt: new Date().getTime() + (extraTime * 1000),
				userGuid: userGuid,
				orgGuid: orgGuid
			};
		    
		    var check = signed_query.queryJson
		    			+ ":" + signed_query.userGuid
		    			+ ((signed_query.orgGuid == "00000000-0000-0000-0000-000000000000") ? "" : (":" + signed_query.orgGuid))
		    			+ ":" + signed_query.expiresAt;
		    signed_query.digest = CryptoJS.HmacSHA1(check, CryptoJS.enc.Base64.parse(apiKey)).toString(CryptoJS.enc.Base64);
		    
		    return signed_query;
		}
		
		// Receive message callback
		function receive(msg) {
			var message = msg.data;

			finished = false;
			
			if (message.type == "INIT") {
				initialising = true;
			} else if (message.type == "START") {
				pages.started++;
			} else if (message.type == "SPAWN") {
				pages.queued++;
				progress();
			} else if (message.type == "STOP") {
				if (initialising) {
					initialising = false;
				} else {
					pages.completed++;
					progress();
				}
				finished = (pages.queued == pages.completed);
			} else if (message.type == "MESSAGE") {
				messages++;
				if (message.data.hasOwnProperty("errorType")) {
					warning(message);
				} else {
					data(message);
				}
			} else if (message.type == "UNAUTH") {
				error(message);
				finished = true;
			} else if (message.type == "ERROR") {
				error(message);
				finished = true;
			}
			
			if (callbacks && callbacks.hasOwnProperty("message") && typeof callbacks.message == "function") {
				callbacks.message(message);
			}
			
			if (finished) {
				done();
			}
			
		}

		// Handles a warning from the server
		function warning(message) {
			if (callbacks && callbacks.hasOwnProperty("warning") && typeof callbacks.warning == "function") {
				callbacks.warning(message.data.errorType, message.data.error);
			}
		}
		
		// Handles an error condition
		function error(message) {
			deferred.reject(message.data.errorType, message.data.data);
		}
		
		// Handles progress changes
		function progress() {
			var percent = 0;
			if (pages.queued > 0) {
				percent = Math.round((pages.completed / pages.queued) * 100);
			}
			deferred.notify(percent, pages.completed, pages.queued);
		}
		
		// Handles data events
		function data(message) {
			var res = message.data.results;
			for (var i in res) {
				res[i] = {
					"data" : res[i],
					"connectorGuid": message.connectorGuid,
					"connectorVersionGuid": message.connectorVersionGuid,
					"pageUrl": message.data.pageUrl,
					"cookies": message.data.cookies,
					"offset": message.data.offset
				};
			}
			results = results.concat(res);

			if (callbacks && callbacks.hasOwnProperty("data") && typeof callbacks.data == "function") {
				callbacks.data(res);
			}
		}
		
		// Handles done events
		function done() {
			if (timer) {
				clearTimeout(timer);
			}
			deferred.resolve(results);
			sys_finished(id);
		}
		
		// Return the public interface
		return {
			receive: receive,
			getId: getId,
			start: start
		};
		
	};
	
	//******************************
	//********** Private variables *
	//******************************

	// Whether or not the API has been initialised
	var initialised = false;
	var initialising = false;
	
	// Comet state
	var comet = {
		"started": false,
		"connected": false,
		"wasConnected": false,
		"disconnecting": false,
		"callbacks": {
			"established": function() {
				doConnectionCallbacks({"channel": "/meta", "data": { "type": "CONNECTION_ESTABLISHED" } });
			},
			"broken": function() {
				doConnectionCallbacks({"channel": "/meta", "data": { "type": "CONNECTION_BROKEN" } });
			},
			"closed": function(multipleClients) {
				var reason = multipleClients ? "MULTIPLE_CLIENTS" : "UNKNOWN";
				doConnectionCallbacks({"channel": "/meta", "data": { "type": "CONNECTION_CLOSED", "reason": reason } });
			},
			"connected": function() {
				doConnectionCallbacks({"channel": "/meta", "data": { "type": "CONNECTED" } });
			},
			"connect": cometConnectFunction,
			"handshake": function(message) {
				if (message.successful) {
					$.cometd.subscribe('/messaging', function receive(message) {
							var query = queries[message.data.requestId];
							if (!query) {
								doConnectionCallbacks({"channel": "/meta", "data": { "type": "NO_QUERY", "id": message.data.requestId } });
								return;
							}
							query.receive(message);
					});
					doConnectionCallbacks({"channel": "/meta", "data": { "type": "SUBSCRIBED" } });
				}
			}
		}
	};
	
	// Track of the current queries
	var queries = {};
	
	// Default configuration
	var defaultConfiguration = {
		"host": "import.io",
		"hostPrefix": "",
		"randomHost": true,
		"port": false,
		"logging": false,
		"https": true,
		"connectionCallbacks": [log],
		"timeout": 60
	};
	
	// Store the current configuration
	var currentConfiguration = {};
	for (var k in defaultConfiguration) {
		currentConfiguration[k] = defaultConfiguration[k];
	}

	// Queue of functions to be called after initialisation
	var initialisationQueue = [];
	
	// Cache of the endpoint to hit in this session
	var endpoint = false;
	
	//******************************
	//********** Private methods ***
	//******************************
	
	// Checks the class has been initialised
	function checkInit(fn) {
		if (!initialised) {
			if (fn) {
				initialisationQueue.push(fn);
			}
			if (!initialising) {
				// Not initialising and not initialised, so start
				init();
			}
		} else {
			// We are already initialised, so run it
			if (fn) {
				fn();
			}
		}
	}
	
	// Helper to callback the connection callbacks
	var doConnectionCallbacks = function(obj) {
		for (var i = 0; i < currentConfiguration.connectionCallbacks.length; i++) {
			try {
				currentConfiguration.connectionCallbacks[i](obj);
			} catch (e) {
				log("Error calling callback " + e);
			}
		}
	}
	
	// Generates a random domain endpoint
	function randomDomain() {
	    var domain = "";
	    var options = "abcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < 30; i++ ) {
	    	domain += options.charAt(Math.floor(Math.random() * options.length));
	    }

	    return domain;
	}
	
	// Return the comet endpoint
	function getCometEndpoint() {
		if (endpoint) {
			return endpoint;
		}
		checkInit();
		
		// Max length of the prefix the user specifies = 20 (+1) characters
		var prefix = currentConfiguration.hostPrefix;
		prefix = prefix.length > 20 ? prefix.substring(0, 20) : prefix;
		prefix = prefix.length > 0 ? prefix + "-" : "";
		
		// Get the domain of the page, but only if it exists = 20 (+1) characters
		var domain = (window.location.hostname ? window.location.hostname.replace(/\./g, "") : "");
		domain = domain.length > 20 ? domain.substring(0, 20) : domain;
		domain = domain.length > 0 ? domain + "-" : "";
		
		// Generate the special subdomain, from the user's prefix + the domain + the random string = 21 + 21 + 20 = 62
		var specialHost = prefix + domain + randomDomain();
		
		// Generate the entire host, the special subdomain + the configured query server
		var host = currentConfiguration.randomHost ? specialHost + ".query." + currentConfiguration.host : "query." + currentConfiguration.host;
		
		var port = currentConfiguration.port;
		if (!currentConfiguration.port) {
			if (currentConfiguration.https) {
				port = 443;
			} else {
				port = 80;
			}
		}
		
		var protocol = "http" + (currentConfiguration.https ? "s": "");
		
		endpoint = protocol + "://" + host + ":" + port + "/query/comet";
		
		return log(endpoint);
	}
	
	// Log some output, if allowed; returns content irrespective of logging
	function log(content) {
		checkInit();
		if (currentConfiguration.logging && window.console && console.log) {
			console.log(content);
		}
		return content;
	}

	// Starts up CometD
	function startComet() {
		if (comet.started) {
			return;
		}
		
		// Setup Comet
		$.cometd.websocketEnabled = false;
		$.cometd.configure({
				url: getCometEndpoint(),
				logLevel: currentConfiguration.logging ? "debug" : "warn",
				autoBatch: true
		});
		$.cometd.handshake();
	
		// Add callbacks
		$.cometd.addListener('/meta/handshake', comet.callbacks.handshake);
		$.cometd.addListener('/meta/connect', comet.callbacks.connect);

		// Add in debugging to help developers figure out what went wrong
		$.cometd.onListenerException = function(exception, subscriptionHandle, isListener, message) {
			if (currentConfiguration.logging && window.console && console.error) {
				console.error("Unable to call listener, exception thrown", { "exception": exception, "subscriptionHandle": subscriptionHandle, "isListener": isListener, "message": message });
			}
		}
		
		comet.started = true;
	}
	
	// Comet connect callback
	function cometConnectFunction(message) {
		comet.wasConnected = comet.connected;
		comet.connected = (message.successful === true);
		if (!comet.wasConnected && comet.connected) {
			comet.callbacks.connected();
			initCB();
		} else if (comet.wasConnected && !comet.connected) {
			comet.callbacks.broken();
		} else if (!comet.connected) {
			comet.callbacks.closed(message.advice["multiple-clients"]);
		}
	}
	
	// Takes user callbacks for a query and normalises them
	function augmentDeferred(deferred, callbacks) {
		if (typeof callbacks === "undefined" || !callbacks) {
			return deferred;
		}
		if (callbacks instanceof Function) {
			// If it is just a function
			deferred.done(callbacks);
		} else if (callbacks instanceof Array) {
			// It is an array, presumably of functions
			deferred.done(callbacks);
		} else {
			// It will be an object already, need to make sure the right ones are in
			var promise = deferred.promise();
			for (var name in callbacks) {
				if (promise.hasOwnProperty(name) && promise[name] instanceof Function) {
					promise[name](callbacks[name]);
				}
			}
		}
		return deferred;
	}
	
	// Callback for when initialisation is complete
	function initCB() {
		initialised = true;
		initialising = false;
		for (var i in initialisationQueue) {
			initialisationQueue[i]();
		}
	}
	
	//******************************
	//********** Public methods ****
	//******************************
	
	// Allows a user to initialise the library, returns the final configuration
	function init(c) {
		
		initialising = true;
		
		// If no configuration, use the default
		if (typeof c === "undefined") {
			c = defaultConfiguration;
		} else {
			// Provided configuration, check it has the defaults
			for (var def in defaultConfiguration) {
				if (defaultConfiguration.hasOwnProperty(def) && !c.hasOwnProperty(def)) {
					c[def] = defaultConfiguration[def];
				}
			}
		}

		// Special case for the connectionCallbacks
		if (Object.prototype.toString.call(c.connectionCallbacks) !== '[object Array]') {
			c[connectionCallbacks] = [c.connectionCallbacks];
		}
		
		// Save configuration
		currentConfiguration = c;		

		// Start up cometd
		startComet();
		
		return log(currentConfiguration);
	}

	// Adds a connection callback to the list
	function addConnectionCallback(fn) {
		if (fn && typeof fn == "function") {
			currentConfiguration.connectionCallbacks.push(fn);
		}
	}
	
	// Allows a user to start off a query
	function query(query, callbacks) {
		var deferred = $.Deferred(false);
		deferred = augmentDeferred(deferred, callbacks);
		// Make the CBs go into the promise
		checkInit(function() {
			var qobj = new q($, currentConfiguration, query, deferred, callbacks, function(id) {
				delete queries[id];
			});
			queries[qobj.getId()] = qobj;
			qobj.start();
		});
		return deferred.promise();
	}
	
	// Allows a user to ask about the default config options
	function getDefaultConfiguration() {
		return defaultConfiguration;
	}
	
	function getConfiguration() {
		var ret = {};
		for (var k in currentConfiguration) {
			ret[k] = currentConfiguration[k];
		}
		return ret;
	}

	function setConfigurationProperty(property, value) {
		currentConfiguration[property] = value;
	}

	// Returns an API endpoint
	function getEndpoint(path, notCrossDomain) {
		var port = currentConfiguration.port;
		if (!currentConfiguration.port) {
			if (currentConfiguration.https) {
				port = 443;
			} else {
				port = 80;
			}
		}

		// Detect CORS support
		if ("withCredentials" in new XMLHttpRequest() && !notCrossDomain) {
			return "http" + (currentConfiguration.https ? "s": "") + "://api." + currentConfiguration.host + ":" + port + (path ? path : "");
		} else {
			return "/~api" + (path ? path : "");
		}
	}
	
	function doAjax(method, path, parameters, standardPost) {
		var config = {
			"type": method,
			"dataType": "json"
		}

		var parameters = parameters || {};
		var extraParams = {};
		var hasExtras = false;
		var auth = currentConfiguration.auth;
		if (auth instanceof Object && auth.hasOwnProperty("userGuid") && auth.hasOwnProperty("apiKey")) {
			extraParams = { "_user": auth.userGuid, "_apikey": auth.apiKey };
			hasExtras = true;
		}

		if (method == "GET" || method == "HEAD") {
			if (hasExtras) {
				parameters._user = extraParams._user;
				parameters._apikey = extraParams._apikey;
			}
			path += objToParams(parameters, "?");
		} else {
			if (standardPost) {
				config.data = parameters;
			} else {
				config.contentType = parameters ? "application/json" : undefined;
				config.data = parameters ? JSON.stringify(parameters) : undefined;
			}
			if (hasExtras) {
				path += objToParams(extraParams, "?");
			}
		}
		return $.ajax(getEndpoint(path), config);
	}

	function objToParams(params, existPrefix) {
		var p = "";
		if (params) {
			var append = [];
			for (var k in params) {
				if (params.hasOwnProperty(k)) { // Check param is valid
					if (params[k]) { // Skip if its undefined or falsey
						if (!(params[k] instanceof Array)) { // Convert to array in case there is only one
							params[k] = [params[k]]
						}
						params[k].map(function(p) {
							append.push(k + "=" + encodeURIComponent(p)); // Push each one on to the list
						})
					}
				}
			}
			if (append.length) {
				p += (existPrefix ? existPrefix : "") + append.join("&");
			}
		}
		return p;
	}

	// API aliasing
	function bucket(b) {
		var bucketName = b;
		var iface = {
			"search": function(term, params, searchSuffix) {
				var path = "/store/" + bucketName +  (searchSuffix || "/_search");
				if (!params) {
					params = {};
				}
				params.q = term;
				if (bucketName.toLowerCase() != "connector") {
					return doAjax("GET", path, params);
				} else {
					var p = $.Deferred();

					doAjax("GET", path, params).then(function(data) {
						var getGuids = {};
						data.hits.hits.map(function(entry) {
							if (entry.fields.hasOwnProperty("parentGuid") && entry.fields.parentGuid) {
								getGuids[entry.fields.parentGuid] = entry._id;
							}
						});
						if (Object.keys(getGuids).length) {
							iface.get({ "id": Object.keys(getGuids) }).then(function(parents) {
								parents.map(function(parent) {
									data.hits.hits.map(function(result) {
										if (result.fields.hasOwnProperty("parentGuid") && result.fields.parentGuid == parent.guid) {
											for (var k in parent) {
												if (!result.fields.hasOwnProperty(k) && k != "guid") {
													result.fields[k] = parent[k];
												}
											}
										}
									});
								});
								p.resolve(data);
							}, p.reject);
						} else {
							p.resolve(data);
						}
					}, p.reject);

					return p.promise();
				}
			},
			"list": function(key, val, offset) {
				var params = {
					"index": key,
					"index_value": val
				}
				if (offset) {
					params["index_offset"] = [val, offset];
				}
				var path = "/store/" + bucketName;
				return doAjax("GET", path, params);
			},
			"get": function(params) {
				if (bucketName.toLowerCase() != "connector") {
					return doAjax("GET", "/store/" + bucketName, params);
				} else {
					var p = $.Deferred();

					doAjax("GET", "/store/" + bucketName, params).then(function(data) {
						var getGuids = {};
						data.map(function(entry) {
							if (entry.hasOwnProperty("parentGuid") && entry.parentGuid) {
								getGuids[entry.parentGuid] = entry._id;
							}
						});
						if (Object.keys(getGuids).length) {
							iface.get({ "id": Object.keys(getGuids) }).then(function(parents) {
								parents.map(function(parent) {
									data.map(function(result) {
										if (result.hasOwnProperty("parentGuid") && result.parentGuid == parent.guid) {
											for (var k in parent) {
												if (!result.hasOwnProperty(k) && k != "guid") {
													result[k] = parent[k];
												}
											}
										}
									});
								});
								p.resolve(data);
							}, p.reject);
						} else {
							p.resolve(data);
						}
					}, p.reject);

					return p.promise();
				}
			},
			"object": function(g) {
				var guid = g;
				function doObjectAjax(method, params, overwriteGuid) {
					var theGuid = overwriteGuid || guid;
					var path = "/store/" + bucketName + (theGuid ? "/" + theGuid : "");
					return doAjax(method, path, params);
				}
				var iface = {
					"get": function() {
						if (bucketName.toLowerCase() != "connector") {
							return doObjectAjax("GET");
						} else {
							var p = $.Deferred();

							doObjectAjax("GET").then(function(data) {
								if (data.hasOwnProperty("parentGuid") && data.parentGuid) {
									doObjectAjax("GET", false, data.parentGuid).then(function(finalObject) {
										for (var k in data) {
											finalObject[k] = data[k];
										}
										p.resolve(finalObject);
									}, p.reject);
								} else {
									p.resolve(data);
								}
							}, p.reject);

							return p.promise();
						}
					},
					"post": function(params) {
						return doObjectAjax("POST", params);
					},
					"put": function(params) {
						return doObjectAjax("PUT", params);
					},
					"patch": function(params) {
						return doObjectAjax("PATCH", params)
					},
					"del": function() {
						return doObjectAjax("DELETE");
					},
					"plugin": function(plugin, method, params) {
						if (!params) { params = {}; }
						var obj;
						if (params.hasOwnProperty("object") && params.object) {
							obj = params.object;
							delete params.object;
						}
						var path = "/store/" + bucketName + (guid ? "/" + guid : "") + "/_" + plugin + (obj ? "/" + obj : "");
						return doAjax(method, path, params);
					},
					"children": function(name) {
						var childName = name;
						var iface = {
							"get": function(params) {
								var path = "/store/" + bucketName + (guid ? "/" + guid : "") + "/" + childName;
								return doAjax("GET", path, params);
							}
						};
						iface.read = iface.get;
						return iface;
					}
				};
				iface.read = iface.get;
				iface.create = iface.post;
				iface.update = iface.put;
				iface.tweak = iface.patch;
				iface.remove = iface.del;
				return iface;
			}
		}
		iface.create = iface.object().create;
		iface.children = iface.object().children;
		iface.plugin = iface.object().plugin;
		return iface;
	}
	
	var auth = {
		"changepassword": function(oldpassword, newpassword) {
			// This is a special case because it uses form format rather than JSON
			return $.ajax(getEndpoint("/auth/change-password"), {
				"type": "POST",
				"data": { "oldpassword": oldpassword, "newpassword": newpassword }
			});
		},
		"currentuser": function() {
			return doAjax("GET", "/auth/currentuser");
		},
		"login": function(username, password, rememberme) {
            var dataToSend = { "username": username, "password": password };

            if (rememberme) {
                dataToSend["remember"] = true;
            }

			// This is a special case because it uses form format rather than JSON
			return $.ajax(getEndpoint("/auth/login"), {
				"type": "POST",
				"data": dataToSend,
				"dataType": "json"
			});
		},
		"logout": function() {
			return doAjax("POST", "/auth/logout");
		},
		"apikey": {
			"get": function(password) {
				return doAjax("POST", "/auth/apikeyadmin", { "password": password, "overwrite": false }, true);
			},
			"create": function(password) {
				// This is a special case because it uses form format rather than JSON
				return $.ajax(getEndpoint("/auth/apikeyadmin"), {
					"type": "POST",
					"data": { "password": password },
					"dataType": "json"
				});
			}
		}
	}
	
	//******************************
	//********** Return variables **
	//******************************
	
	return {
		init: init,
		query: query,
		getDefaultConfiguration: getDefaultConfiguration,
		getConfiguration: getConfiguration,
		bucket: bucket,
		auth: auth,
		addConnectionCallback: addConnectionCallback,
		getEndpoint: getEndpoint,
		setConfigurationProperty: setConfigurationProperty
	};
	
})(jQuery);