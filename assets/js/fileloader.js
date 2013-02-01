// it's the function called by the swf file
var Flash = {
  getFileData: function(base64) {
    showResult(base64)
  }
};

// we just want to show the result into the div
function showResult(b) {
	$.mobile.activePage.find('.imageSrc').html(b)
	$.mobile.activePage.find('.imageStatus').html('Ready for upload')
}

$('#page-notesphotos').live('pageshow', function(event, data){


//console.log('started')
// check if the FileReader API exists... if not then load the Flash object
	if (typeof FileReader !== "function"){
		// we use 80px by 23px, because we want the object to have the same size than the button
		swfobject.embedSWF("assets/js/swfobject/FileToDataURI.swf", "file-object", "80px", "23px", "10", "assets/js/swfobject/expressInstall.swf", {}, {}, {});
	}else {
		// replace the <object> by an input file
		$('#file-object').replaceWith('<input type="file" id="file-object" value="Load a file" />');
		$('#file-object').on('change', function(e) {
		// we use the normal way to read a file with FileReader
			var files = e.target.files,file;

			if (!files || files.length == 0) return;
			file = files[0];

			var fileReader = new FileReader();
			fileReader.onload = function (e) {
				// ATTENTION: to have the same result than the Flash object we need to split
				// our result to keep only the Base64 part
				showResult(e.target.result.split(",")[1]);
			};

			fileReader.readAsDataURL(file);
		});
	}

})