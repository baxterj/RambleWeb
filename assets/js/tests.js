var testResults = []
var passedTests = 0
var failedTests = 0

function result(testName, success, reason){
	var r = ''
	if(reason != null && reason != ''){
		r = reason
	}
	if(success){
		passedTests++
	}else{
		failedTests++
	}

	testResults.push('<div class="success'+success+'">'+testName + ' - ' + 'test success: '+success + ' - ' + r + '</div>')
}

function outputResults(){
	var html = '<h1>Passed: '+ passedTests + ' --- Failed: '+failedTests + '</h1>'
	for(var i = 0; i < testResults.length; i++){
		html += testResults[i]
	}
	$('#testResults').html(html)
}

//argarray is passed to the function
//outarray is an array of accepted outputs - could be variables or primitives or both
function testF(func, expected, argArray, outArray){
	var res
	try{
		//test for an exception
		res = func.apply(func, argArray)
	}catch(e){
		result(func.name, false == expected, 'Generated exception')
		return null
	}

	//test that result matches expected results
	if(outArray == null || outArray.length < 1){
		result(func.name, true == expected, 'No return value expected')
	}else{
		var match = false
		for(var i = 0; i < outArray.length; i++){
			if(res == outArray[i]){
				//alert(res + ' - ' + outArray[i])
				match = true
			}
		}
		result(func.name, match == expected, 'Matching return value')
	}
}

function runTests(){
	testResults = []
	testResults.push('<h2>ajaxrequests.js</h2>')
	testAjaxRequests()
	testResults.push('<h2>utilities.js</h2>')
	testUtilities()
	outputResults()
}

function testAjaxRequests(){
	window.localStorage.removeItem("apikey")
	testF(checkLoggedIn, true, null, [false])
	window.localStorage.setItem("apikey", "testkey")
	testF(checkLoggedIn, true, null, [true])
}

function testUtilities(){
	var dummyField = document.createElement('input')
	var dummyMsg = document.createElement('div')
	$(dummyField).val('hello')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'alphanum', false, 2, 10], [true])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'alphanum', true, 0, 10], [true])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'alphanum', true, 0, 1], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'num', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'password', true, 0, 100], [true])
	$(dummyField).val('hel"\'lo')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'password', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'alphanum', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'num', true, 0, 100], [false])
	$(dummyField).val('626')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'num', true, 3, 3], [true])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'password', true, 0, 100], [true])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', false, 0, 100], [false])
	$(dummyField).val('')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'alphanum', true, 0, 1], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'num', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'password', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'password', false, 0, 100], [true])
	$(dummyField).val(' ')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'alphanum', true, 0, 1], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'num', true, 0, 100], [false])
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'password', true, 0, 100], [false])
	$(dummyField).val('a@b.com')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [true])
	$(dummyField).val('a@b.m')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [false])
	$(dummyField).val('a@.cm')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [false])
	$(dummyField).val('a.com')
	testF(validateField, true, [$(dummyField), 'testInput', $(dummyMsg), 'email', true, 0, 100], [false])
	
	var dummyField2 = document.createElement('input')
	$(dummyField2).val('hello')
	$(dummyField).val('Hello')
	testF(fieldsEqual, true, [$(dummyField), $(dummyField2), 'fields', $(dummyMsg), false], [true])
	testF(fieldsEqual, true, [$(dummyField), $(dummyField2), 'fields', $(dummyMsg), true], [false])
	$(dummyField2).val('hello')
	$(dummyField).val('')
	testF(fieldsEqual, true, [$(dummyField), $(dummyField2), 'fields', $(dummyMsg), false], [false])
	$(dummyField2).val('')
	$(dummyField).val('')
	testF(fieldsEqual, true, [$(dummyField), $(dummyField2), 'fields', $(dummyMsg), false], [true])

	testF(avgArray, true, [[0]], [0])
	testF(avgArray, false, [[]], [0])
	testF(avgArray, true, [[0,1,2,3,4]], [2])
	testF(avgArray, true, [[-1, 5]], [2])
}
