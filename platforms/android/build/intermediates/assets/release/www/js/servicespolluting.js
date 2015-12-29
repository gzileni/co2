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
// airQ App - Service Pollutings
//
//

var service = angular.module('airq.polluting', []);

service.factory('Polluting', function () {

  var polluting = [
    {
        "name": "PM10",
        "element": "Materia Particolata",
        "description": "Insieme di sostanze solide e liquide con diametro inferiore a 10 micron. Derivano da emissioni di autoveicoli, processi industriali, fenomeni naturali.",
        "parameter": "media giornaliero",
        "limit": "50",
        "warning": "50",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/PM10"
    },
    {
        "name": "PM10 SWAM",
        "element": "Materia Particolata",
        "description": "Insieme di sostanze solide e liquide con diametro inferiore a 10 micron. Derivano da emissioni di autoveicoli, processi industriali, fenomeni naturali.",
        "parameter": "media giornaliero",
        "limit": "50",
        "warning": "50",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/PM10"
    },
    {
        "name": "PM10 ENV",
        "element": "Materia Particolata",
        "description": "Insieme di sostanze solide e liquide con diametro inferiore a 10 micron. Derivano da emissioni di autoveicoli, processi industriali, fenomeni naturali.",
        "parameter": "media giornaliero",
        "limit": "50",
        "warning": "50",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/PM10"
    },
    {
        "name": "PM2.5 SWAM",
        "element": "Materia Particolata",
        "description": "Insieme di sostanze solide e liquide con diametro inferiore a 10 micron. Derivano da emissioni di autoveicoli, processi industriali, fenomeni naturali.",
        "parameter": "media giornaliero",
        "limit": "25",
        "warning": "20",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/PM10"
    },
    {
        "name": "PM2.5",
        "element": "Materia Particolata",
        "description": "Insieme di sostanze solide e liquide con diametro inferiore a 2.5 micron. Derivano da processi industriali, processi di combustione, emissioni di autoveicoli, fenomeni naturali.",
        "parameter": "media annua",
        "limit": "25",
        "warning": "25",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/Particolato"
    },
    {
        "name": "O3",
        "element": "Ozono",
        "description": "Sostanza non emessa direttamente in atmosfera, si forma per reazione tra altri inquinanti, principalmente NO2 e idrocarburi, in presenza di radiazione solare.",
        "parameter": "massimo giornaliero",
        "limit": "180",
        "warning": "180",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/Ozono"
    },
    {
        "name": "NO2",
        "element": "Diossido di Azoto",
        "description": "Gas tossico che si forma nelle combustioni ad alta temperatura. Sue principali sorgenti sono i motori a scoppio, gli impianti termici, le centrali termoelettriche.",
        "parameter": "massimo giornaliero",
        "limit": "200",
        "warning": "400",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/Diossido_di_azoto"
    },
    {
        "name": "CO",
        "element": "Monossido di carbonio",
        "description": "Sostanza gassosa, si forma per combustione incompleta di materiale organico, ad esempio nei motori degli autoveicoli e nei processi industriali.",
        "parameter": "Max media mobile 8h giornaliera",
        "limit": "10",
        "warning": "10",
        "um": "mg/m³",
        "link": "https://it.wikipedia.org/wiki/Monossido_di_carbonio"
    },
    {
        "name": "C6H6",
        "element": "Benzene",
        "description": "Liquido volatile e dall\'odore dolciastro. Deriva dalla combustione incompleta del carbone e del petrolio, dai gas esausti dei veicoli a motore, dal fumo di tabacco.",
        "parameter": "Media annua",
        "limit": "5",
        "warning": "5",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/Benzene"
    },
    {
        "name": "SO2",
        "element": "Diossido di zolfo",
        "description": "Gas irritante, si forma soprattutto in seguito all'utilizzo di combustibili (carbone, petrolio, gasolio) contenenti impurezze di zolfo.",
        "parameter": "Massimo giornaliero",
        "limit": "350",
        "warning": "500",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/Diossido_di_zolfo"
    },
    {
        "name": "H2S",
        "element": "Acido solfidrico",
        "description": "Gas incolore dall'odore caratteristico di uova marce. H2S di origine antropica si forma, tra l\'altro, nei processi di depurazione delle acque reflue, produzione di carbon coke, raffinazione del petrolio.",
        "parameter": "",
        "limit": "10",
        "warning": "10",
        "um": "µg/m³",
        "link": "https://it.wikipedia.org/wiki/Acido_solfidrico"
    },
    {
        "name": "BLACK CARB",
        "element": "Carbone nero",
        "description": "Inquinante costituito da polvere finissima di carbone costituita al 95-99% da carbonio e da molecole aromatiche. ÃƒË† emesso soprattutto durante la combustione incompleta del carbone.",
        "parameter": "media giornaliera",
        "limit": "50",
        "warning": "50",
        "um": "ng/m³",
        "link": "https://en.wikipedia.org/wiki/Black_carbon"
    },
    {
        "name": "IPA",
        "element": "Idrocarburi policiclici aromatici",
        "description": "Inquinanti organici costituiti da più anelli benzenici condensati, si formano per combustione incompleta di combustibili fossili ma anche di legno e rifiuti. (Uno di essi, il benzo(a)pirene, è classificato dalla IARC ha come cancerogeno per l\'uomo).",
        "parameter": "",
        "limit": "10",
        "warning": "10",
        "um": "ng/m³",
        "link": "https://it.wikipedia.org/wiki/Idrocarburi_policiclici_aromatici"
    }];

    return polluting;

});