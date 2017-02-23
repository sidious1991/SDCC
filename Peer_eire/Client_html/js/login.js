$('.form').find('input, textarea').on('keyup blur focus', function (e) {

  var $this = $(this),
      label = $this.prev('label');

	  if (e.type === 'keyup') {
			if ($this.val() === '') {
          label.removeClass('active highlight');
        } else {
          label.addClass('active highlight');
        }
    } else if (e.type === 'blur') {
    	if( $this.val() === '' ) {
    		label.removeClass('active highlight');
			} else {
		    label.removeClass('highlight');
			}
    } else if (e.type === 'focus') {

      if( $this.val() === '' ) {
    		label.removeClass('highlight');
			}
      else if( $this.val() !== '' ) {
		    label.addClass('highlight');
			}
    }

});

$('.tab a').on('click', function (e) {

  e.preventDefault();

  $(this).parent().addClass('active');
  $(this).parent().siblings().removeClass('active');

  target = $(this).attr('href');

  $('.tab-content > div').not(target).hide();

  $(target).fadeIn(600);

});



$(".image-radio img").click(function(){
  var utcDate = new Date();
  console.log(utcDate,utcDate.getHours(),utcDate.getMinutes(),utcDate.getSeconds(), new Date());
  $(this).prev().prop('checked', true);
 $('#zone_label').prop('innerHTML',$(this).prev().prop('id'));
  // if($(this).prev().attr('id') == "imp2"){
  //   $("#imp1").prop('checked', false);
  //   $(this).prev().prop('checked', true);
  //
  //   console.log("clicked $(#imp2)",$("#imp2"));
  // }else{
  //   $("#imp2").prop('checked', false);
  //   $(this).prev().prop('checked', true);
  //
  //   console.log("clicked $(#imp1)",$("#imp1"));
  // }
  console.log($("#Eire").prop('checked'),$("#Frankfurt").prop('checked'));

  });
