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
    if ($this.val() === '') {
    		label.removeClass('active highlight');
    } else {
		    label.removeClass('highlight');
    }
  } else if (e.type === 'focus') {

    if ($this.val() === '') {
    		label.removeClass('highlight');
    }
    else if ($this.val() !== '') {
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



$(".image-radio img").click(function () {
  console.log(this);
  $(this).prev().prop('checked', true);
  $('#zone_label').prop('innerHTML', $(this).prev().prop('id'));
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
  console.log($("#Eire").prop('checked'), $("#Frankfurt").prop('checked'));

});


$('#GetStarted').click(function () {

  var data = {
    name: $('#registerName').prop('value'), surname: $('#registerSurname').prop('value'), username: $('#registerEmail').prop('value'),
    password: $('#registerPassword').prop('value')
  };

  $.post("./stateNode/register", data, function (resp) {

    if (resp === 'signed') {
      alert("CORRECTLY REGISTERED!\nREMEMBER TO CHECK YOUR MAIL TO RECEIVE DAILY CODE");
    }

    else {
      alert("USERNAME ALREADY IN USE!");
    }

  });

});


$('#LoginButton').click(function () {

  var data = { email: $('#loginEmail').prop('value'), pass: $('#loginPassword').prop('value') };

  console.log(data);

  $.post("./stateNode/homeLogin", data, function (resp) {

    if (resp.username === undefined) {
      alert("BAD CREDENTIALS!");
    }

    else {

      /** Ping both the zones and send client to the nearest one (least ping) */

      var elbFrk, elbEire, result;
      ping('http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/').then(function (delta_0) {
        elbFrk = delta_0;
        console.log('Ping time frank was ' + elbFrk + ' ms');

        ping('http://eireLoad-507879366.eu-west-1.elb.amazonaws.com/').then(function (delta) {
          elbEire = delta;
          console.log('Ping time eire was ' + elbEire + ' ms');
          console.log("TYPEOF", typeof (result), typeof (elbFrk));
          result = Math.min(elbFrk, elbEire);

          if (result == elbFrk) {
            $.cookie('infoLogin', JSON.stringify(resp), { domain: 'eu-central-1.elb.amazonaws.com' });
            window.location.href = 'http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/login/' + resp.username;
          }

          else {
            $.cookie('infoLogin', JSON.stringify(resp), { domain: 'eu-west-1.elb.amazonaws.com' })
            window.location.href = 'http://eireLoad-507879366.eu-west-1.elb.amazonaws.com/roulette/login/' + resp.username;
          }

        }).catch(function (err) {
          console.error('Could not ping remote URL', err);
          $.cookie('infoLogin', JSON.stringify(resp), { domain: 'eu-central-1.elb.amazonaws.com' });
          window.location.href = 'http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/login/' + resp.username;
        })

      }).catch(function (err) {
        console.error('Could not ping remote URL', err);
        $.cookie('infoLogin', JSON.stringify(resp), { domain: 'eu-west-1.elb.amazonaws.com' })
        window.location.href = 'http://eireLoad-507879366.eu-west-1.elb.amazonaws.com/roulette/login/' + resp.username;
      });

    } // end else

  });

});
