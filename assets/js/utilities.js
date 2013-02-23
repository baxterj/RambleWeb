
function stripPX(inp){
	return inp.split('px', [0])
}

$(document).on('pageinit','[data-role=page]', function(){
	$('[data-position=fixed]').fixedtoolbar({ tapToggle:false});
});


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


var initialScreenSize = window.innerHeight;
window.addEventListener("resize", function() {
	if(window.innerHeight < initialScreenSize){
		$.mobile.activePage.find("[data-role=footer]").hide();
	}else{
		$.mobile.activePage.find("[data-role=footer]").show();
	}
});


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


function yesTrue(bool){
	if(bool){
		return 'Yes'
	}else{
		return 'No'
	}
}

function pageHeader(newText){
	$.mobile.activePage.find('[data-role="header"] h1').html(newText)
}

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

function showAjaxLoad(bool){
	if(bool){
		$.mobile.activePage.find('.ramble_header').append('<div class="ajax_load"></div>')
	}else{
		$.mobile.activePage.find('.ramble_header .ajax_load').remove()
	}
}

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

function capturePhotoSuccess(imageData){
	$.mobile.activePage.find('.imageSrc').html(imageData)
	$.mobile.activePage.find('.imageStatus').html('Ready for upload')
	$('#notesPhotos-newImage').popup('open')
}

function capturePhotoFail(failMessage){
	$.mobile.activePage.find('.imageStatus').html('Photo capture failed:\n' + failMessage)
}


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

function findPhotoSuccess(imageData){
	$.mobile.activePage.find('.imageSrc').html(imageData)
	$.mobile.activePage.find('.imageStatus').html('Ready for upload')
	$('#notesPhotos-newImage').popup('open')
}

function findPhotoFail(failMessage){
	$.mobile.activePage.find('.imageStatus').html('Photo slect failed:\n' + failMessage)
}

function clearPhotoUploadPopup(){
	clearImageLocalStorage()
	$('#imageFile').html('')
	$('#imageStatus').html('')
	$('#imageText').val('')
	$('#imageTitle').val('')
}

function setImageLocalStorage(){
	window.localStorage.setItem("imageTitle", $('#imageTitle').val())
	window.localStorage.setItem("imageText", $('#imageText').val())
	window.localStorage.setItem("imagePrivate", $('#imagePrivate option:selected').val())
}

function clearImageLocalStorage(){
	window.localStorage.setItem("imageTitle", '')
	window.localStorage.setItem("imageText", '')
	window.localStorage.setItem("imagePrivate", '')
}

function fillImgPopup(){
	$('#imageTitle').val(window.localStorage.getItem("imageTitle"))
	$('#imageText').val(window.localStorage.getItem("imageText"))
	$('#imagePrivate').val(window.localStorage.getItem("imagePrivate")+"").slider('refresh')
}

function createDeleteButton(api, id, messageTarget, imageString){
	deleteMessageTarget = messageTarget
	var clickJS = 'deleteItem(\''+api + '\', '+ id+', \''+imageString+'\')'
	$.mobile.activePage.find('.deleteButton').attr('onClick', clickJS)
}

function addRecipient(){
	$.mobile.activePage.find('#shareForm').append('<div class="shareDetails">\n'+
		'Name: <input type="text" name="regUser" class="shareUser ui-input-text ui-body-c ui-corner-all ui-shadow-inset ui-mini" data-mini="true">\n'+
		'Email: <input type="email" name="email" class="shareEmail ui-input-text ui-body-c ui-corner-all ui-shadow-inset ui-mini" data-mini="true">\n'+
		'<a href="#" data-role="button" onClick="removeRecipient(this)" data-icon="minus" data-mini="true" data-inline="true">Remove</a>\n' +
		'</div>')
	$.mobile.activePage.find('.shareDetails :last').find('a').button()
}

function removeRecipient(targetBtn){
	$(targetBtn).parent().remove()
}

function goToSharePage(){
	if(activeRouteData.private){
		alert('Cannot share private route')
	}else{
		$.mobile.changePage("share.html")
	}
}

function isUserClass(user){
	if (window.localStorage.getItem('user').toLowerCase() == user.toLowerCase()){
		return ' selfUser'
	}else{
		return ''
	}
}

function userOwns(user){
	return window.localStorage.getItem('user').toLowerCase() == user.toLowerCase()
}

function avgArray(arr){
	var i
	var total = 0
	for(i = 0; i < arr.length; i++){
		total += arr[i]
	}
	return total / i
}

function showInfoField(num){
	$('.info_showing').removeClass('.info_showing').hide()
	$('#infoField_'+num).show().addClass('info_showing')
}

