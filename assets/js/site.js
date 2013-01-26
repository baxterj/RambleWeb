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

$('#indexPage').live('pageshow', function(event, data){
	$('#slider').nivoSlider({
		effect: 'fade',
		pauseTime: 5000,
		randomStart: true,
		animSpeed: 500
	})
})

function genFooterHtml(){
	var html=''
	html+='<div class="footer_links_holder">\n'
	html+='<div class="footer_links">Links<br/>\n'
	html+='<a href="http://www.ramblers.org.uk/">Ramblers Association</a><br/>\n'
	html+='<a href="http://www.naturalengland.org.uk/ourwork/enjoying/countrysidecode/default.aspx">Countryside Code (England &amp; Wales)</a><br/>\n'
	html+='</div>\n'
	html+='<div class="footer_links">Help<br/>\n'
	html+='<a href="FAQ.html">FAQ</a><br/>\n'
	html+='<a href="forgot.html">Forgot Password</a><br/>\n'
	html+='<a href="mailto:support@rambleonline.com">Support Email</a><br/>\n'
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

function loggedInOutButton(){
	if(checkLoggedIn()){
		$.mobile.activePage.find('.loginLogout span span').html('Logout')
		$.mobile.activePage.find('.loginLogout').attr('href', 'logout.html')
	}else{
		$.mobile.activePage.find('.loginLogout span span').html('Login')
		$.mobile.activePage.find('.loginLogout').attr('href', 'login.html')
	}
}