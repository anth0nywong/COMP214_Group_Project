$('#switch').on('click', function() {
    let fromValue = $('#from').val();
    let toValue = $('#to').val();
    $('#from').val(toValue);
    $('#to').val(fromValue);
});


