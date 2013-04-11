/*
Remove 'px' from the end of the input string.  Useful with some calculations of height and width
*/
function stripPX(inp){
	return inp.split('px', [0])
}

/*
Prevent the footer bar from hiding when the screen is tapped
*/
$(document).on('pageinit','[data-role=page]', function(){
	$('[data-position=fixed]').fixedtoolbar({ tapToggle:false});
});

/*
Run validation parameters on the input field. Display a suitable message if not passing the test
*/
function validateField(field, fieldName, messageTarget, rule, required, min, max){
	if(messageTarget != null){
		messageTarget.html('&nbsp;')
	}
	var text = field.val().trim()
	if(required){
		if (text==null || text==''){
			messageTarget.html(fieldName + ' is required')
			return false
		}
	}
	if(min){
		if(text.length < min && required){
			messageTarget.html(fieldName + ' must be min ' + min + ' characters')
			return false
		}
	}
	if(max){
		if(required || text.length > 0){
			if(text.length > max){
				messageTarget.html(fieldName + ' must be max ' + max + ' characters')
				return false
			}
		}
	}

	if(rule){
		if(required || text.length > 0){
			if(!testInputRule(rule, text)){
				messageTarget.html(fieldName + ' contains invalid characters')
				return false
			}
		}
		
	}

	return true
}

/*
Test a given string against certain named regex rules, return false if a match is not made
*/
function testInputRule(rule, text){
	if(rule == 'alphanum'){
		var reg = /^([a-zA-Z0-9 _-]*)$/
		return reg.test(text)
	}else if(rule == 'email'){
		var reg = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		return reg.test(text)
	}else if(rule == 'password'){
		var reg = /^[\w!@#%&/(){}[\]=?+*^~\-_ .:,;]*$/
		return reg.test(text)
	}else if(rule == 'num'){
		var reg = /^[0-9]*$/
		return reg.test(text)
	}
	return false
}

/*
Test for the equality of two fields, optional case sensitivity
*/
function fieldsEqual(first, second, setName, messageTarget, caseSensitive){
	if(!caseSensitive){
		firstVal = first.val().toLowerCase()
		secondVal = second.val().toLowerCase()
	}else{
		firstVal = first.val()
		secondVal = second.val()
	}

	if(firstVal != secondVal){
		messageTarget.html(setName + ' must be the same')
		return false
	}
	return true
}

/*
Hides the footer bar if the keyboard is activated, as it pops up to be on top of the keyboard area.
This gives more screen space above the keyboard
*/
var initialScreenSize = window.innerHeight;
window.addEventListener("resize", function() {
	if(window.innerHeight < initialScreenSize){
		$.mobile.activePage.find("[data-role=footer]").hide();
	}else{
		$.mobile.activePage.find("[data-role=footer]").show();
	}
});

/*
Gets a hashmap of the query string.  access as v = getUrlVars()['username']
*/
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

/*
Return 'Yes' or 'No' for true and false, useful for generating HTML sections
*/
function yesTrue(bool){
	if(bool){
		return 'Yes'
	}else{
		return 'No'
	}
}

/*
Set the title of the current screen
*/
function pageHeader(newText){
	$.mobile.activePage.find('[data-role="header"] h1').html(newText)
}

/*
Generate route info html from a data object
*/
function routeInfoHTML(data){ //takes a route object from api/v1/route/#/
	var out = ''
	out += '<b>Name: </b>' + data.name + '<br />\n'
	out += '<b>Owner: </b>' + '<span class="' + isUserClass(data.owner.username) + '">' + data.owner.username + '</span><br />\n'
	out += '<b>Private: </b>' + yesTrue(data.private) + '<br />\n'
	out += '<b>Created: </b>' + data.creation_date + '<br />\n'
	out += '<b>Last Update: </b>' + data.update_date + '<br />\n'
	out += '<b>Keywords: </b>' + data.keywords.join(" ") + '<br />\n'



	return out
}

/*
Display or hide the ajax loading wheel at the top of the screen
*/
function showAjaxLoad(bool){
	if(bool){
		$.mobile.activePage.find('.ramble_header').append('<div class="ajax_load"></div>')
	}else{
		$.mobile.activePage.find('.ramble_header .ajax_load').remove()
	}
}

/*
Use Phonegap API to capture an image from the camera
*/
function capturePhoto() {
	//Store contents of popup's fields, as the page refreshes when return from img selection
	setImageLocalStorage()
	navigator.camera.getPicture(capturePhotoSuccess, capturePhotoFail,
		{
			destinationType: Camera.DestinationType.DATA_URL,
			//destinationType: Camera.DestinationType.FILE_URI,
			quality: 50,
			targetWidth: 800, 
			correctOrientation: true, //probably ignored on android
			saveToPhotoAlbum: true //probably ignored on android
		});
}

/*
Load the captured photo into the HTML form, ready for submission
*/
function capturePhotoSuccess(imageData){
	$.mobile.activePage.find('.imageSrc').html(imageData)
	$.mobile.activePage.find('.imageStatus').html('Ready for upload')
	$('#notesPhotos-newImage').popup('open')
}

/*
Display a warning message explaining that photo capture has failed
*/
function capturePhotoFail(failMessage){
	$.mobile.activePage.find('.imageStatus').html('Photo capture failed:\n' + failMessage)
}

/*
Load an image from the phone's gallery.
*/
function findPhoto() {
	//Store contents of popup's fields, as the page refreshes when return from img selection
	setImageLocalStorage()
      // Retrieve image file location from specified source
	navigator.camera.getPicture(findPhotoSuccess, findPhotoFail,
		{ 
			quality: 100, 
			destinationType: Camera.DestinationType.DATA_URL,
			//destinationType: Camera.DestinationType.FILE_URI,
			sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
			targetWidth: 800, 
			correctOrientation: true, //probably ignored on android

			mediaType: Camera.MediaType.PICTURE,
		});
}

/*
Load selected image into form HTML, ready for submission
*/
function findPhotoSuccess(imageData){
	$.mobile.activePage.find('.imageSrc').html(imageData)
	$.mobile.activePage.find('.imageStatus').html('Ready for upload')
	$('#notesPhotos-newImage').popup('open')
}

/*
Alert user that image selection has failed
*/
function findPhotoFail(failMessage){
	$.mobile.activePage.find('.imageStatus').html('Photo slect failed:\n' + failMessage)
}

/*
Reset the photo upload popup (and any stored values).  Happens on upload success
*/
function clearPhotoUploadPopup(){
	clearImageLocalStorage()
	$('#imageFile').html('')
	$('#imageStatus').html('')
	$('#imageText').val('')
	$('#imageTitle').val('')
}

/*
Store contents of the image form.  They need to be re-inserted on return from the camera
or gallery apps, as the form page refreshes
*/
function setImageLocalStorage(){
	window.localStorage.setItem("imageTitle", $('#imageTitle').val())
	window.localStorage.setItem("imageText", $('#imageText').val())
	window.localStorage.setItem("imagePrivate", $('#imagePrivate option:selected').val())
}

/*
Remove stored image upload form values from local storage
*/
function clearImageLocalStorage(){
	window.localStorage.setItem("imageTitle", '')
	window.localStorage.setItem("imageText", '')
	window.localStorage.setItem("imagePrivate", '')
}

/*
Restore image upload form values from local storage
*/
function fillImgPopup(){
	$('#imageTitle').val(window.localStorage.getItem("imageTitle"))
	$('#imageText').val(window.localStorage.getItem("imageText"))
	$('#imagePrivate').val(window.localStorage.getItem("imagePrivate")+"").slider('refresh')
}

/*
Create a delete button for an item, this might be a route, image, or note
*/
function createDeleteButton(api, id, messageTarget, imageString){
	deleteMessageTarget = messageTarget
	var clickJS = 'deleteItem(\''+api + '\', '+ id+', \''+imageString+'\')'
	$.mobile.activePage.find('.deleteButton').attr('onClick', clickJS)
}

/*
Add a new form section to the share page, for a new recipeint's details
*/
function addRecipient(){
	$.mobile.activePage.find('#shareForm').append('<div class="shareDetails">\n'+
		'Name: <input type="text" name="regUser" class="shareUser ui-input-text ui-body-c ui-corner-all ui-shadow-inset ui-mini" data-mini="true">\n'+
		'Email: <input type="email" name="email" class="shareEmail ui-input-text ui-body-c ui-corner-all ui-shadow-inset ui-mini" data-mini="true">\n'+
		'<a href="#" data-role="button" onClick="removeRecipient(this)" data-icon="minus" data-mini="true" data-inline="true">Remove</a>\n' +
		'</div>')
	$.mobile.activePage.find('.shareDetails :last').find('a').button()
}

/*
Remove the selected recipient's details from the share page
*/
function removeRecipient(targetBtn){
	$(targetBtn).parent().remove()
}

/*
Go to the page for route sharing if the route is not private
*/
function goToSharePage(){
	if(activeRouteData.private){
		alert('Cannot share private route')
	}else{
		$.mobile.changePage("share.html")
	}
}

/*
return a class if the currently logged in user matches the input string.
This is to change the font colour of the user's own username in route details etc
*/
function isUserClass(user){
	if (window.localStorage.getItem('user').toLowerCase() == user.toLowerCase()){
		return ' selfUser'
	}else{
		return ''
	}
}

/*
Return true if the currently logged in user matches the input string
*/
function userOwns(user){
	return window.localStorage.getItem('user').toLowerCase() == user.toLowerCase()
}

/*
Get the mean average of an array
*/
function avgArray(arr){
	var i
	var total = 0
	for(i = 0; i < arr.length; i++){
		total += arr[i]
	}
	return total / i
}

/*
Shows the active hover item on the dashboard page content swapper
*/
function showInfoField(num){
	$('.info_showing').removeClass('.info_showing').hide()
	$('#infoField_'+num).show().addClass('info_showing')
}

