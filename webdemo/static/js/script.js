if ($('form').valid()) {
    $('modal').modal('show')
}

$('#myForm').on('submit', function(e) {
  
    e.preventDefault(); //stop submit
    
    // if ($('#myCheck').is(':checked')) {
    //Check if checkbox is checked then show modal
      //$('#myModal').modal('show');
    //}

    if ($('form').valid()) {
        $('modal').modal('show')
    }


  });