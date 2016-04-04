define([
  "dojo/_base/declare",
  "dojo/dom-construct",
  "dijit/_Widget",
  "dijit/_Templated",
  "dojo/text!./templates/EFdownload.html",
  "esri/tasks/Geoprocessor",
  "esri/geometry/webMercatorUtils",
  "./configLocal"
], function(
    declare,   
    domConstruct,
    _Widget,
    _Templated,
    template,
    Geoprocessor,
    webMercatorUtils,
    _config
    ){
    return declare("EFdownload", [_Widget, _Templated], {
    templateString: template,
    widgetsInTemplate: false,
    constructor: function (options, srcRefNode) {

        options = options || {};
        if (!options.map) throw new Error("no map defined in params for EF download widget.");
        //        if (!options.featureset) throw new Error("no featureset defined in the download widget.");
        //        this.featureset = options.featureset;
        this.map = options.map;
        this.eftype = options.eftype;
        this.parentWidget = options.parentWidget;
        // mixin constructor options 
        declare.safeMixin(this, options);

       var maprestbaseurl = _config.maprestbaseurl; 
       var gpxmlclusterurl = maprestbaseurl + _config.gpxmlclusterurl;        
       var gpxml2shpcsvurl = maprestbaseurl + _config.gpxml2shpcsvurl;
       var efoasurl = _config.efsearchurl;       
       var re = /^.*\/(.*)\/$/;
       var tagname = efoasurl.replace(re, "$1"); 

        this.gpconfig = {
             "location": { "featureurl": gpxmlclusterurl, "shpcsvurl": gpxml2shpcsvurl,"maintag": tagname }
        };    

        var gpshpurl = this.gpconfig[this.eftype].shpcsvurl;        
        this.gp = new Geoprocessor(gpshpurl);
    },
    startup: function () {
    },
    postCreate: function () {
       this.imgSHP.src = this.parentWidget.folderUrl + "images/shpBtn.png";
       this.imgCSV.src = this.parentWidget.folderUrl + "images/csvBtn.png";
       this.imgKML.src = this.parentWidget.folderUrl + "images/geBtn.png";       
    },
    _saveShapefile: function () {       

        this.loadNode.innerHTML = "Loading... please wait";
      
        var params;
        var efbaseurl = this.parentWidget.baseurl;
        var maintagname = this.gpconfig[this.eftype].maintag;

        if (this.eftype == "location") {           
            params = { "xmlurl": efbaseurl, "main_tagname": maintagname, "latitude_tagname": "LATITUDE", "longitude_tagname": "LONGITUDE", "output_format": "shapefile" };
        } else {           
            var ext = this.map.extent;
            var mextent = webMercatorUtils.webMercatorToGeographic(ext);
            params = { "xmlurl": efbaseurl, "min_longitude": mextent.xmin, "min_latitude": mextent.ymin, "max_longitude": mextent.xmax, "max_latitude": mextent.ymax, "output_format": "shapefile" };
        }
        if (this.gprequest) this.gprequest.cancel();
        var wobj = this;
        this.gprequest = this.gp.execute(params, function (results) {
            wobj.loadNode.innerHTML = "";
            var shpurl = results[0].value;
            window.open(shpurl);
        }, function (err) {
            wobj.loadNode.innerHTML = "Generate shapefile failed. Error: " + err;
            console.log("something failed: ", err);
        });
    },
    _saveCSVfile: function () {
        this.loadNode.innerHTML = "Loading... please wait";
        if (this.gprequest) this.gprequest.cancel();
        
        var params;
        var efbaseurl = this.parentWidget.baseurl;
        var maintagname = this.gpconfig[this.eftype].maintag;

        if (this.eftype == "location") {            
            params = { "xmlurl": efbaseurl, "main_tagname": maintagname, "latitude_tagname": "LATITUDE", "longitude_tagname": "LONGITUDE", "output_format": "csvfile" };
        } else {            
            var ext = this.map.extent;
            var mextent = webMercatorUtils.webMercatorToGeographic(ext);
            params = { "xmlurl": efbaseurl, "min_longitude": mextent.xmin, "min_latitude": mextent.ymin, "max_longitude": mextent.xmax, "max_latitude": mextent.ymax, "output_format": "csvfile" };
        }
        var wobj = this;
        this.gprequest = this.gp.execute(params, function (results) {
            wobj.loadNode.innerHTML = "";
            var csvurl = results[0].value;
            window.open(csvurl);
        }, function (err) {
            wobj.loadNode.innerHTML = "Generate CSV file failed. Error: " + err;
            console.log("CSV gp failed: ", err);
        });
    },   
    _saveKML: function () {
        var gpfeaturl = this.gpconfig[this.eftype].featureurl;
        var maintagname = this.gpconfig[this.eftype].maintag;

        var url = "";
        var efbaseurl = this.parentWidget.baseurl;
        if (this.eftype == "location") {            
            url = gpfeaturl + "/execute?xmlurl=" + encodeURIComponent(efbaseurl) + "&main_tagname=" + maintagname + "&latitude_tagname=LATITUDE&longitude_tagname=LONGITUDE&showcluster=false&f=kmz";
        } else {            
            var ext = this.map.extent;
            var mextent = webMercatorUtils.webMercatorToGeographic(ext);
            url = gpfeaturl + "/execute?xmlurl=" + encodeURIComponent(efbaseurl) + "&min_longitude=" + mextent.xmin + "&min_latitude=" + mextent.ymin + "&max_longitude=" + mextent.xmax + "&max_latitude=" + mextent.ymax + "&showcluster=false&f=kmz";
        }
        window.open(url);
    },
    destroy: function () {
        domConstruct.empty(this.domNode);
    }
 });

});





