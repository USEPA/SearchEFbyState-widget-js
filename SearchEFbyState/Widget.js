define([
 'dojo/_base/declare',
 'dojo/_base/window',
 'dojo/string',
 'dojo/on',
 'dojo/_base/Color',
 'dojo/dom',
 'dojo/dom-construct',  
 'dijit/registry', 
 'dojox/xml/parser',
 'jimu/BaseWidget', 
 'esri/layers/GraphicsLayer',
 'esri/symbols/SimpleMarkerSymbol',
 'esri/symbols/SimpleLineSymbol',
 'esri/renderers/SimpleRenderer',
 'esri/request',
 'esri/InfoTemplate',
 'esri/geometry/Point',
 'esri/geometry/webMercatorUtils',
 'esri/graphic',
 'esri/graphicsUtils',
 './EFdownload',
 './configLocal'

 ],
function(
  declare,
  win, 
  string,
  on,
  Color,
  dom,
  domConstruct,
  registry,
  parser,
  BaseWidget, 
  GraphicsLayer,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  SimpleRenderer,
  esriRequest,
  InfoTemplate,
  Point,
  webMercatorUtils,
  Graphic,
  graphicsUtils,
  EFdownload,
  _config
  
  ) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // Custom widget code goes here 	
    baseClass: 'jimu-widget-SearchEFbyState', 
    //this property is set by the framework when widget is loaded.
     name: 'SearchEFbyState',  
   //methods to communication with app container:
    postCreate: function() {
      this.inherited(arguments);     
    },
   startup: function() {
     this.inherited(arguments);      
   },
    _zippress: function (event) {
        if (event.keyCode == 13) {
            this._drawEFxml();
            return false;
        }
    },
     _clearEF: function () {
        this.countdiv.innerHTML = "";
        if (this.map.getLayer("graphicLayer_" + this.id)) {
            graphiclayer = this.map.getLayer("graphicLayer_" + this.id);
            graphiclayer.clear();
        }               
        this.map.infoWindow.hide();
        this.dwNode.style.display = "none";
    },
     _downloadEF: function (parameters) {     
        var dwwidget = new EFdownload({
            map: this.map,
            eftype: "location",
            id: 'dwwg' + "_" + this.id,
            parentWidget: this
        }, this.efDownloadNode);
        dwwidget.startup();
    },
     _showloading: function() {
        this.map.disableMapNavigation();
        this.map.hideZoomSlider();
        var x = this.map.width / 2;
        var y = this.map.height / 2;
        if (dom.byId("loadingdiv")) {
                var dummy = dom.byId("loadingdiv");
                dummy.style.position = "absolute";
                dummy.style.left = x + "px";
                dummy.style.top = y + "px";
                dummy.style.display = "block";
                dummy.style.backgroundColor = "yellow";
                dummy.innerHTML = "Loading...Please wait.";
            } else {              
                var dummy = domConstruct.create("div", { id: 'loadingdiv' }, win.body());               
                dummy.style.position = "absolute";
                dummy.style.left = x + "px";
                dummy.style.top = y + "px";
                dummy.style.display = "block";
                dummy.style.backgroundColor = "yellow";
                dummy.style.fontSize = "18px";
                dummy.innerHTML = "Loading...Please wait.";
                dummy.style.zIndex = "1000";               
            }
    },
    _hideloading: function() {
        this.map.enableMapNavigation();
        this.map.showZoomSlider();
        if (dom.byId("loadingdiv")) {
        	domConstruct.destroy("loadingdiv");                
        }
    },
	_toggleDownload: function () {
	    if(this.dwNodeItems.style.display == "none"){
	         this.dwNodeItems.style.display = "block"; 
	         this.dwNodeAnchor.className = "toggleOff";
	     }else{
	        this.dwNodeItems.style.display = "none";
	        this.dwNodeAnchor.className = "toggle";
	    }    
	}, 
	_setEFDesc: function (graphic) {
	     
		    var efgeometry = graphic.geometry;
		    var gtype = efgeometry.type;
		    var coordstr = efgeometry.x + "," + efgeometry.y;
		    if (efgeometry.spatialReference.wkid == "102100") {
		        var geogeom = webMercatorUtils.webMercatorToGeographic(efgeometry);
		        coordstr = geogeom.x + "," + geogeom.y;
		    }
		   
		    var theinfo = "";
		    var rpturl = graphic.attributes["REPORT_URL"];
	        var regid = graphic.attributes["REG_ID"];
	        var facname = graphic.attributes["NAME"];

	        theinfo = theinfo + "<b><a href='" + rpturl + regid + "' target='_blank'>" + facname + "</a></b><br />";

	        var addr = graphic.attributes["ADDRESS"];
	        var city = graphic.attributes["CITY"];
	        var state = graphic.attributes["STATE"];
	        var zip = graphic.attributes["ZIPCODE"];
	        var nearbyreporturl = graphic.attributes["NEARBYREPORTURL"];
	        theinfo = theinfo + addr + "<br />";
	        theinfo = theinfo + city + ", " + state + " " + zip + "<br />";        
	        theinfo = theinfo + "<form action='" + nearbyreporturl + "' method='post' target='_blank'>";
	        theinfo = theinfo + "<input name='coords' value='" + coordstr + "' type='hidden'>";
	        theinfo = theinfo + "<input name='facname' value='" + facname + "' type='hidden'>";
	        theinfo = theinfo + "<input name='type' value='" + gtype + "' type='hidden'>";
	        theinfo = theinfo + "<button onclick='this.form.submit(); return false;' class='btn' title='Show analysis'>What's nearby</button>";
	        theinfo = theinfo + " in <input name='buff' size='3' maxlength='4' value='1.0' type='text'> mi</form>";
	    
	        return theinfo;
	},
	_drawEFxml: function () {

		    var pgm = this.pgmNode.value;
	        var stateabbr = this.stNode.value;
	        if (pgm == "--") {
	            alert("Please select a program system!");
	            return false;
	        }
	        if (stateabbr == "--") {
	            alert("Please select a State!");
	            return false;
	        }    
	      
	        this._showloading();
	        this.countdiv.innerHTML = "";
	        this.dwNode.style.display = "none";    	        
	       
	        var graphiclayer;
	        if (this.map.getLayer("graphicLayer_" + this.id)) {
	            graphiclayer = this.map.getLayer("graphicLayer_" + this.id);
	            graphiclayer.clear();
	        } else {
	            graphiclayer = new GraphicsLayer({ id: "graphicLayer_" + this.id });
	            var efsym = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 255]), 1), new Color([128, 128, 64, 0.8]));
	            var rd = new SimpleRenderer(efsym);
	            rd.label = "Single Facility";
	            graphiclayer.setRenderer(rd);
	            this.map.addLayer(graphiclayer);
	            on(graphiclayer, "click", function () { clickongraphic = true; });
	        }

	        var widgetobj = this;      
	        var eflinkurl = _config.eflinkurl; 
	        var efsearchurl = _config.efsearchurl; 
	        var nearbyreporturl = _config.nearbyreporturl;        
	        var re = /^.*\/(.*)\/$/;
	        var tagname = efsearchurl.replace(re, "$1");         
	         var inputurl = efsearchurl + "state_code/" + stateabbr.toUpperCase() + "/" + pgm + "/Y/";
	        this.baseurl = inputurl;
	        
	        esriRequest({
	          url: inputurl + "COUNT/JSON",
	          handleAs:"json",
	          //callbackParamName: "callback",
	          load: function (result,io) {
	            var fcount = Number(result[0].TOTALQUERYRESULTS);
	            var countdesc = "# of facilities found: " + fcount;
	            if (fcount > 10000) {
	              countdesc = countdesc + "<br/>(Maximum number can be retrieved is 10,000.)";
	            }
	            widgetobj.countdiv.innerHTML = countdesc;
	          },
	          error: function (err) {
	              alert("error occurred: " + err);
	          }        
	        });

	        var efRequest = esriRequest({
	            url: inputurl,
	            handleAs: "text"
	        });
	        efRequest.then(
	          function (xml) {         
				var domObj = parser.parse(xml);             
	            var efobj = domObj.getElementsByTagName(tagname);
	            var efcount = efobj.length;
	            
	            if (efcount > 0) {
	                  var singletemplate = new InfoTemplate();
	                  singletemplate.setTitle("Site Reporting to EPA:");
	                  singletemplate.setContent(widgetobj._setEFDesc);
	                  for (var i = 0; i < efcount; i++) {
	                      var tnodes = efobj[i].childNodes;
	                      var regid, lat, lon, addr, facname, city, state, zip;
	                      for (var k = 0; k < tnodes.length; k++) {                         
	                              if (tnodes[k].nodeName == "REGISTRY_ID") regid = tnodes[k].textContent;
	                              if (tnodes[k].nodeName == "LATITUDE") lat = tnodes[k].textContent;
	                              if (tnodes[k].nodeName == "LONGITUDE") lon = tnodes[k].textContent;
	                              if (tnodes[k].nodeName == "LOCATION_ADDRESS") addr = tnodes[k].textContent;
	                              if (tnodes[k].nodeName == "PRIMARY_NAME") facname = tnodes[k].textContent;
	                              if (tnodes[k].nodeName == "CITY_NAME") city = tnodes[k].textContent;
	                              if (tnodes[k].nodeName == "STATE_CODE") state = tnodes[k].textContent;
	                              if (tnodes[k].nodeName == "POSTAL_CODE") zip = tnodes[k].textContent;                          
	                      }                      
	                      var pnt = new Point({ "x": lon, "y": lat, " spatialReference": { " wkid": 4326} });
	                      var mgeom = webMercatorUtils.geographicToWebMercator(pnt);
	                      var g = new Graphic(mgeom);
	                      g.attributes = { "REPORT_URL": eflinkurl, "REG_ID": regid, "NAME": facname, "ADDRESS": addr, "CITY": city, "STATE": state, "ZIPCODE": zip,"NEARBYREPORTURL": nearbyreporturl };
	                      g.setInfoTemplate(singletemplate);
	                      graphiclayer.add(g);
	                  }

	                  widgetobj.dwNode.style.display = "block";                 
	                  if (registry.byId("dwwg" + "_" + widgetobj.id)) {                     
	                      registry.byId("dwwg" + "_" + widgetobj.id).loadNode.innerHTML = "";
	                  } else {
	                      widgetobj._downloadEF();
	                  }
	                  var extent = graphicsUtils.graphicsExtent(graphiclayer.graphics);
	                  if (extent == null) {

	                  } else {
	                      widgetobj.map.setExtent(extent, true);
	                  }
	              }
	              widgetobj._hideloading();
	          }, function (error) {
	              console.log("Error: " + error.message);              
	             widgetobj._hideloading();
	          });
	    }
	    
    
  });
});