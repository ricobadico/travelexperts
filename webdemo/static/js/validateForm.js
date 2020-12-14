// [Susan]

// checks postal code validity
function checkEmail(email) {
  var reg = /[a-z0-9._%+-]+@([a-z0-9]+\.)+[a-z]{2,}/i;
  if (reg.test(email.value)) {
    return true;
  } else {
    alert("This email is invalid, please enter a valid email address");
    emailField.focus();
    return false;
  }
}
// checks postal code validity
function checkPcode() {
  var text = document.getElementById("pCode");
  var exp = /^[A-Za-z]\d[A-Z a-z] ?\d[A-Za-z]\d$/;
  if (exp.test(text.value)) {
    return true;
  } else {
    alert("This postal code is invalid, please enter a valid postal code");
    pCode.focus();
    return false;
  }
}

// checks phone number validity
function checkNumber(){
	var text = document.getElementById("pNumber"); 
	var exp = /^(1[ \-\+]{0,3}|\+1[ -\+]{0,3}|\+1|\+)?((\(\+?1-[2-9][0-9]{1,2}\))|(\(\+?[2-8][0-9][0-9]\))|(\(\+?[1-9][0-9]\))|(\(\+?[17]\))|(\([2-9][2-9]\))|([ \-\.]{0,3}[0-9]{2,4}))?([ \-\.][0-9])?([ \-\.]{0,3}[0-9]{2,4}){2,3}$/;
	if(exp.test(text.value)) {
    return true;
  } else
	{
	  	alert("This phone number is invalid, please enter a valid phone number")
      pNumber.focus();
      return false;
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
  let Url = `http://${window.location.host}/checkUsername/?username=${text.value}`;
  let Data = { username: text.value};
  let params = {
    headers:{"content-type": "application/text; charset=UTF-8"},
    //body:Data,
    username: text.value,
    method:"GET"
  };
  fetch(Url,params)
    .then(response => response.json())
    .then((user) => {
      console.log(user.existingUser);
      if(user.existingUser) {
	  	  alert("This username is already taken")
        userName.focus();
        return false;
      } else if (!user.existingUser) {
        return true;
      }
    })
    .catch(error => {
      console.log(error);
    });
  }
  

  function checkAll() {
    checkUsername();
    checkPcode();
    checkEmail();
    checkNumber();
    let first = document.getElementById("firstName").text;
    let last = document.getElementById("lastName").text;
    let address = document.getElementById("address").text;
    let city = document.getElementById("city").text;
    let user = document.getElementById("userName").text;
    let pass = document.getElementById("pwd").text;
    let email = document.getElementById("email".text);
    let phone = document.getElementById("pNumber").text;
    console.log(`first: ${first}`);
    consol.log(phone);
    if (first === "" || last === "" || address === "" || city === "" || user === "" || pass === "" || email === "" || phone === "" ) {
      alert("Please fill in all the required fields");
      return false;
    } else {
      return true;
      // not sure if i need this it is what confirm should do
    }

  }