var footerContent

$(document).ready(function(){
	$('.footer_content').html(genFooterHtml())
})

$('div[data-role="page"]').live('pageshow', function(event, data){
	if(footerContent != null){
		$('.footer_content').html(footerContent)
	}
	loggedInOutButton()
})

$('#page-home, #logoutPage').live('pageshow', function(event, data){
	redirectLoggedOut()
})

$('#loginPage, #registerPage, #forgotPage').live('pageshow', function(event, data){
	redirectLoggedIn()
})

function genFooterHtml(){
	var html=''
	html+='<div class="footer_links_holder">\n'
	html+='<div class="footer_links">Links<br/>\n'
	html+='<a href="#">Link 1</a><br/>\n'
	html+='<a href="#">Link 2</a><br/>\n'
	html+='</div>\n'
	html+='<div class="footer_links">Help<br/>\n'
	html+='<a href="#">Link 1rgereah</a><br/>\n'
	html+='<a href="#">Link 2</a><br/>\n'
	html+='</div>\n'
	html+='<div class="footer_links">Contact Us<br/>\n'
	html+='<a href="#">Link 1</a><br/>\n'
	html+='<a href="#">Link 2afhafdhdh</a><br/>\n'
	html+='</div>\n'
	html+='<div class="clear"></div>\n'
	html+='</div>\n' //footer links holder
	html += '<div class="footer_img"><img src="assets/images/rambleon_logo_sm_cropped.png" /></div>\n'
	footerContent = html
	return html
}

function loggedInOutButton(){
	if(checkLoggedIn()){
		$.mobile.activePage.find('.loginLogout span span').html('Logout')
		$.mobile.activePage.find('.loginLogout').attr('href', 'logout.html')
	}else{
		$.mobile.activePage.find('.loginLogout span span').html('Login')
		$.mobile.activePage.find('.loginLogout').attr('href', 'login.html')
	}
}