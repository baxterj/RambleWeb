var footerContent
var myChart = null
var loadedTripsData = null

var routeFromShare = 0
var keepRouteFromShare = true

/*
Generate footer content for the first (non-ajax) loaded page. This html is stored for all
subsequent page changes as the footerContent variable
*/
$(document).ready(function(){
	$('.footer_content').html(genFooterHtml())
})

/*
Action while loading each ajax page. Insert footer HTML and draw relevant buttons
for current logged in/out state
*/
$('div[data-role="page"]').live('pageshow', function(event, data){
	if(footerContent != null){
		$('.footer_content').html(footerContent)
	}
	loggedInOutButton()
	accountButton()
})

/*
Load route page content, save intended route id in routeFromShare should the user be accessing 
the route without being logged in. This will re-direct them back to the route once they log in
*/
$('#page-viewRoute').live('pageshow', function(event, data){
	if(getUrlVars()["ref"] == 'external'){
		routeFromShare = parseInt(getUrlVars()["id"])
		console.log(routeFromShare)
	}
	redirectLoggedOut()
})

/*
Redirect logged out users to the login page for these pages
*/
$('#page-home, #logoutPage, #page-createByHand, #page-routesList, #page-notesphotos, #page-searchRoute, #page-viewImage, #page-account, #page-stats, #sharePage').live('pageshow', function(event, data){
	redirectLoggedOut()
})

/*
Redirect logged in users to the dashboard page for these pages
*/
$('#loginPage, #registerPage, #forgotPage, #resetPassPage').live('pageshow', function(event, data){
	redirectLoggedIn()
})

/*
Initialise content slider for index page
*/
$('#indexPage').live('pageinit', function(event, data){
	$('#slider').nivoSlider({
		effect: 'fade',
		pauseTime: 5000,
		randomStart: true,
		animSpeed: 500
	})
})

/*
Initialise graph page and add listeners for check boxes to refresh data
*/
$('#page-stats').live('pageshow', function(event, data){
	getTrackData()
	$('#tripSelect').change(function(){
		if(loadedTripsData != null){
			updateGraph(loadedTripsData)
		}
	})

	$('.graphFilter').change(function(){
		if(loadedTripsData != null){
			updateGraph(loadedTripsData)
		}
	})
})


/*
Initialise page select content swapper on dashboard page
*/
var routesSelectLinks = ['byHand.html', 'search.html', 'myRoutes.html?list=saved', 'myRoutes.html?list=fav']
$('#page-home').live('pageinit', function(event, data){
	showRoutesItem(1)
	$('.routes_text div').hover(
		function(){
			showRoutesItem($(this).attr('id').split('routetext')[1])
		}
	)

	$('.routes_images img').click(function(){
		$.mobile.changePage(routesSelectLinks[$(this).attr('id').split('routeimg')[1]-1])
	})
	$('.routes_text div').click(function(){
		$.mobile.changePage(routesSelectLinks[$(this).attr('id').split('routetext')[1]-1])
	})

	
})

/*
Display the hover content associated with num
*/
function showRoutesItem(num){
	$('.showing').hide().removeClass('showing')
	$('.greenBG').removeClass('greenBG')

	$('#routeimg'+num).show().addClass('showing')
	$('#routetext'+num+' span').show().addClass('showing')
	$('#routetext'+num).addClass('greenBG')
}

/*
Create the html for the footer
*/
function genFooterHtml(){
	var html=''
	html+='<div class="footer_links_holder">\n'
	html+='<div class="footer_links">Links<br/>\n'
	html+='<a href="http://www.ramblers.org.uk/">Ramblers Association</a><br/>\n'
	html+='<a href="http://www.naturalengland.org.uk/ourwork/enjoying/countrysidecode/default.aspx">Countryside Code (England &amp; Wales)</a><br/>\n'
	html+='</div>\n'
	html+='<div class="footer_links">Help<br/>\n'
	html+='<a href="privacyPolicy.html">Privacy Policy</a><br/>\n'
	html+='<a href="FAQ.html">FAQ</a><br/>\n'
	html+='<a href="forgot.html">Forgot Password</a><br/>\n'
	html+='<a href="mailto:support@rambleonline.com">Email Support</a><br/>\n'
	html+='</div>\n'
	html+='<div class="footer_links">Developer Contact<br/>\n'
	html+='<a href="mailto:baxterj405@gmail.com">Email</a><br/>\n'
	html+='<a href="http://www.linkedin.com/pub/james-baxter/27/99/80b">LinkedIn</a><br/>\n'
	html+='</div>\n'
	html+='<div class="clear"></div>\n'
	html+='</div>\n' //footer links holder
	html += '<div class="footer_img"><img src="assets/images/rambleon-logo-footer.png" /></div>\n'
	footerContent = html
	return html
}

/*
Generate log in button if currently logged out, and vice versa
*/
function loggedInOutButton(){
	if(checkLoggedIn()){
		$.mobile.activePage.find('.loginLogout span span').html('Logout')
		$.mobile.activePage.find('.loginLogout').attr('href', 'logout.html')
	}else{
		$.mobile.activePage.find('.loginLogout span span').html('Login')
		$.mobile.activePage.find('.loginLogout').attr('href', 'login.html')
	}
}

/*
Remove the account button from DOM if not logged in
*/
function accountButton(){
	if(!checkLoggedIn()){
		$.mobile.activePage.find('.accountBtn').remove()
	}
}


/*
Preload the nivo slider carousel images
*/
var imgObj = new Image()
preloadImages()
function preloadImages(){
	var urls= [
		'assets/images/ramble_carousel_1.png',
		'assets/images/ramble_carousel_2.png',
		'assets/images/ramble_carousel_2.png'
	]
	for(var i = 0; i < urls.length; i++){
		imgObj.src=urls[i]
	}
}

/*
Load graph options from passed data. Processes data and populates the dropdown menu accordingly
*/
function loadGraph(data){
	
	var trips = normaliseGraphData(data)
	loadedTripsData = trips

	var html = ''
	var numAdded = 1
	if(trips.length < 1){
		html = '<option value="-1">No Trips Found</option>\n'
	}else{
		for(var i = 0; i < trips.length; i++){
			var selected=''
			if(i == trips.length-1){
				selected='selected="selected"'
			}
			if(trips[i].speedPoints.length > 2){
				html += '<option value="' + i + '"'+selected+'>'+ numAdded +': ' + trips[i].date + '</option>'
				numAdded++
			}

			
		}
	}
	$('#tripSelect').html(html).selectmenu('refresh', true);
	

	updateGraph(trips)
}

/*
Handles refreshing of the chart, displaying speed, altitude, both or neither
*/
function updateGraph(trips){
	createChart()
	var noneChecked=true
	if($("#showSpeed").attr("checked")){
		if(trips[$('#tripSelect').val()].speedPoints.length > 1){
			myChart.setDataArray(trips[$('#tripSelect').val()].speedPoints, 'Speed')
			noneChecked=false
		}
		
		//console.log(trips[$('#tripSelect').val()].speedPoints)
	}

	if($("#showAltitude").attr("checked")){
		if(trips[$('#tripSelect').val()].altitudePoints.length > 1){
	//		console.log(trips[$('#tripSelect').val()])
			myChart.setDataArray(trips[$('#tripSelect').val()].altitudePoints, 'Altitude')
			noneChecked=false
		}
		
	}
	if(noneChecked){
		myChart.setDataArray([[0,0], [0,0]], 'None Selected')
	}
	
	myChart.draw()
}


/*
Create a new JSChart object with appropriate settings
*/
function createChart(){
	//var myData = new Array([10, 20], [15, 10], [20, 30], [25, 10], [30, 5]);
	myChart = new JSChart('chartcontainer', 'line');
	//myChart.setDataArray(myData, 'Speed');
	myChart.setErrors(false)
	myChart.setSize(800, 400);
	myChart.setTitle('Statistics against Time');
	myChart.setLineColor('#DD0000', 'Speed');
	myChart.setLineColor('#0000DD', 'Altitude');
	myChart.setLineWidth(4);
	myChart.setTitleColor('#7D7D7D');
	myChart.setAxisColor('#9F0505');
	myChart.setGridColor('#a4a4a4');
	myChart.setAxisValuesColor('#333639');
	myChart.setAxisNameColor('#333639');
	myChart.setLabelFontSize(12)
	myChart.setLabelColor('#333333')
	myChart.setLabelX([0, 'Trip Start']);
	myChart.setLabelPaddingBottom(15)
	myChart.setLabelPaddingLeft(15)
	myChart.setLineSpeed(100)

	myChart.setAxisNameY('Altitude(m), Speed(m/s)', true)
	myChart.setAxisNameX('Seconds since trip start')

	myChart.setLegendDetect(true)
	myChart.setLegendShow(true)

	// myChart.draw();
}

/*
Process returned speed track data. Splits it into trips at least 10 minutes apart
*/
function normaliseGraphData(data){
	//var s = data.objects[0].dateRecorded.split(' ')//day month year hour min sec
	var startDate = new Date(1990, 1, 1, 1, 1, 1)
	var prevDate = startDate
	var trips = new Array()
	var tripCounter = -1
	for(var i = 0; i < data.objects.length; i++){
		var c = data.objects[i].dateRecorded.split(' ')//day month year hour min sec
		var thisDate = new Date(c[2], c[1]-1, c[0], c[3], c[4], c[5])//-1 cause months start at 0
		var xOffset = Math.ceil(thisDate - startDate) / 1000 //calculate to second precision
		var lastOffset = Math.ceil(thisDate - prevDate) / 1000 //calculate to second precision
		if(lastOffset > 600){ //if ten minutes between readings, make a new trip
			tripCounter++
			startDate = thisDate
			trips[tripCounter] = {
				date: startDate.toUTCString(),
				speedPoints: [[0, parseFloat(data.objects[i].speed)]],
				altitudePoints: [[0, parseFloat(data.objects[i].altitude)]]
			}
		}else{//STARTDATE SHOULD BECOME LASTDATE OR SOMETHING
			trips[tripCounter].speedPoints.push([xOffset, parseFloat(data.objects[i].speed)])
			trips[tripCounter].altitudePoints.push([xOffset, parseFloat(data.objects[i].altitude)])
		}
		prevDate = thisDate
	}
	return trips

}