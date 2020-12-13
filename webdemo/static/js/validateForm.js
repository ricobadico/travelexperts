// [Susan]

// checks postal code validity
function checkEmail(email) {
  var reg = /[a-z0-9._%+-]+@([a-z0-9]+\.)+[a-z]{2,}/i;
  if (reg.test(email.value));
  else {
    alert("This email is invalid, please enter a valid email address");
    emailField.focus();
  }
}
// checks postal code validity
function checkPcode() {
  var text = document.getElementById("pCode");
  var exp = /^[A-Za-z]\d[A-Z a-z] ?\d[A-Za-z]\d$/;
  if (exp.test(text.value));
  else {
    alert("This postal code is invalid, please enter a valid postal code");
    pCode.focus();
  }
}

// checks phone number validity
function checkNumber(){
	var text = document.getElementById("pNumber"); 
	var exp = /^(1[ \-\+]{0,3}|\+1[ -\+]{0,3}|\+1|\+)?((\(\+?1-[2-9][0-9]{1,2}\))|(\(\+?[2-8][0-9][0-9]\))|(\(\+?[1-9][0-9]\))|(\(\+?[17]\))|(\([2-9][2-9]\))|([ \-\.]{0,3}[0-9]{2,4}))?([ \-\.][0-9])?([ \-\.]{0,3}[0-9]{2,4}){2,3}$/;
	if(exp.test(text.value));
	else
	{
	  	alert("This phone number is invalid, please enter a valid phone number")
			pNumber.focus();
	}
}

//disable form submissions if there are invalid fields
(function() {
  'use strict';
  window.addEventListener('load', function() {
    // Get the forms we want to add validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
		form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();

//[Bob] check for existing user
function checkUsername(){
  console.log("userName changed")
  var text = document.getElementById("userName");
  console.log(window.location.host);
  let Url = `http://${window.location.host}/checkUsername`;
  let Data = { username: text.value};
  let params = {
    headers:{"content-type": "application/text; charset=UTF-8"},
    //body:Data,
    username: text.value,
    method:"GET"
  };

  fetch(Url,params)
    .then(data => {
      let returnData = data.json();
      console.dir(returnData);
      console.dir(data.body);
      if(!(returnData.existingUser)) {
	  	  alert("This username is already taken")
			  userName.focus();
      }
    })
    .catch(error => {
      console.log(error);
    })
  }