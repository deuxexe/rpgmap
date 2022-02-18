/* 
Cosmograph is a LeafletJS wrapper/extension meant to make it easy to build interactive, easily configurable maps for Tabletop or Online RPGs.
Users should have no need to edit this file or any of the others outside of the /assets/ folder.

To customize this for your own usage, edit the contents of the /assets/ folder by replacing the images there with your own and 
alter the JSON files to meet your own needs.

Distributed under the Creative CommonsAttribution-ShareAlike 4.0 International License
by "Whisper" (Discord: Ames#8727, Site: whisperworks.net)

I'd love to see what you use this for - send me a link!
*/

cosmograph();
function cosmograph(){
    var oPageSettings;
    var pNavData;
    var oMap;
    var oMapData;

    const MAP_OBJECT_TYPES = {
        LABEL: 2,
        MARKER : 1
    }
    const PLOT_TYPES = {
        LINE: 1,
        POINT: 2
    }
    const PLOT_TOOLTIP_TYPES = {
        COORDS: 2,
        DISTANCE: 1
    }

    var mUtils = new Utils();
    var mMapObjectManager = new MapObjectManager();
    var mMapInteractions = new MapInteractions();
    var mMapMenu = new MapMenu();
    var mPlotter = new Plotter();
    var mObjectEditor = new ObjectEditor();
    var mLayerEditor = new LayerEditor();

    init();

    function init(){
        var promise = $.getJSON("assets/data/mapdata.json");
        promise.then(function(data) {
            oMapData = data;
            mMapObjectManager.init();

            var promise = $.getJSON("assets/data/settings.json");
            promise.then(function(data) {
                oPageSettings = data;
                configurePage(oPageSettings);
            });

            mMapMenu.init();
            mMapInteractions.init();
            mObjectEditor.init();
            mLayerEditor.init();
        });
    }

    function configurePage(settingData){
        document.title = settingData.pageName;

        if(settingData.forumURL.length && settingData.forumURL.length > 0){
            $("#sitenav").append("<a href='" + settingData.forumURL + "' target='_blank'><i class='fa fa-comments'></i>Forums</a>");
        }
        if(settingData.wikiURL.length && settingData.wikiURL.length > 0){
            $("#sitenav").append("<a href='" + settingData.wikiURL + "' target='_blank'><i class='fa fa-book'></i>Wiki</a>");
        }
    }

    function MapMenu(){
        var isMapMenuActive = false;

        this.init = function(){
            setupColorPicker();
            initMenuHandlers();
            buildLegend();
                
            if(typeof(oMapData.mapConfiguration.customKey) !== 'undefined' && oMapData.mapConfiguration.customKey.length && oMapData.mapConfiguration.customKey.length > 0){
                $("#mapKey").append("<img src='assets/images/" + oMapData.mapConfiguration.customKey+ "' draggable='false'>");
            }
        }

        this.setPlotterDirty = function(newPlotterDirty){
            if(jQuery.type(newPlotterDirty) == "boolean"){
                if (newPlotterDirty) {
                    $("#clearCourse").removeClass("disabled");
                }else{
                    $("#clearCourse").addClass("disabled");
                }
            }      
        }

        this.setEditorDirty = function(newEditorDirty){
            if(jQuery.type(newEditorDirty) == "boolean"){
                if (newEditorDirty) {
                    $("#clearUserObjects").removeClass("disabled");
                }else{
                    $("#clearUserObjects").addClass("disabled");
                }
            }      
        }

        this.isMapMenuActive = function(){
            return isMapMenuActive;
        }

        this.setMenuActive = function(elementID){
            setMenuActive(elementID);
        }

        initMenuHandlers = function(){
            $("#mapcommands a").on("click", function(event){
                switch (event.currentTarget.id){
                    case "panMap":
                        setMenuActive("panMap");
                        break;
                    case "plotCourse":
                        setMenuActive("plotCourse");
                        break;
                    case "courseDistanceToggle":
                        setMenuActive("plotCourse");
                        
                        if($(event.currentTarget).hasClass('disabled')){
                            setListActive_Single("plotCourseOptions","courseDistanceToggle",true);
                            mPlotter.showCoursePointMarker();
                        }else{
                            setListActive_Single("plotCourseOptions","courseDistanceToggle",false);
                            mPlotter.closeCoursePointMarker();
                        }
                        break;
                    case "courseColorPicker":
                        $("#plotColorPicker").show();
                    case "clearCourse":
                        mPlotter.clearCourse();
                        break;
                    case "editAddObject":
                        setMenuActive("editAddObject");
                        break;
                    case "editAddMarker":
                        setMenuActive("editAddObject");
                        mObjectEditor.setActiveObjectType(MAP_OBJECT_TYPES.MARKER);
                        setListActive_Exclusive("editcommands","editAddMarker");
                        break;
                    case "editAddLabel":
                        setMenuActive("editAddObject");
                        mObjectEditor.setActiveObjectType(MAP_OBJECT_TYPES.LABEL);
                        setListActive_Exclusive("editcommands","editAddLabel");
                        break;
                    case "editLayers":
                        mLayerEditor.show();
                        break;
                    case "clearUserObjects":
                        mObjectEditor.clearUserObjects();
                        break;
                    case "copyToClipboard":
                        navigator.clipboard.writeText(mMapObjectManager.getJSONforClipboard()).then(function () {
                            mUtils.toast("JSON Saved to Clipboard", true);
                        }, function () {
                            mUtils.toast("Failure to copy. Check permissions for clipboard", false);
                        });
                        break;
                }
            });
        }
        
        setMenuActive = function(elementID){
            var currentListElement;
            var parentElementID = "mapcommands";

            $("#" + parentElementID).find('li').each(function(idx, li){
                currentListElement = $(li).find("a:first");
                if(currentListElement.attr('id') == elementID){
                    currentListElement.addClass("selected");
                }else{
                    currentListElement.removeClass("selected");
                }
            });
            switch (elementID){
                case "panMap":
                    mPlotter.setActive(false);
                    mObjectEditor.setActive(false);
                    if($("#mapid").hasClass("editMapActive")) $("#mapid").removeClass("editMapActive");
                    break;
                case "plotCourse":
                    mPlotter.setActive(true);
                    mObjectEditor.setActive(false);
                    if(!$("#mapid").hasClass("editMapActive")) $("#mapid").addClass("editMapActive");
                    break;
                case "editAddObject":
                    mPlotter.setActive(false);
                    mObjectEditor.setActive(true);
                    if(!$("#mapid").hasClass("editMapActive")) $("#mapid").addClass("editMapActive");
                    break;
            }
        }

        setListActive_Exclusive = function(parentElementID,elementID){
            var currentListElement;
            $("#" + parentElementID).find('li').each(function(idx, li){
                currentListElement = $(li).find("a:first");
                if(!currentListElement.hasClass("selectable")){
                    if(currentListElement.attr('id') == elementID){
                        currentListElement.removeClass("disabled");
                    }else{
                        currentListElement.addClass("disabled");
                    }

                }
            });
        }

        setListActive_Single = function(parentElementID,elementID,isActive){
            var currentListElement;
            $("#" + parentElementID).find('li').each(function(idx, li){
                currentListElement = $(li).find("a:first");
                if(currentListElement.attr('id') == elementID){
                    if(isActive){
                        currentListElement.removeClass("disabled");
                        return false;
                    }else{
                        currentListElement.addClass("disabled");
                        return false;
                    }
                }
            });
        }        

        setupColorPicker = function(){
            var colorPicker = new iro.ColorPicker('#plotColorPicker', {
                width: 200
            });
            colorPicker.on('color:change', function(color){
                $("#courseColorPicker").css("color", colorPicker.color.hexString);
            });
        }
        
        buildLegend = function(){
            
            var promise = $.getJSON("assets/data/navdata.json");
            promise.then(function(data) {
                pNavData = data;

                if (oMap){
                    var navList = "<ul id='nav'><li id='navHeader' coords='" + data.coords + "' zoom='" + data.zoom + "'>" + data.name + "<ul id='navInner'>";

                    data.children.forEach((element) =>{
                        navList += "<li coords='" + element.coords + "' zoom='" + element.zoom + "'>" + element.name;

                        if (element.children.length){
                            navList += "<ul>";
                            element.children.forEach((element) => {
                                navList += "<li coords='" + element.coords + "' zoom='" + element.zoom + "'>" + element.name;
                                navList += "</li>";

                            });
                            navList += "</ul>";                    
                        }
                    });

                    navList += "</ul></li></ul>";
                    $("#mapnav").append(navList);
                }
                
                $("#mapnav").on("click", "li", function(event){
                    var coords = $(this).attr('coords').split(",");
                    var coord = L.latLng(coords[1],coords[0]);
                    var zoom = $(this).attr('zoom');
                    event.stopPropagation();
                    goTo(coord,zoom);
                    
                });

                function goTo(latlng, zoom){
                    oMap.setView(latlng, zoom);
                }
            
            });
        }
    }

    function MapInteractions(){
        this.init = function(){
            oMap.on('click', function(ev){
                if (mPlotter.isActive()) {
                    mPlotter.plot(ev);
                }else if (mObjectEditor.isActive()){
                    mObjectEditor.showEditor(ev);
                }
            });            
            oMap.on('zoomend', function() {
                mMapObjectManager.doLayerVisibility();
            });
            oMap.on('contextmenu', (e) => {
                mMapMenu.setMenuActive('panMap');
            });
            oMap.on('mousemove', function(ev){
                var latlng = oMap.mouseEventToLatLng(ev.originalEvent);
                var x = Math.floor(latlng.lng);
                var y = Math.floor(latlng.lat);
                
                if (x < 0 || y < 0 || x > oMapData.mapConfiguration.mapWidth || y > oMapData.mapConfiguration.mapHeight){
                    x = 0;
                    y = 0;
                }

                $("#cursorCoords").html(x + ', '+ y);
            });
        }
    }

    function MapObjectManager(){

        var mapMarkerLayers = [];
        var mapMarkerLayerVisibility = [];
        var controlLayers = [];

        var userLayerId = null;

        this.init = function(){
            buildMap();
            buildMapLayers(oMap, oMapData);
        }

        this.getMarkerLayers = function(){
            return oMapData.markerLayers;
        }

        this.getControlLayers = function(){
            return controlLayers;
        }

        this.doLayerVisibility = function(){
            doLayerVisibility();
        }

        this.createMapObject = function(objectData, layerIndex){
            var insertIndex;

            if(oMapData.markerLayers[layerIndex].markers === undefined){
                insertIndex = 0;
            }else{
                insertIndex = oMapData.markerLayers[layerIndex].markers.length;
            }
            oMapData.markerLayers[layerIndex].markers[insertIndex] = objectData;
            createMapObject(objectData, layerIndex);

            if(layerIndex == this.getUserLayerId()){
                saveUserLayerData();
            }
        }

        this.getUserLayerId = function(){
            return getUserLayerId();
        }

        this.clearUserLayer = function(){
            if(userLayerId != null){
                if(confirm("Are you sure you want to clear all of your additions to the map's 'User' layer?")){
                    oMap.removeLayer(mapMarkerLayers[userLayerId]);
                    controlLayers.removeLayer(mapMarkerLayers[userLayerId]);
                    oMapData.markerLayers.splice(userLayerId,1);
                    userLayerId = null;
                    mMapMenu.setEditorDirty(false);
                    if(saveUserLayerData()) mUtils.toast("User Layer Cleared");
                }
            }
        }

        this.getJSONforClipboard = function(){
            var tempMapData = oMapData;

            tempMapData.markerLayers.splice(this.getUserLayerId(),1);

            return JSON.stringify(tempMapData, undefined, 2);
        }

        function buildMap(){
            var bounds = [[0,0], [oMapData.mapConfiguration.mapHeight, oMapData.mapConfiguration.mapWidth]];

            oMap = L.map('mapid', {
                crs: L.CRS.Simple,
                minZoom: oMapData.mapConfiguration.minZoom,
                maxZoom: oMapData.mapConfiguration.maxZoom,
                zoom: oMapData.mapConfiguration.initialZoom,
                maxBounds: bounds,
                maxBoundsViscosity: 1.0
            });
    
            oMap.on('load', function(ev){
                $('#loading').fadeOut(3000, function(){
                    $('#loading').hide();
                });
            });

            oMap.setView([oMapData.mapConfiguration.mapHeight/2, oMapData.mapConfiguration.mapWidth/2]);

            var image = L.imageOverlay("assets/images/"+oMapData.mapConfiguration.filename, bounds).addTo(oMap);
    
            if (oMapData.mapConfiguration.generateGrid){
                var graticule = L.simpleGraticule({
                    interval: oMapData.mapConfiguration.squareHeightWidth,
                    redraw: 'move',
                    showOriginLabel: false,
                    showMapLabels: oMapData.mapConfiguration.showGridLabels,
                    mapLabelsInterval: oMapData.mapConfiguration.squareHeightWidth,
                    mapHeight: oMapData.mapConfiguration.mapHeight,
                    mapWidth: oMapData.mapConfiguration.mapWidth
                }).addTo(oMap);
            }
    
        }

        function buildMapLayers(){
            if (oMap && oMapData){
                controlLayers = L.control.layers( null, null, {
                    position: "bottomright",
                    collapsed: false
                }).addTo(oMap);

                loadUserLayerData();

                oMapData.markerLayers.forEach((layerElement, layerIndex) =>{
                    mapMarkerLayers[layerIndex] = new L.LayerGroup().addTo(oMap);
                    layerElement.markers.forEach((marker) =>{
                        createMapObject(marker, layerIndex);
                    });
                    mapMarkerLayerVisibility[layerIndex] = layerElement.layerVisibility.split(',').map(Number);

                    if(layerElement.layerName && layerElement.layerName.length > 0){
                        controlLayers.addOverlay(mapMarkerLayers[layerIndex], layerElement.layerName);
                    }
                });

            }else{
                mUtils.toast("Map or map data is missing or invalid", false, 200000);
            }
        }

        // Marker details: https://github.com/coryasilva/Leaflet.ExtraMarkers
        function createMapObject(objectData, layerIndex){            
            var mapObject = null;

            objectData.type = "Feature";
            objectData.geometry = {};
            objectData.geometry.type = "Point";
    
            if (!objectData.hasOwnProperty('markerType') || objectData.markerType == "Marker" || objectData.markerType == ""){
                objectData.geometry.coordinates = objectData.markerCoordinates.split(',').map(Number);
                mapObject = L.geoJSON(objectData, {
                    pointToLayer: function (feature, latlng) {
                        var markerIcon = L.ExtraMarkers.icon({
                            prefix: "",
                            extraClasses: objectData.extraClasses ? objectData.extraClasses : "",
                            icon: objectData.markerIcon,
                            shape: objectData.markerShape,
                            markerColor: objectData.markerColor
                        });
                        return L.marker(latlng, {icon: markerIcon});
                    },
                    onEachFeature: onEachFeature
                });
            }else if (objectData.markerType == "Label"){
                objectData.geometry.coordinates = objectData.labelCoordinates.split(',').map(Number);
                mapObject = L.geoJSON(objectData, {
                    pointToLayer: function (feature, latlng) {
                        var classes = "mapLabel ";
                        if (objectData.hasOwnProperty('labelStyle') && typeof(objectData.labelStyle) !== 'undefined'  && objectData.labelStyle.length){classes += "label" + objectData.labelStyle + " "};
                        if (objectData.hasOwnProperty('labelHideTooltipStyling') && objectData.labelHideTooltipStyling){classes += "hideTooltipStyling "};
                        if (objectData.hasOwnProperty('labelShadow')){classes += "labelShadow" + objectData.labelShadow + " "};
                        if (objectData.hasOwnProperty('labelFont') && objectData.labelFont.length){classes += "labelFont" + objectData.labelFont.replace(/\s+/g, '') + " "};
                        if (objectData.hasOwnProperty('labelDot') && !objectData.labelDot){classes += "hideLabelDot "};
                        if (objectData.hasOwnProperty('labelColor') && typeof(objectData.labelColor) !== 'undefined' && objectData.labelColor.length){
                            classes += "labelColor" + objectData.labelColor.substr(0,1).toUpperCase()+objectData.labelColor.replace(/\s+/g, '').substr(1);
                        }else{
                            classes += "labelColorBlack";
                        };
    
                        return L.marker(latlng, {opacity: 0.01, interactive: false}).bindTooltip(objectData.labelText, {permanent: true, direction: "right", className: classes, offset: [0,0]});
                    },
                    onEachFeature: onEachFeature
                });
            }else if(objectData.markerType == "Region"){
                var coordsArray = objectData.regionCoordinates.split(';');
                coordsArray.forEach(element => {
                    element = element.replace("[","").replace("]","").split(',').map(Number);
                });
                if (!objectData.hasOwnProperty('regionColor') || objectData.regionColor.length == 0){objectData.regionColor = "red";}
    
                mapObject = L.polygon(coordsArray, {color: objectData.regionColor});
            }

            mapObject.addTo(mapMarkerLayers[layerIndex]);
        }        
        
        function onEachFeature(feature, layer) {
            var popupContent = "";
            if (feature.hasOwnProperty('popupContent') && typeof(feature.popupContent) !== 'undefined' && feature.popupContent.length > 0) {
                
                popupContent="<div class='markerPopupWrapper'>";
                if (feature.markerIcon) {
                    popupContent += "<div class='markerPopupIconWrapper'>";
                    var extraClasses = feature.extraClasses ? feature.extraClasses : '';
                    popupContent += "<i class='" + extraClasses + " " + feature.markerIcon + " markerIcon'></i>";
                    popupContent += "</div>";
                }
                popupContent += "<div class='markerPopupTextWrapper'>";
                if (feature.name) {
                    popupContent += "<span class='popupTitle'>" + feature.name + "</span><br>";
                }
                if (feature.popupContent) {
                    popupContent += feature.popupContent;
                }
                if (feature.popupLink && feature.popupLink.length > 0) {
                    popupContent += "<br><a href=" + feature.popupLink + " target='_blank' class='popupLink'><i class='fa fa-book'></i> Wiki</a>";
                }
                popupContent += "</div></div>";

                layer.bindPopup(popupContent);
            }

            layer.on('click', function() {
                if(mPlotter.isActive()){
                    oMap.closePopup();
                    return false;
                }
            });
        }     

        function doLayerVisibility(){
            mapMarkerLayerVisibility.forEach((layerVisibility, index) => {
                if(layerVisibility.includes(oMap.getZoom())){
                    if (!oMap.hasLayer(mapMarkerLayers[index])){
                        mapMarkerLayers[index].addTo(oMap);
                    }
                }else{
                    if (oMap.hasLayer(mapMarkerLayers[index])){
                        mapMarkerLayers[index].removeFrom(oMap);
                    }
                }

            });
        }

        function getUserLayerId(){
            if (userLayerId == null){
                oMapData.markerLayers.forEach((element, index) => {
                    if (element.layerName == "User") userLayerId = index;
                });
                if(userLayerId == null){
                    userLayerId = oMapData.markerLayers.length;
                    if(typeof(oMapData.markerLayers[userLayerId]) === 'undefined'){
                        oMapData.markerLayers[userLayerId] = {
                            "layerName": "User",
                            "layerVisibility": "-3, -2, -1, 0, 1, 2, 3",
                            "markers": []
                        };
                    }
                }
            }
            return userLayerId;
        }

        function createUserLayer(){
            var userLayerId = getUserLayerId();
            mapMarkerLayers[userLayerId] = new L.LayerGroup().addTo(oMap);
            controlLayers.addOverlay(mapMarkerLayers[userLayerId], "User");
        }

        function loadUserLayerData(){
            var storedUserData = localStorage.getItem('storedUserObjects');
            try{
                if(storedUserData && !mUtils.isObjectEmpty(storedUserData)){
                    storedUserData = JSON.parse(storedUserData);
                    mergeUserLayerData(storedUserData);
                    if(storedUserData.markers.length){
                        mMapMenu.setEditorDirty(true);
                    }
                    return storedUserData;
                }else{
                    return {};
                }
            }catch(e){
                return {};                
            }
        }

        function mergeUserLayerData(storedUserData){
            try{
                var userLayerId = getUserLayerId();
                oMapData.markerLayers[userLayerId] = storedUserData;
                return true;
            }catch(e){
                return false;
            }
        }

        function saveUserLayerData(){
            try{
                var userLayerId = getUserLayerId();
                var userLayerData = JSON.stringify(oMapData.markerLayers[userLayerId]);
                localStorage.setItem('storedUserObjects',userLayerData);
                return true;
            }catch(e){
                return false;
            }
        }
    }

    function Plotter(){
        var isActive = false;
        var isDirty = false;

        var courseCoordArray = [];
        var courseObjectArray = [];

        var courseLine = null;
        var courseEmphasis = null;
        var coursePointMarker = null;

        var distance = 0;
        var plotType = PLOT_TYPES.LINE;
        var plotterTooltipType = PLOT_TOOLTIP_TYPES.DISTANCE;

        var showCoursePointMarker = true;

        this.setActive = function(newIsActive){
            if(jQuery.type(newIsActive) == "boolean"){
                isActive = newIsActive;
            }else{
                isActive = false;
            }
        }
        this.isActive = function(){
            return isActive;
        }

        this.isDirty = function(){
            return isDirty;
        }

        this.closeCoursePointMarker = function(){
            if (coursePointMarker) coursePointMarker.closeTooltip();
            showCoursePointMarker = false;
        }
        this.showCoursePointMarker = function(){
            if (coursePointMarker) coursePointMarker.openTooltip();
            showCoursePointMarker = true;
        }

        this.setTooltipType = function (newPlotterTooltipType){
            if(jQuery.type(newPlotterTooltipType) == "number"){
                plotterTooltipType = newPlotterTooltipType;
                if (newPlotterTooltipType!= plotterTooltipType) {
                    clearCourse();
                }
            }else{
                plotterTooltipType = PLOT_TOOLTIP_TYPES.DISTANCE;
            }
        }
        this.getTooltipType = function (){
            return plotterTooltipType;
        }
        
        this.setPlotType = function (newPlotType){
            if(jQuery.type(newPlotType) == "number"){
                if (newPlotType != plotType) {
                    clearCourse();
                    plotType = newPlotType;
                }
            }else{
                plotType = 1;
            }
        }
        this.getPlotType = function (){
            return plotType;
        }

        this.clearCourse = function(){
            clearCourse();
        }

        this.plot = function(ev){
            plot(ev);
        }


        plot = function(ev){    
            if (isActive){
                latlng = oMap.mouseEventToLatLng(ev.originalEvent);
                courseCoordArray.unshift(latlng);
    
                if (courseCoordArray.length > 0){
                    isDirty = true;
                    mMapMenu.setPlotterDirty(true);

                    if(courseCoordArray.length > 1){
                        oMap.removeLayer(courseLine);
                    }
    
                    if (plotType == PLOT_TYPES.POINT){
                        clearCourse();
                    }        
    
                    if(courseEmphasis){ 
                        oMap.removeLayer(courseEmphasis);
                        oMap.removeLayer(coursePointMarker);
                    }
      
                    courseLine = L.polyline(courseCoordArray, {
                        color: $("#courseColorPicker").css("color"),
                        dashArray: "7 7",
                        dashSpeed: 7
                    }).addTo(oMap);

                    courseObjectArray[courseObjectArray.length] = L.circle(latlng, {
                        radius:10, color: $("#courseColorPicker").css("color")
                    }).addTo(oMap);

                    courseEmphasis = L.circle(latlng, 
                        {
                            radius:8, 
                            color: $("#courseColorPicker").css("color"),
                            fillColor: "white",
                            fillOpacity: 1
                        }
                    ).addTo(oMap);

                    createTooltip(plotterTooltipType, latlng);
                }
            }
        }

        clearCourse = function(){
            isDirty = true;
            mMapMenu.setPlotterDirty(false);

            distance = 0;

            if (courseLine) oMap.removeLayer(courseLine);
            if (courseEmphasis) oMap.removeLayer(courseEmphasis);
            if (coursePointMarker) oMap.removeLayer(coursePointMarker);
   
            courseObjectArray.forEach(element => {
                oMap.removeLayer(element);
            });

            courseCoordArray = [];
            courseObjectArray = [];

        }

        createTooltip = function(tooltipType,latlng){
            coursePointMarker = L.marker(latlng,{
                opacity:0
            }).addTo(oMap); 

            switch (tooltipType){
                case PLOT_TOOLTIP_TYPES.DISTANCE:
                    if(courseCoordArray.length > 1){ 
                        var distanceText = generateDistanceText();
                        if(oMapData.mapConfiguration.showDistance == true){                                 
                            coursePointMarker.bindTooltip(distanceText,{offset:[-3,27],permanent:true,className:"distancePopup"});
                        }
                    }
                    break;
                case PLOT_TOOLTIP_TYPES.COORDS: 
                    var coordText = "Marker coordinate: " + latlng.lng + ", " + latlng.lat;
                    if(oMapData.mapConfiguration.showDistance == true){                                 
                        coursePointMarker.bindTooltip(coordText,{offset:[-3,27],permanent:true,className:"distancePopup"});
                    }
                    break;
                }
                
            if (!showCoursePointMarker){
                coursePointMarker.closeTooltip();
            }
        }

        generateDistanceText = function(){
            var distanceText;
            var coordCurrent = courseCoordArray[courseCoordArray.length-1];
            var coordPrevious = courseCoordArray[courseCoordArray.length-2];
            distance += Math.sqrt( Math.pow((coordCurrent.lat-coordPrevious.lat), 2) + Math.pow((coordCurrent.lng-coordPrevious.lng), 2) );
            var distanceDays = Math.floor(distance/oMapData.mapConfiguration.pixelsPerDay);
            var distanceWeeks = Math.floor(distanceDays/7);
            if (distanceWeeks > 0){
                distanceText = distanceWeeks + " week"
                if (distanceWeeks > 1){
                    distanceText += "s";
                }
                if (distanceDays%7 > 0){
                    distanceText += ", " + distanceDays%7 + " days";
                }
            }else{
                distanceText = distanceDays + " days";
            }
            distanceText += " " + oMapData.mapConfiguration.measurementPostText;
            return distanceText;
        }
    }

    function ObjectEditor(){
        var isActive = false;
        var isDirty = false;
        var activeObjectType = MAP_OBJECT_TYPES.MARKER;
        var editor;
        var previousLayer;
        var initialValue = {
            "name": "",
            "markerIcon": "fas fa-asterisk",
            "markerColor": "red",
            "markerShape": "square",
            "popupContent": "",
            "popupLink": "",
            "labelText": ""
        };
        var errors = [];

        this.init = function(){
            $('#object_editor_wrapper .editor_submit').click(function(){
                if(errors.length == 0){
                    var objectJSON = editor.getValue();

                    previousLayer = $("#object_editor_wrapper .editor_layer_selector select").val();

                    addObject(objectJSON, previousLayer);
                    initialValue = objectJSON;

                    $("#object_editor_wrapper").hide();
                }
            });

            $('#object_editor_wrapper .editor_cancel').click(function(){
                $("#object_editor_wrapper").hide();
            });            
        }

        this.setActive = function(newIsActive){
            if(jQuery.type(newIsActive) == "boolean"){
                isActive = newIsActive;
                if(!isActive){
                    this.hideEditor();
                }
            }else{
                isActive = false;
            }
        }
        this.isActive = function(){
            return isActive;
        }

        this.isDirty = function(){
            return isDirty;
        }

        this.setActiveObjectType = function(newActiveObjectType){
            if(jQuery.type(newActiveObjectType) == "number"){
                activeObjectType = newActiveObjectType;
                if (newActiveObjectType!= activeObjectType) {
                }
            }else{
                activeObjectType = MAP_OBJECT_TYPES.MARKER;
            }
        }
        this.getActiveObjectType = function(){
            return activeObjectType;
        }

        this.showEditor = function(ev){
            displayObjectEditor(ev);
        }

        this.hideEditor = function(){
            $("#object_editor_wrapper.editor_wrapper").hide();
        }
        this.clearUserObjects = function(){
                mMapObjectManager.clearUserLayer();
        }

        displayObjectEditor = function(ev){
            $("#object_editor_wrapper .editor_holder").empty();

            JSONEditor.defaults.theme = 'spectre';
            JSONEditor.defaults.iconlib = 'spectre';
            
            var latlng = oMap.mouseEventToLatLng(ev.originalEvent);
            latlng = latlng.lng + "," + latlng.lat;

            var objectTypeString;
            if (activeObjectType == MAP_OBJECT_TYPES.MARKER){
                objectTypeString = "Marker";
            }else if (activeObjectType == MAP_OBJECT_TYPES.LABEL){
                objectTypeString = "Label";
            }

            var input_value = {
                "name": "",
                "popupContent": "",
                "popupLink": "",
                "labelText": "",
                "markerType": objectTypeString,
                "markerCoordinates": latlng,
                "labelCoordinates": latlng
            };

            if(typeof(initialValue.geometry) !== 'undefined'){
                delete initialValue.geometry;
            }

            initialValue = {
                ...initialValue,
                ...input_value
            }

            var options = {
                ajax: true,                
                schema: {
                    $ref: "lib/cosmograph/schemas/schema_mapobject.json"
                },
                no_additional_properties: true,
                disable_properties: true,
                disable_edit_json: true,
                // Not reliable
                show_errors: 'never', 
                startval: initialValue
            };

            let editorElement = $('#object_editor_wrapper .editor_holder').get(0);
            editor = new JSONEditor(editorElement, options);

            var markerLayers = mMapObjectManager.getMarkerLayers();
            $("#object_editor_wrapper .editor_layer_selector select").empty();
            
            if (previousLayer == null) previousLayer = mMapObjectManager.getUserLayerId();
            markerLayers.forEach(function(element,id){
                $("#object_editor_wrapper .editor_layer_selector select").append("<option value='" + id + "'>" + element.layerName + "</option>");
            });
            
            $("#object_editor_wrapper .editor_layer_selector select").prop('selectedIndex', previousLayer);

            editor.on("ready",()=>{
                editor.on('change',function(){
                    validateFields();
                });
                $("#object_editor_wrapper").show();
                $("#object_editor_wrapper .editor_layer_selector :input:enabled:visible:first").focus();
                isActive = true;
            });
        }

        validateFields = function(){
            errors = editor.validate();

            $("#object_editor_wrapper div.form-group").find("p.invalid-feedback").remove();

            if(errors.length == 0){
                $("#object_editor_wrapper .editor_submit").removeClass("disabled");
            }else{
                $("#object_editor_wrapper .editor_submit").addClass("disabled");

                $("#object_editor_wrapper div.form-group").each(function(idx,div){
                    errors.forEach(error => {
                        var errorName = String(error.path).replace(".","[").concat("]");
                        if($(div).find("input").attr('name') == errorName){
                            $(div).append("<p class='invalid-feedback' style='display: block;'>" + error.message + "</p>");
                        }                        
                    });
                });
            }
        }

        addObject = function(objectData, layer){
            if(!layer) layer = mMapObjectManager.getUserLayerId();
            if (isActive){
                mMapObjectManager.createMapObject(objectData,layer);
                isDirty = true;
                mMapMenu.setEditorDirty(isDirty);
            }
        }
    }

    function LayerEditor(){

        this.init = function(){
            $('#layer_editor_wrapper .editor_submit').click(function(){
                if(errors.length == 0){
                    var objectJSON = editor.getValue();

                    previousLayer = $("#layer_editor_wrapper .editor_layer_selector select").val();

                    // addObject(objectJSON, previousLayer);

                    $("#layer_editor_wrapper").hide();
                }
            });

            $('#layer_editor_wrapper .editor_cancel').click(function(){
                $("#layer_editor_wrapper").hide();
            });    

        }

        this.show = function(){
            displayLayerEditor();
        }
        this.hide = function(){
            $("#layer_editor_wrapper").hide();
        }

        displayLayerEditor = function(){

            $("#layer_editor_wrapper .editor_holder").empty();

            JSONEditor.defaults.theme = 'spectre';
            JSONEditor.defaults.iconlib = 'spectre';

            var input_value = {
                "name": "",
                "popupContent": ""
            };

            var options = {
                ajax: true,                
                schema: {
                    $ref: "lib/cosmograph/schemas/schema_layerobject.json"
                },
                no_additional_properties: true,
                disable_properties: true,
                disable_edit_json: true,
                // Not reliable
                show_errors: 'never'
            };

            let editorElement = $('#layer_editor_wrapper .editor_holder').get(0);
            editor = new JSONEditor(editorElement, options);

            var markerLayers = mMapObjectManager.getMarkerLayers();
            $("#layer_editor_wrapper .editor_layer_selector select").empty();
            
            // if (previousLayer == null) previousLayer = mMapObjectManager.getUserLayerId();
            markerLayers.forEach(function(element,id){
                $("#object_editor_wrapper .editor_layer_selector select").append("<option value='" + id + "'>" + element.layerName + "</option>");
            });
            
            // $("#object_editor_wrapper .editor_layer_selector select").prop('selectedIndex', previousLayer);

            editor.on("ready",()=>{
                editor.on('change',function(){
                    validateForm();
                });
                $("#layer_editor_wrapper").show();
                $("#layer_editor_wrapper .editor_layer_selector :input:enabled:visible:first").focus();
                isActive = true;
            });
            
        }

        addLayer = function(data, id){
            return false;
        }
        updateLayer = function(data, id){
            return false;
        }
        deleteLayer = function(id){
            return false;
        }

        validateForm = function(){
            errors = editor.validate();

            $("#layer_editor_wrapper div.form-group").find("p.invalid-feedback").remove();

            if(errors.length == 0){
                $("#layer_editor_wrapper .editor_submit").removeClass("disabled");
            }else{
                $("#layer_editor_wrapper .editor_submit").addClass("disabled");

                $("#layer_editor_wrapper div.form-group").each(function(idx,div){
                    errors.forEach(error => {
                        var errorName = String(error.path).replace(".","[").concat("]");
                        if($(div).find("input").attr('name') == errorName){
                            $(div).append("<p class='invalid-feedback' style='display: block;'>" + error.message + "</p>");
                        }                        
                    });
                });
            }
        }
    }

    function Utils(){

        // Simplifies making toasts. A toaster, if you will.
        this.toast = function(message, isGood, tDuration){
            var color;
            isGood = isGood ?? true;
            tDuration = tDuration ?? 3000;
            if(isGood){
                color = "LINEAR-GRADIENT(TO RIGHT, RGB(95, 84, 252), RGB(126, 158, 251))";
            }else{
                color = "LINEAR-GRADIENT(TO RIGHT, RGB(238, 58, 94), RGB(238, 124, 124))";
            }
            Toastify({
                text: message,
                duration: tDuration,
                gravity: "top", 
                position: "right",
                style: {
                    background: color,
                }
            }).showToast();
        };

        this.tryParseJSON = function(jsonString){
            try {
                var o = JSON.parse(jsonString);
                if (o && typeof o === "object") {
                    return o;
                }
            }
            catch (e) { }
            return false;
        };

        this.isObjectEmpty = function(obj) {
            for(var key in obj) {
                if(obj.hasOwnProperty(key))
                    return false;
            }
            return true;
        }

    }

}