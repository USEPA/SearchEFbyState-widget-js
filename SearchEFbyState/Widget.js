define(['dojo/_base/declare',
 'jimu/BaseWidget',
 './EFdownload',
'./configLocal'
 ],
function(declare, BaseWidget,EFdownload,_config) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // Custom widget code goes here 
	
    baseClass: 'jimu-widget-SearchEFbyState',
    
    //this property is set by the framework when widget is loaded.
     name: 'SearchEFbyState',


//methods to communication with app container:

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

   startup: function() {
     this.inherited(arguments);
     console.log('startup');
   },

destroy: function () {

        if (this.map.getLayer("graphicLayer")) {
            graphiclayer = this.map.getLayer("graphicLayer");
            this.map.removeLayer(graphiclayer);
        }
        dojo.empty(this.domNode);
        this.map.infoWindow.hide();

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
        var eflinkurl = _config.eflinkurl; 
        var efsearchurl = _config.efsearchurl; 
        var nearbyreporturl = _config.nearbyreporturl;

        var re = /^.*\/(.*)\/$/;
        var tagname = efsearchurl.replace(re, "$1");  

        this.countdiv.innerHTML = "";
        this.dwNode.style.display = "none";

        var graphiclayer;
        if (this.map.getLayer("graphicLayer_" + this.id)) {
            graphiclayer = this.map.getLayer("graphicLayer_" + this.id);
            graphiclayer.clear();
        } else {
            graphiclayer = new esri.layers.GraphicsLayer({ id: "graphicLayer_" + this.id });
            var efsym = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 255, 255]), 1), new dojo.Color([128, 128, 64, 0.8]));
            var rd = new esri.renderer.SimpleRenderer(efsym);
            rd.label = "Single Facility";
            graphiclayer.setRenderer(rd);
            this.map.addLayer(graphiclayer);
        }


        var widgetobj = this;


        
        var inputurl = efsearchurl + "state_code/" + stateabbr.toUpperCase() + "/" + pgm + "/Y/";
        
        this.baseurl = inputurl;

         esri.request({
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
        var efRequest = esri.request({
            url: inputurl,
            handleAs: "text"
        });
        efRequest.then(
          function (response) {
              var isIE = false;
              var xml = response;
              var dom = null;
              if (window.DOMParser) {
                  try {
                      dom = (new DOMParser()).parseFromString(xml, "text/xml");
                  }
                  catch (e) { dom = null; }
              }
              else if (window.ActiveXObject) {
                  try {
                      isIE = true;
                      dom = new ActiveXObject('Microsoft.XMLDOM');
                      dom.async = false;
                      if (!dom.loadXML(xml)) // parse error ..

                          window.alert(dom.parseError.reason + dom.parseError.srcText);
                  }
                  catch (e) { dom = null; }
              }
              else {
                  alert("cannot parse xml string!");
                  widgetobj._hideloading();
                  return false;
              }
              var efobj = dom.getElementsByTagName(tagname);
              var efcount = efobj.length;
              //alert("record count: " + efcount);
              //widgetobj.countdiv.innerHTML = "# of facilities found: " + efcount;
              if (efcount > 0) {
                  var singletemplate = new esri.InfoTemplate();
                  singletemplate.setTitle("Site Reporting to EPA:");
                  singletemplate.setContent(widgetobj._setEFDesc);
                  for (var i = 0; i < efcount; i++) {
                      var tnodes = efobj[i].childNodes;
                      var regid, lat, lon, addr, facname, city, state, zip;
                      for (var k = 0; k < tnodes.length; k++) {
                          //alert(tnodes[k].nodeName + ": " + tnodes[k].Text + ": " + tnodes[k].nodeValue + ": " + tnodes[k].text + ": " + tnodes[k].textContent + ": " + tnodes[k].innerText + ": " + tnodes[k].innerXML);
                          if (isIE) {
                              if (tnodes[k].nodeName == "REGISTRY_ID") regid = tnodes[k].text;
                              if (tnodes[k].nodeName == "LATITUDE") lat = tnodes[k].text;
                              if (tnodes[k].nodeName == "LONGITUDE") lon = tnodes[k].text;
                              if (tnodes[k].nodeName == "LOCATION_ADDRESS") addr = tnodes[k].text;
                              if (tnodes[k].nodeName == "PRIMARY_NAME") facname = tnodes[k].text;
                              if (tnodes[k].nodeName == "CITY_NAME") city = tnodes[k].text;
                              if (tnodes[k].nodeName == "STATE_CODE") state = tnodes[k].text;
                              if (tnodes[k].nodeName == "POSTAL_CODE") zip = tnodes[k].text;
                          } else {
                              if (tnodes[k].nodeName == "REGISTRY_ID") regid = tnodes[k].textContent;
                              if (tnodes[k].nodeName == "LATITUDE") lat = tnodes[k].textContent;
                              if (tnodes[k].nodeName == "LONGITUDE") lon = tnodes[k].textContent;
                              if (tnodes[k].nodeName == "LOCATION_ADDRESS") addr = tnodes[k].textContent;
                              if (tnodes[k].nodeName == "PRIMARY_NAME") facname = tnodes[k].textContent;
                              if (tnodes[k].nodeName == "CITY_NAME") city = tnodes[k].textContent;
                              if (tnodes[k].nodeName == "STATE_CODE") state = tnodes[k].textContent;
                              if (tnodes[k].nodeName == "POSTAL_CODE") zip = tnodes[k].textContent;
                          }
                      }
                      
                      var pnt = new esri.geometry.Point({ "x": lon, "y": lat, " spatialReference": { " wkid": 4326} });
                      var mgeom = esri.geometry.geographicToWebMercator(pnt);

                      var g = new esri.Graphic(mgeom);
                       g.attributes = { "REPORT_URL": eflinkurl, "REG_ID": regid, "NAME": facname, "ADDRESS": addr, "CITY": city, "STATE": state, "ZIPCODE": zip,"NEARBYREPORTURL": nearbyreporturl };

                      g.setInfoTemplate(singletemplate);
                      graphiclayer.add(g);
                  }

                  widgetobj.dwNode.style.display = "block";                 
                  if (dijit.registry.byId("dwwg" + "_" + widgetobj.id)) {
                      //dojo.style(dijit.byId("dwwg").domNode, "display", "block");
                      dijit.byId("dwwg" + "_" + widgetobj.id).loadNode.innerHTML = "";
                  } else {
                      widgetobj._downloadEF();
                  }
                  var extent = esri.graphicsExtent(graphiclayer.graphics);
                  if (extent == null) {

                  } else {
                      widgetobj.map.setExtent(extent, true);
                  }
              }
              widgetobj._hideloading();
          }, function (error) {
              console.log("Error: " + error.message);
              //alert("Error: " + error.message);
             widgetobj._hideloading();
          });
    },
    _showloading: function() {
        this.map.disableMapNavigation();
        this.map.hideZoomSlider();
        var x = this.map.width / 2;
        var y = this.map.height / 2;
        if (document.getElementById("loadingdiv")) {
                var dummy = document.getElementById("loadingdiv");
                dummy.style.position = "absolute";
                dummy.style.left = x + "px";
                dummy.style.top = y + "px";
                dummy.style.display = "block";
                dummy.style.backgroundColor = "yellow";
                dummy.innerHTML = "Loading...Please wait.";
            } else {
                var dummy = document.createElement("div");
                dummy.id = "loadingdiv";
                dummy.style.position = "absolute";
                dummy.style.left = x + "px";
                dummy.style.top = y + "px";
                dummy.style.display = "block";
                dummy.style.backgroundColor = "yellow";
                dummy.style.fontSize = "18px";
                dummy.innerHTML = "Loading...Please wait.";
                dummy.style.zIndex = "1000";
                document.body.appendChild(dummy); ;
            }
    },
    _hideloading: function() {
        this.map.enableMapNavigation();
        this.map.showZoomSlider();
        if (document.getElementById("loadingdiv")) {
                var dummy = document.getElementById("loadingdiv");
                document.body.removeChild(dummy);
            }

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
_setEFDesc: function (graphic) {
     
    var efgeometry = graphic.geometry;

    var gtype = efgeometry.type;
    
    var coordstr = efgeometry.x + "," + efgeometry.y;
    if (efgeometry.spatialReference.wkid == "102100") {
        var geogeom = esri.geometry.webMercatorToGeographic(efgeometry);
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
_toggleDownload: function () {
    if(this.dwNodeItems.style.display == "none"){
         this.dwNodeItems.style.display = "block"; 
         this.dwNodeAnchor.className = "toggleOff";
     }else{
        this.dwNodeItems.style.display = "none";
        this.dwNodeAnchor.className = "toggle";
    }     

}
  });
});