var activeMap;
var activeRouteData

var mapZoom = 10;
var maps = {
	routeMap: null,
	editMap: null,
	searchMap: null,
	noteMap: null,
	trackedMap: null,
	createMap: null
}


var enableNotesPhotos = true

var geoLocOptions = { 
	maximumAge: 30000,
	timeout: 20000//,
	//enableHighAccuracy: true
}

var newItemMarker
var activeMarker
var activeRouteMarker
var pathEndMarker

var currPosMarkerSettings = {
		position: new google.maps.LatLng(0, 0),
		title: 'You are Here',
		icon: 'assets/images/youarehere-map-icon.png',
		zIndex: 99499,
		optimized: false,
		clickable:false
	}
var currentPositionMarker = new google.maps.Marker(currPosMarkerSettings);

var infowindow = new google.maps.InfoWindow({
	content: ''
});

google.maps.event.addListener(infowindow,"closeclick",function(){
	if(activeMarker != null){
		activeMarker.setMap(null)
	}
})

var geocoder

var notesContent = []
var imagesContent = []
var routesContent = []

var noteMarkers = new google.maps.MVCArray();
var imageMarkers = new google.maps.MVCArray();
var routeMarkers = new google.maps.MVCArray();

var createLine
var geoLocID

var trackingPaused = true

var noteImageRefreshEnabled = true
var refreshTimer
var routeRefreshEnabled = true
var routeRefreshTimer

var recordPositionTimer
var recordPosition = false

var trackDataEnabled = false
var trackDataTimer = setTimeout("trackDataEnabled = true", 30000)

var speedMeasurements = []
var altitudeMeasurements = []

var deleteMessageTarget

var oms
var spiderfied = false
var omsOptions = {
	markersWontMove: true,
	markersWontHide: true,
	keepSpiderfied: true,
	nearbyDistance: 30,
	circleSpiralSwitchover: Infinity //always use a circle
}

/*
Onload function for the route page. 
initialises the map for this page
sets the height of the map panel and the active map
*/
$('#page-viewRoute').live('pageshow', function(event){
	createMapRoute()
	activeMap = maps.routeMap
})

/*
Onload function for the search page. 
initialises the map for this page
sets the height of the map panel and the active map
*/
$('#page-searchRoute').live('pageshow', function(event){
	createMapSearch()
	activeMap = maps.searchMap
	
})

/*
Onload function for the by hand creation page. 
initialises the map for this page
sets the height of the map panel and the active map
*/
$('#page-createByHand').live('pageshow', function(event){
	createMapByHand()
	activeMap = maps.createMap
	
	
})

/*
Onload function for the notes and photos page. 
initialises the map for this page
sets the height of the map panel and the active map
*/
$('#page-notesphotos').live('pageshow', function(event){
	createMapNotesPhotos()
	activeMap = maps.noteMap
	fillImgPopup()
})

//kill gps when not on a relevant page, to save battery
$('#page-home, #page-create, #page-routesList').live('pageshow', function(event, data){
	endPositionWatch()
})

// $('#page-viewRoute, #page-searchRoute, #page-createByHand, #page-createTracked, #page-notesphotos').live('orientationchange', function(event){
	//nothing needed
// })



/*
Use google maps Geocoder api to find the location of input location (search page)
*/
function findMapLocation(location, messageTarget){
	if(location != null && location != ''){
		geocoder = new google.maps.Geocoder();
		var oldLatLngBounds = activeMap.getBounds()
		geocoder.geocode( { 
			address: location,
			region: 'gb',
			}, 
			function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					activeMap.fitBounds(results[0].geometry.viewport)
					if(oldLatLngBounds.equals(activeMap.getBounds())){
						activeMap.panBy(0, 1)//refresh map
					}
				}else{
					messageTarget.html('Could not find address')
				}
			});
	}else{
		activeMap.panBy(0, 1)//refresh map
	}
	

}


/*
Load a route from returned data, onto the route page.
creates a delete button if the current user owns the route
*/
function loadRoute(data, messageTarget){
	//if(maps.routeMap == null){//map not loaded yet, try again in 1 second
	//	setTimeout("loadRoute(data, messageTarget)", 1000);
	//}else{

		activeRouteData = data

		maps.routeMap.setCenter(new google.maps.LatLng(data.pathpoints[0].lat, data.pathpoints[0].lng))
		maps.routeMap.setZoom(14)
		maps.routeMap.route = makePolyLine('#DD0000', false)
		maps.routeMap.route.setMap(maps.routeMap); //assign route poly to route map
		buildPathFromCoords(data, maps.routeMap.route)
		setPathEndMarker(data, maps.routeMap)
		$.mobile.activePage.find('.map_page_content h3').html(data.name)
		$.mobile.activePage.find('#routeInfo p').html(routeInfoHTML(data))
		createFavDoneButtons(data.id, data.fav, data.done, data.favCount, data.doneCount)

		if(userOwns(data.owner.username)){
			createDeleteButton('route', data.id, null, null)
		}else{
			$.mobile.activePage.find('.deleteButton').attr('onClick', 'alert(\'You do not own this Route\')')
		}

	//}
}

/*
Update notes and photos on the currently active map
*/
function updateNotesPhotos(map, limitByZoom){
	var doUpdate = true
	if(limitByZoom){
		if(activeMap.getZoom() < 9){
			clearMarkerArray(noteMarkers)
			clearMarkerArray(imageMarkers)
			doUpdate = false
		}
	}
	
	if(doUpdate){
		clearTimeout(refreshTimer)
		refreshTimer = setTimeout("noteImageRefreshEnabled = true", 500);

		if(noteImageRefreshEnabled){
				noteImageRefreshEnabled = false
				getNotesPhotos(map)
		}
	}

}

/*
Update route icons on currently active map (search map)
*/
function updateSearchRoutes(map){
	clearTimeout(routeRefreshTimer)
	routeRefreshTimer = setTimeout("routeRefreshEnabled = true", 500);

	if(routeRefreshEnabled){
		routeRefreshEnabled = false
		getSearchRoutes(map)
	}
}

/*
Place route markers onto the search map
*/
function drawRoutes(data, messageTarget){
	if(activeMap == maps.searchMap && !spiderfied){
		clearMarkerArray(routeMarkers)

		routesContent = data.objects

		var marker
		for(var i = 0; i < data.objects.length; i++){
			//make marker for each
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(data.objects[i].pathpoints[0].lat, data.objects[i].pathpoints[0].lng),
				map: activeMap,
				icon: 'assets/images/route-map-icon.png',
				title: data.objects[i].name,
				num: i,
				optimized: false,
				clickable: true,
				zIndex: 99999,
				mtype: 'route'
			});
			routeMarkers.push(marker)
			oms.addMarker(marker)
			// google.maps.event.addListener(marker,"click",function(){
			// 	showRouteContent(this)
			// });

		}
	}
	
}

/*
Load the info for the currently selected route on the search map
If this is the first route selected, open the route details panel (so the user is aware of it)
*/
function showRouteContent(marker){
	var data = routesContent[marker.num]//this will contain info & first pathpoint

	getRoute(data.id, loadSearchRoute)

	if(maps.searchMap.route != null){
		maps.searchMap.route.setMap(null)
	}
	
	maps.searchMap.setCenter(new google.maps.LatLng(data.pathpoints[0].lat, data.pathpoints[0].lng))
	maps.searchMap.setZoom(15)

	$.mobile.activePage.find('#search-routeInfo p').html(routeInfoHTML(data))
	createFavDoneButtons(data.id, data.fav, data.done, data.favCount, data.doneCount)
	$.mobile.activePage.find('.search_routelink a').attr('href', 'route.html?id='+data.id)

}

/*
Load the actual path for the currently previewed route, once data has returned from server
*/
function loadSearchRoute(data, messageTarget){
	maps.searchMap.route = makePolyLine('#FF0000', false)
	maps.searchMap.route.setMap(maps.searchMap); //assign route poly to route map
	buildPathFromCoords(data, maps.searchMap.route)
	setPathEndMarker(data, maps.searchMap)
}

/*
Add the notes markers to the map
*/
function drawNotes(data, messageTarget){

	clearMarkerArray(noteMarkers)

	notesContent = data.objects
	
	var mar
	for(var i = 0; i < data.objects.length; i++){
		//make marker for each
		mar = new google.maps.Marker({
			position: new google.maps.LatLng(data.objects[i].lat, data.objects[i].lng),
			map: activeMap,
			icon: 'assets/images/note-map-icon.png',
			title: data.objects[i].title,
			num: i,
			optimized: false,
			clickable: true,
			zIndex: 1,
			mtype: 'note'
		});
		noteMarkers.push(mar)
		oms.addMarker(mar)
		// google.maps.event.addListener(marker,"click",function(){
		// 	//processMarker(this)
		// });
		
	}
}

/*
Display content for the currently selected note
*/
function showNoteContent(marker){
	var cont = notesContent[marker.num]
	var html = '<div class="noteImageContent">\n'
	html+= '<div class="ni_title">' + cont.title + '</div>\n'
	html+= '<p>' + cont.content + '</p>\n'
	html+= '<div class="ni_info"><b>Owner: </b><span class="' + isUserClass(cont.owner.username) + '">' + cont.owner.username + '</span><br />\n'
	html+= '<b>Private: </b>' + yesTrue(cont.private) + '<br />\n'
	html+= '<b>Created: </b>' + cont.creationDate + '<br />\n'
	html+= '<b>Updated: </b>' + cont.updateDate + '<br />\n'
	
	if(userOwns(cont.owner.username)){
		html+= '<a class="deleteButton styleLink">Delete Note</a>'
	}
	html+= '</div>\n'
	
	html+= '</div>'

	infowindow.setContent(html)

	

	if(activeMarker != null){
		activeMarker.setMap(null)
	}
	activeMarker = cloneMarker(marker)
	activeMarker.setZIndex(0)
	infowindow.open(activeMap, activeMarker)


	if(userOwns(cont.owner.username)){
		createDeleteButton('note', cont.id, null, null)
	}
}


/*
Add image markers to the map
*/
function drawImages(data, messageTarget){

	clearMarkerArray(imageMarkers)

	imagesContent = data.objects

	var mar
	for(var i = 0; i < data.objects.length; i++){
		//make marker for each
		mar = new google.maps.Marker({
			position: new google.maps.LatLng(data.objects[i].lat, data.objects[i].lng),
			map: activeMap,
			icon: 'assets/images/image-map-icon.png',
			title: data.objects[i].title,
			num: i,
			optimized: false,
			clickable: true,
			zIndex: 1,
			mtype: 'image'
		});
		imageMarkers.push(mar)
		oms.addMarker(mar)
		// google.maps.event.addListener(marker,"click",function(){
		// 	processMarker(this)
		// });

	}
}

/*
Display content for the currently selected image
*/
function showImageContent(marker){
	var cont = imagesContent[marker.num]
	var html = '<div class="noteImageContent">\n'
	html+= '<div class="ni_title">'+ cont.title + '</div><br />\n'
	html+= '<a href="viewImage.html?id='+cont.id + '">'
	html+= '<img src="'+ cont.thumbnail +'" /></a> <br />\n'
	html+= '<p>' + cont.text + '</p>\n'
	html+= '<div class="ni_info"><b>Owner: </b><span class="' + isUserClass(cont.owner.username) + '">' + cont.owner.username + '</span><br />\n'
	// html+= '<b>Private: </b>' + yesTrue(cont.private) + '<br />\n'
	// html+= '<b>Created: </b>' + cont.creationDate + '<br />\n'
	// html+= '<b>Updated: </b>' + cont.updateDate + '<br />\n'
	html+= '</div>\n'
	html+= '</div>'
	
	infowindow.setContent(html)
	if(activeMarker != null){
		activeMarker.setMap(null)
	}

	activeMarker = cloneMarker(marker)
	activeMarker.setZIndex(0)
	infowindow.open(activeMap, activeMarker)
}

/*
Used by overlapping marker spiderfier (OMS), as the click function for every OMS marker
*/
function processMarker(marker){
	if(marker.mtype=='note'){
		showNoteContent(marker)
	}else if(marker.mtype=='image'){
		showImageContent(marker)
	}else if(marker.mtype=='route'){
		showRouteContent(marker)
	}
}

/*
Clears an MVCArray of markers, and removes them from their current map
*/
function clearMarkerArray(arr){
	for(var i = 0; i < arr.getLength(); i++){ 
		arr.getAt(i).setMap(null)
		oms.removeMarker(arr.getAt(i))
	}
	arr.clear()
}

/*
Sets all markers in an MVCArray to a new map
*/
function setNewMap(arr, map){
	for(var i = 0; i < arr.getLength(); i++){ 
		arr.getAt(i).setMap(map)
	}
}

/*
Add a new pathpoint to the route creation line
*/
function newRoutePoint(map, event){
	createLine.getPath().push(event.latLng);
}

/*
Remove the newest point from the route creation line
*/
function undoLastPoint(){
	if(createLine != null && createLine.getPath() != null && createLine.getPath().getLength() > 0){
		createLine.getPath().pop()
	}
}

/*
Create a new Overlapping Marker Spiderfier instance. Necessary when a new map is loaded
*/
function resetOMS(map){
	oms = new OverlappingMarkerSpiderfier(map, omsOptions);
	oms.addListener('click', function(marker) {
		processMarker(marker)
	})
	oms.addListener('spiderfy', function(moved, unmoved){
		spiderfied = true
		for(var i = 0; i < moved.length; i++){
			moved[i].setIcon(moved[i].icon.split('.png')[0]+'-hi.png')
		}
	})
	oms.addListener('unspiderfy', function(moved, unmoved){
		spiderfied = false
		for(var i = 0; i < moved.length; i++){
			moved[i].setIcon(moved[i].icon.split('-hi.png')[0]+'.png')
		}
		if(enableNotesPhotos){
			updateNotesPhotos(activeMap)
		}
		// if(activeMap == maps.searchMap){
		// 	updateSearchRoutes(activeMap)
		// }
	})
}

/*
Create the map for the route page
*/
function createMapRoute(){
	
	var mapOptions = {
		center: new google.maps.LatLng(52.803280, -1.871453),
		zoom: 6,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};
	
	maps.routeMap = new google.maps.Map(document.getElementById("map_canvas_route"),
		mapOptions);

	//enableNotesPhotos = true

	resetOMS(maps.routeMap)

	// if(routeFromShare != 0){
	// 	getRoute(routeFromShare, loadRoute)
	// 	if(!keepRouteFromShare){
	// 		routeFromShare = 0
	// 	}
	// }else{
		setTimeout(function(){
			getRoute(getUrlVars()['id'], loadRoute);
			
		}, 500) //url vars dont load before this event fires so we wait
	//}

	google.maps.event.addListener(maps.routeMap, 'idle', function() {
		if(!spiderfied){
			if(enableNotesPhotos){
				updateNotesPhotos(maps.routeMap)
			}
		}
		
	})



}

/*
Create the map for the 'by hand' creation page.
Initialises the new route line and adds click listeners
*/
function createMapByHand(){
	var mapOptions = {
		center: new google.maps.LatLng(52.803280, -1.871453),
		zoom: 6,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};

	var oldCenter
	var oldZoom
	if(maps.createMap != null){
		oldCenter = maps.createMap.getCenter()
		oldZoom = maps.createMap.getZoom()
	}

	maps.createMap = new google.maps.Map(document.getElementById("map_canvas_byhand"),
		mapOptions);

	if(oldCenter != null){
		maps.createMap.setCenter(oldCenter)
		maps.createMap.setZoom(oldZoom)
	}

	resetOMS(maps.createMap)

	google.maps.event.addListener(maps.createMap, 'click', function(event) {
		newRoutePoint(this, event)
	})

	google.maps.event.addListener(maps.createMap, 'idle', function() {
		if(!spiderfied){
			if(enableNotesPhotos){
				updateNotesPhotos(maps.createMap)
			}
		}
	})

	if(createLine != null){
		createLine.setMap(maps.createMap)
		if(createLine.getPath().getAt(0) != null){
			maps.createMap.panTo(createLine.getPath().getAt(0))
			maps.createMap.setZoom(13)
		}else{
			//goToCurrentPosition()
		}
		
	}else{
		createLine = makePolyLine('#DD0000', true)
		createLine.setMap(maps.createMap)
		loadCreateLine(maps.createMap)//loads from window.localstorage if exists
	}

}

/*
Create the map for tracked routes
Also starts GPS tracking after 1 second
*/
function createMapTracked(){
	var mapOptions = {
		center: new google.maps.LatLng(52.803280, -1.871453),
		zoom: 6,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};


	var oldCenter
	var oldZoom
	if(maps.trackedMap != null){
		oldCenter = maps.trackedMap.getCenter()
		oldZoom = maps.trackedMap.getZoom()
	}

	maps.trackedMap = new google.maps.Map(document.getElementById("map_canvas_tracked"),
		mapOptions);

	if(oldCenter != null){
		maps.trackedMap.setCenter(oldCenter)
		maps.trackedMap.setZoom(oldZoom)
	}

	//enableNotesPhotos = true

	resetOMS(maps.trackedMap)

	google.maps.event.addListener(maps.trackedMap, 'idle', function() {
		if(!spiderfied){
			if(enableNotesPhotos){
				updateNotesPhotos(maps.trackedMap)
			}
		}
	})


	if(createLine != null){
		createLine.setMap(maps.trackedMap)
	}else{
		loadCreateLine(maps.trackedMap)//loads from window.localstorage
	}



}

/*
Creates the search map
*/
function createMapSearch(){
	var mapOptions = {
		center: new google.maps.LatLng(52.803280, -1.871453),
		zoom: 6,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};

	var oldCenter
	var oldZoom
	if(maps.searchMap != null){
		oldCenter = maps.searchMap.getCenter()
		oldZoom = maps.searchMap.getZoom()
	}else{
		//enableNotesPhotos = false
	}

	maps.searchMap = new google.maps.Map(document.getElementById("map_canvas_search"),
		mapOptions);

	if(oldCenter != null){
		maps.searchMap.setCenter(oldCenter)
		maps.searchMap.setZoom(oldZoom)
	}

	resetOMS(maps.searchMap)

	google.maps.event.addListener(maps.searchMap, 'idle', function() {
		if(!spiderfied){
			if(enableNotesPhotos){
				updateNotesPhotos(maps.searchMap)
			}
			updateSearchRoutes(maps.searchMap)
		}
		
	})



}


/*
Creates the notes and photos map
Initialises the 'new item marker' for placing new notes & photos
*/
function createMapNotesPhotos(){
	
	var mapOptions = {
		center: new google.maps.LatLng(52.803280, -1.871453),
		zoom: 6,
		mapTypeId: google.maps.MapTypeId.TERRAIN,
		zoomControl: true
	};

	var oldCenter
	var oldZoom
	if(maps.noteMap != null){
		oldCenter = maps.noteMap.getCenter()
		oldZoom = maps.noteMap.getZoom()
	}

	maps.noteMap = new google.maps.Map(document.getElementById("map_canvas_notesphotos"),
		mapOptions);
	console.log('map created')

	if(oldCenter != null){
		maps.noteMap.setCenter(oldCenter)
		maps.noteMap.setZoom(oldZoom)
	}

	resetOMS(maps.noteMap)

	google.maps.event.addListener(maps.noteMap, 'idle', function() {
		if(!spiderfied){
			if(enableNotesPhotos){
				updateNotesPhotos(maps.noteMap)
			}
		}
	})



	if(newItemMarker != null){
		newItemMarker.setMap(maps.noteMap)
	}else{
		//first page visit for notes and photos
		//enableNotesPhotos = true

		//goToCurrentPosition()
		newItemMarker = new google.maps.Marker({
			position: maps.noteMap.getCenter(),
			title: 'New item created here',
			map: maps.noteMap,
			icon: 'assets/images/newNotePhoto.png',
			zIndex: 99989,
			draggable: true,
			optimized: false
		});
	}


	
}


/*
Create favourite and done toggle buttons.  This is used on the route page and the search page
*/
function createFavDoneButtons(routeID, fav, done, favCount, doneCount){
	$.mobile.activePage.find('.route_favbuttons .favBtn img').attr('src', 'assets/images/fav_'+fav+'_mini.png')
	$.mobile.activePage.find('.route_favbuttons .doneBtn img').attr('src', 'assets/images/done_'+done+'_mini.png')
	$.mobile.activePage.find('.route_favbuttons .favBtn').attr('onClick', 'flipFavBtn('+routeID+', '+!fav+')')
	$.mobile.activePage.find('.route_favbuttons .doneBtn').attr('onClick', 'flipDoneBtn('+routeID+', '+!done+')')
	if($.mobile.activePage.attr('id') == 'page-searchRoute'){
		var doneBtn = $.mobile.activePage.find('.route_favbuttons .doneBtn')
		var favBtn = $.mobile.activePage.find('.route_favbuttons .favBtn')
		doneBtn.html(doneBtn.html().slice(0, - 1))
		favBtn.html(favBtn.html().slice(0, - 1))
		doneBtn.append(doneCount)
		favBtn.append(favCount)
	}
}

/*
Switch the favourite button to active or inactive dependent on 'bool'
*/
function flipFavBtn(routeID, bool){
	changeFav(routeID, bool)
	$.mobile.activePage.find('.route_favbuttons .favBtn').attr('onClick', 'flipFavBtn('+routeID+', '+!bool+')')
	$.mobile.activePage.find('.route_favbuttons .favBtn img').attr('src', 'assets/images/fav_'+bool+'_mini.png')
}

/*
Switch the done button to active or inactive dependent on 'bool'
*/
function flipDoneBtn(routeID, bool){
	changeDone(routeID, bool)
	$.mobile.activePage.find('.route_favbuttons .doneBtn').attr('onClick', 'flipDoneBtn('+routeID+', '+!bool+')')
	$.mobile.activePage.find('.route_favbuttons .doneBtn img').attr('src', 'assets/images/done_'+bool+'_mini.png')
}

/*
Assign a polyline object to follow a particular path, 
derived from a passed data object containing pathpoints
*/
function buildPathFromCoords(data, polyLine){
	var path = polyLine.getPath()
	for(var i = 0; i < data.pathpoints.length; i++){
		path.push(new google.maps.LatLng(data.pathpoints[i].lat, data.pathpoints[i].lng))
	}
}


/*
Add a 'finish flag' icon to the end of a path
*/
function setPathEndMarker(data, map){
	if(pathEndMarker != null){
		pathEndMarker.setMap(null)
	}

	var maxRef = data.pathpoints.length - 1
	pathEndMarker = new google.maps.Marker({
		position: new google.maps.LatLng(data.pathpoints[maxRef].lat, data.pathpoints[maxRef].lng),
		map: map,
		icon: 'assets/images/finish-map-icon.png',
		title: 'Route Finish',
		optimized: false,
		clickable: false,
		zIndex: 99999
	})

}

/*
Create a new polyline with a given colour and editable status
*/
function makePolyLine(color, editable){
	var polyOptions = {
		strokeColor: color,
		strokeOpacity: 0.8,
		strokeWeight: 3,
		editable: editable,
		optimized: false
	}

	return new google.maps.Polyline(polyOptions);
}

/*
Increment the zoom of the map, either zoom in or out
*/
function setMapZoom(zoomout){
	if(zoomout){
		map.setZoom(--mapZoom);
	}else{
		map.setZoom(++mapZoom);
	}
}

/*
Set the height of the map container.  This depends on the height of the window, height of the footer,
height of the header, and height of any given non-map content on the page
*/
function sortMapHeight(nonMapContentClass){
	$.mobile.activePage.find('.map_content').css('height', $(window).height()
	 - $.mobile.activePage.find('.map_header').outerHeight()
	 - $.mobile.activePage.find('.ui-footer').outerHeight() )

	if(nonMapContentClass != null){
		$.mobile.activePage.find('.map_canvas').css('height', 
			$.mobile.activePage.find('.map_content').outerHeight() 
			- $.mobile.activePage.find(nonMapContentClass).outerHeight() )
	}
}

/*
Create a shallow copy of a marker. Used to retain the active note/photo/route marker when the 
rest of the map refreshes
*/
function cloneMarker(marker){
	newMarker = new google.maps.Marker({
			position: marker.position,
			map: marker.map,
			icon: marker.icon,
			title: marker.title,
			num: marker.num,
			optimized: marker.optimized,
			clickable: marker.clickable,
			mtype: marker.mtypqe
		});

	return newMarker
}

/*
Move a given marker to the center of the map viewport. this is used for the new item marker 
when creating a note or photo
*/
function centerMarker(marker){
	marker.setPosition(activeMap.getCenter())
}

/*
Toogle, or explicitly set, note and photo markers on the active map
*/
function setEnableNotesPhotos(bool){
	if(bool != null){
		if(bool){
			enableNotesPhotos = true
			updateNotesPhotos(activeMap)
		}else{
			enableNotesPhotos = false
			clearMarkerArray(noteMarkers)
			clearMarkerArray(imageMarkers)
		}
	}else{
		setEnableNotesPhotos(!enableNotesPhotos)
	}
	
}

/*
Start reporting device location to the map's current position marker
*/
function trackCurrentPosition(map){
	startPositionWatch(false)
	if(currentPositionMarker == null){
		currentPositionMarker = new google.maps.Marker(currPosMarkerSettings);
	}
	
	currentPositionMarker.setMap(map)
}

/*
Get a textual, coordinate representation of the current device location
*/
function currentPosition(){
	showAjaxLoad(true)
	navigator.geolocation.getCurrentPosition(getPositionSuccess, getPositionError, geoLocOptions);
}

/*
Copy current coordinates into HTML
*/
function getPositionSuccess(position){
	showAjaxLoad(false)
	if($.mobile.activePage.attr('id') == 'page-searchRoute'){
		$.mobile.activePage.find('#searchLocation').val( 
			Math.round( position.coords.latitude * 1000000 ) / 1000000 + ', ' //rounds to 6 DP
			 + Math.round( position.coords.longitude * 1000000 ) / 1000000
		)
	}
}

/*
Handle the success of finding Geolocation.
If required, records the position to the route creation line
Adds the current speed and altitude to an array, to be averaged and sent every 30 seconds
*/
function trackingPositionSuccess(position){
	if(createLine != null && recordPosition){
		if(position.coords.accuracy < 20){//only record if estimated gps accuracy is within 20 meters
			activeMap.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))
			createLine.getPath().push(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))
			recordPosition = false

			//save the tracked route in case of crash
			saveCreateLine()

			//wait 10 seconds until do this again
			recordPositionTimer = setTimeout("recordPosition = true", 15000); //15 seconds
		}
	}

	if(position.coords.accuracy < 20){
		speedMeasurements.push(position.coords.speed)
		altitudeMeasurements.push(position.coords.altitude)

		if(trackDataEnabled){
			sendTrackData(avgArray(speedMeasurements), avgArray(altitudeMeasurements))
			clearTrackAverages()
		}
	}

	currentPositionMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))

}

/*
Load the saved create line onto the passed map, or create a new line if no saved record exists
*/
function loadCreateLine(map){
	if(window.localStorage.getItem('trackingPathString') != null){
		if(createLine == null){
			createLine = makePolyLine('#DD0000', true)
		}
		createLine.setMap(map)
		
		path = JSON.parse(window.localStorage.getItem('trackingPathString')).points
		for(var i = 0; i < path.length; i++){
			createLine.getPath().push(new google.maps.LatLng(path[i].lat, path[i].lng))
		}
	}
}

/*
Save the currently active route to localstorage. Used for backup against crashes
*/
function saveCreateLine(){
	var coords = []
	for(var i = 0; i < createLine.getPath().getLength(); i++){
		coords.push({
			lat: createLine.getPath().getAt(i).lat(),
			lng: createLine.getPath().getAt(i).lng()
		})
	}
	var pathJSON = {points: coords}
	window.localStorage.setItem('trackingPathString', JSON.stringify(pathJSON))
}

/*
Attempt to move the map to the device's current position
*/
function goToCurrentPosition(){
	showAjaxLoad(true)
	navigator.geolocation.getCurrentPosition(goToPositionSuccess, getPositionError, geoLocOptions);
}

/*
Move the map to the device's current position
*/
function goToPositionSuccess(position){
	showAjaxLoad(false)
	activeMap.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude))
	activeMap.setZoom(13)

	if($.mobile.activePage.attr('id') == 'page-notesphotos'){
		centerMarker(newItemMarker)
	}
}

/*
Silently ignore position errors. Failure is evident enough
*/
function getPositionError(error) {
	showAjaxLoad(false)
	// alert('finding location failed:\n'
	// 	+'code: '    + error.code    + '\n' +
	// 	'message: ' + error.message + '\n');
}

/*
Activate phonegap geolocation api for position watching
*/
function startPositionWatch(createRoute){
	if(createRoute){
		activeMap.setZoom(15)
		if(createLine == null){
			createLine = makePolyLine('#DD0000', createRoute)
		}
		createLine.setMap(activeMap)
	}

	clearTrackAverages()
	navigator.geolocation.clearWatch(geoLocID);
	geoLocID = null
	geoLocID = navigator.geolocation.watchPosition(trackingPositionSuccess, getPositionError, geoLocOptions);
}

/*
Stop watching position with phonegap api
*/
function endPositionWatch(){
	clearTimeout(recordPositionTimer)
	navigator.geolocation.clearWatch(geoLocID);
	geoLocID = null
}

/*
pause watching position.  This does not actually pause the watching, but deactivates the visible effects
*/
function pausePositionWatch(pause){
	if(pause){
		clearTimeout(recordPositionTimer)
		recordPosition = false
	}else{
		recordPosition = true
	}
}

/*
Listener for tracking slider activation
Pause or resume tracking based on slider value
*/
$("#pauseTrack").live("slidestop", function(event, ui) {
	if($(this).val() == 'track'){
		if(trackingPaused){
			if(createLine == null){
				startPositionWatch(true)
			}
			trackingPaused = false
			pausePositionWatch(false)
		}
	}else if($(this).val() == 'pause'){
		if(!trackingPaused){
			trackingPaused = true
			pausePositionWatch(true)
		}
	}
});

/*
Ask to confirm reset the creation of a route
*/
function resetCreation(ignoreWarning){
	if(ignoreWarning){
		doCreationReset()
	}else{
		if(confirm('Reset route creation?')){
			doCreationReset()			
		}
	}
	
}

/*
Do the reset of creation. Clears all backups and resets phonegap geolocation api state
*/
function doCreationReset(){
	if(createLine != null){
		createLine.getPath().clear()
	}

	window.localStorage.removeItem('trackingPathString')
	
	if($.mobile.activePage.attr('id') == 'page-createTracked'){
		trackingPaused = true
		pausePositionWatch(true)
		$('#pauseTrack').val('pause').slider('refresh')	
	}
}

/*
Clear the stored averages for speed and altitude, necessary every time these stats are submitted
*/
function clearTrackAverages(){
	speedMeasurements = []
	altitudeMeasurements = []
	trackDataEnabled = false
	trackDataTimer = setTimeout("trackDataEnabled = true", 30000) //30 seconds
}