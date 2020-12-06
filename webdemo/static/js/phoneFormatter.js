// Base code thanks to Corey Roth at https://codepen.io/coreyroth/pen/zGgNeN
// Additional functionality to accept 10 or 11 digit codes done by [Eric]


// This function runs every time a key is pressed in the phone input
function phoneMask() { 
    
    // First, we grab the current content of the input, but strip away all non-digit characters
    var num = $(this).val().replace(/\D/g,'');

    // If we have 10 letter or less, we format it as a phone number with the first 3 in parentheses
    if (num.length <= 10){
        $(this).val('(' + num.substring(0,3) + ')' + num.substring(3,6) + '-' + num.substring(6,10)); 

    // If an 11th number is added, we let the first appear outside of the parentheses as a country code
    } else {
        $(this).val(num.substring(0,1) + '(' + num.substring(1,4) + ')' + num.substring(4,7) + '-' + num.substring(7,11)); 
    }
}

// This tells the function to apply to all telephone inputs upon each keystroke
$('#pNumber').keyup(phoneMask);