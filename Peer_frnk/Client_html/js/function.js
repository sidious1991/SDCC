var disableTable = function(){
  $('.tabellone tr').each(function(){
    if($(this).attr('data-target')=="#modale-puntata")
      $(this).attr('data-target',null);
  });
  $('#1st12').attr('data-target',null);
  $('#2nd12').attr('data-target',null);
  $('#3rd12').attr('data-target',null);
  $('.tabellone').css('opacity',0.5);
};
var activeTable = function(){
  $('.tabellone tr').each(function(){
    if($(this).attr('data-toggle')!=null)
      $(this).attr('data-target',"#modale-puntata");
  });
  $('#1st12').attr('data-target',"#modale-puntata");
  $('#2nd12').attr('data-target',"#modale-puntata");
  $('#3rd12').attr('data-target',"#modale-puntata");
  $('.tabellone').css('opacity',1);
};
var noMoreBet = function(){
  disableTable();
  $('#modale-roulette').modal({backdrop: false, show: true});
  $('#video').get(0).play();

};
/* It manages the phases of the game:
 *  Place you're bet : user have ~15 second for bet
 *  Last bets : user have ~5sec for bet
 *  No more bets : the number will exit soon ~6sec
 *  Payment : payment phase ~2sec (or more)
 */
var gameChanger = function(actualState,timer){
  switch (actualState) {
    case "Place your bets":
    //localStorage.setItem('oldCash',parseInt($('#totalCredit').prop('innerHTML')));
    $('#result').prop('innerHTML',null);
    if ($("#modale-roulette").is(':visible')){
      $('#modale-roulette').modal('hide');//chiude il modale
     }
     if ($("#modale-number").is(':visible')){
          $('#modale-number').modal('hide');
      }
      $('#gamePhase').prop('value',actualState);
      activeTable();
      $('#puntata').prop('innerHTML',null);
      $('#puntata').prop('name',null);

      $('#totalBet').prop('innerHTML',null);
      $('#totalBet').prev().prop('innerHTML',"Place you're bet");
      $('#confirmBetText').prop('innerHTML',null);
      $('#confirmBet').prop('disabled',null);
      $('#confirmBet').prop('hidden',true);
      setTimeout(function(){
        $("#page-top").removeAttr("style");
      },1500)

      setTimeout(function(){
        gameChanger("Last bets",5000);
      },timer)//15 sec
      break;

    case "Last bets":
      $('#gamePhase').prop('value',actualState);
      $.cookie('gamePhase', 'Last bets');
      if ($("#modale-number").is(':visible')){
           $('#result').prop('innerHTML',null);
           $('#modale-number').modal('hide');
       }

      setTimeout(function(){
        gameChanger("No more bets",6000);
      },timer);//5 sec
      break;

    case "No more bets":
      if ($("#modale-puntata").is(':visible')){
        $('#modale-puntata').modal('toggle');
      }

      $('#gamePhase').prop('value',actualState);
      $('#confirmBet').prop('disabled','disabled');
      if($('#totalBet').prev().prop('innerHTML')=="Place you're bet")
        $('#totalBet').prev().prop('innerHTML',"Wait next hand");

      noMoreBet();
        setTimeout(function(){
            $.get("http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/raftState", function(data, status){
              console.log("raftState-no more bets",data)
            if ($("#modale-roulette").is(':visible')){
              console.log("modale visibile in no more bets")
               $('#modale-roulette').modal('hide');
             }
            var draw = $('#'+data.superLeader.num).attr('background');
            console.log("draw",draw);
            $('#drawNumber').attr("src",draw);
            $('#modale-number').modal({backdrop:'static',keyboard:false});
            gameChanger("Payment",2000);

          })
        },timer-1000);


      break;

    case "Payment":

      if ($("#modale-roulette").is(':visible')){
        console.log("modale visibile in payment")
     	 $('#modale-roulette').modal('hide');//chiude il modale
      }

      disableTable();
      $('#gamePhase').prop('value',actualState);
      var data_l = {username: $('#username').prop('innerHTML') }


      setTimeout(function(){

        $.get("http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/raftState", function(data, status){
          utcDate = new Date(data.superLeader.date);
          receive = new Date(Date.UTC(utcDate.getYear(),utcDate.getMonth(),utcDate.getDay(),utcDate.getHours(),utcDate.getMinutes(),utcDate.getSeconds()) );


          $.post("http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/getCash",data_l, function(data, status){

            console.log("get cash",data.cash,data.cash != undefined,data.cash !== undefined)
            if(data.cash != undefined ){
            console.log("confronto ",data.cash,parseInt($('#totalCredit').prop('innerHTML')),data.cash > parseInt($('#totalCredit').prop('innerHTML')))
            $('#totalCredit').prop('innerHTML',JSON.stringify(data.cash));

            console.log("$('#totalBet').prev().prop('innerHTML')",$('#totalBet').prev().prop('innerHTML')=="Wait next hand");

           }
        });
        now = new Date(data.serverDate);
        referNow = new Date(Date.UTC(now.getYear(),now.getMonth(),now.getDay(),now.getHours(),now.getMinutes(),now.getSeconds()) );
        console.log("difference",referNow-receive);
        var difference = referNow-receive;

          if(data.superLeader.phase =="play" && difference >= 0 && difference < 15000){
               console.log("phase PAYMENT ---> PLACE YOU'RE BET", 15000- difference)

               gameChanger("Place your bets",15000- difference);
               $.cookie('hand',data.superLeader.hand);

          }else if(data.superLeader.phase =="play" && difference >15000 && difference < 20000){
               console.log("phase PAYMENT ---> LAST", 20000- difference)
               gameChanger("Last bets",20000 - difference);
               $.cookie('hand',data.superLeader.hand);
          } else if( data.superLeader.phase =="compute" && difference >=0 && difference < 6000){
               console.log("phase PAYMENT ---> NO MORE BETS", 6000- difference)
               gameChanger("No more bets",6000 - difference);
          }else{

               $('#puntata').prop('innerHTML',null);
               $('#puntata').prop('name',null);
               $('#totalBet').prop('innerHTML',null);
               $('#totalBet').prev().prop('innerHTML',"Wait next hand");
               $('#confirmBetText').prop('innerHTML',null);
               $('#confirmBet').prop('disabled',null);
               $('#confirmBet').prop('hidden',true);
               gameChanger("Payment",2000);
             }
        });
      },timer);

     break;
  }
}

$( document ).ready(function(){

  if(localStorage.getItem('codeValid')==undefined){
    $('#modale-security').modal({backdrop: 'static', keyboard: false, show :true});
  }

  if($.cookie('infoLogin')== undefined){
    alert("USCIRE COOKIE NON SETTATO");
    $('#logout').click();
  }
    var data_l = {username: $('#username').prop('innerHTML') }

    $('#username').prop('innerHTML',JSON.parse($.cookie('infoLogin')).username);

    $.post("http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/getCash",data_l, function(data, status){

      if(data.cash !== undefined ){
         console.log("data-cash", data.cash, data)
         $('#totalCredit').prop('innerHTML',JSON.stringify(data.cash));
       }
     });
  $.get("http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/raftState", function(data, status){
      utcDate = new Date(data.superLeader.date);
      receive = new Date(Date.UTC(utcDate.getYear(),utcDate.getMonth(),utcDate.getDay(),utcDate.getHours(),utcDate.getMinutes(),utcDate.getSeconds()) );
      console.log("data.serverDate",data.serverDate.toISOString,typeof data.serverDate)
      now = new Date(data.serverDate);
      referNow = new Date(Date.UTC(now.getYear(),now.getMonth(),now.getDay(),now.getHours(),now.getMinutes(),now.getSeconds()) );
      console.log("Delay",receive,referNow,referNow-receive);
      var difference = referNow-receive;
      var data_l = {username: $('#username').prop('innerHTML') }

      if(data.superLeader.phase =="play" && difference >= 0 && difference < 15000){
           console.log("phase DOM ---> PLACE YOU'RE BET", 15000- difference )
           $.cookie('hand',data.superLeader.hand);
           gameChanger("Place your bets",15000- difference);

      }else if(data.superLeader.phase =="play" && difference >=15000 && difference < 20000){
           console.log("phase DOM ---> LAST", 20000- difference)
           $.cookie('hand',data.superLeader.hand);
           gameChanger("Last bets",20000- difference);
      }else if(data.superLeader.phase =="compute" && difference >=0 && difference < 6000){
           console.log("phase DOM ---> NO MORE BETS", 6000- difference)
           gameChanger("No more bets",6000 - difference);
      }else {
           $('#puntata').prop('innerHTML',null);
           $('#puntata').prop('name',null);

           $('#totalBet').prop('innerHTML',null);
           $('#totalBet').prev().prop('innerHTML',"Wait next hand");
           $('#confirmBetText').prop('innerHTML',null);
           $('#confirmBet').prop('disabled',null);
           $('#confirmBet').prop('hidden',true);
           gameChanger("Payment",2000);
         }
    });
});
$(".tabellone td").click(function(){
  /* open the modal for set bet */
  if(this.id != ""){
    $('#textModal').prop('innerHTML',this.id);
    $('#tempModalQuote').prop('innerHTML',0);
  }
});

$(".modal-fiches").click(function(){
  /* add or remove credit in bet */
  var tempSum = parseInt($('#tempModalQuote').prop('innerHTML'))+parseInt(this.value);
  if(tempSum<0)
    tempSum=0;
  if(parseInt($('#totalCredit').prop('innerHTML'))>=tempSum)
    $('#tempModalQuote').prop('innerHTML',tempSum);
});

$(".modal-fiches-confirm").click(function(){
  /* confirm the bet in modal */
  var tempSum = parseInt($('#tempModalQuote').prop('innerHTML'));
  var totalBet;
  if(tempSum != 0){

    $('#confirmBetText').prop('innerHTML',"Confirm?   ");
    $('#confirmBet').prop('hidden',false);
    $('#puntata').prop('innerHTML'," euro on "+$('#textModal').prop('innerHTML'));
    $('#puntata').prop('name',$('#textModal').prop('innerHTML'));
    $('#totalBet').prop('innerHTML',$('#tempModalQuote').prop('innerHTML'));
    $('#totalBet').prev().prop('innerHTML',"Did you bet ");
  }
});

$('#confirmBet').click(function(){
    /* confirms the bet definitely */
    $('#confirmBet').prop('disabled','disabled');
    disableTable();
    $('#totalCredit').prop('innerHTML',parseInt($('#totalCredit').prop('innerHTML'))- parseInt($('#totalBet').prop('innerHTML')));
    var temp = [];
    var puntata = $('#puntata').prop('name');
    switch (puntata){
        case "even":
          temp ="p";
          break;
        case "odd":
          temp = "i";
          break;
        case "red":
          temp = "r";
          break;
        case "black":
          temp ="n";
          break;
        case "1st12":
          temp = [1,2,3,4,5,6,7,8,9,10,11,12];
          break;
        case "2nd12":
          temp = [13,14,15,16,17,18,19,20,21,22,23,24];
          break;
        case "3rd12":
          temp = [25,26,27,28,29,30,31,32,33,34,35,36];
          break;
        case "2to1-1":
          temp = [3,6,9,12,15,18,21,24,27,30,33,36];
          break;
        case "2to1-2":
          temp = [2,5,8,11,14,17,20,23,26,29,32,35];
          break;
        case "2to1-3":
          temp = [1,4,7,10,13,16,19,22,25,28,31,34];
          break;
        case "1stHalf":
          temp = "m";
          break;
        case "2ndHalf":
          temp = "ps";
          break;
        default :
          temp.push(Number(parseInt($('#puntata').prop('name'),10)));
          break;
    }
    if(parseInt($.cookie('hand'))!= NaN){
      var bet1 = {hand: Number(parseInt($.cookie('hand'))),username:$('#username').prop('innerHTML'),bet:JSON.stringify(temp),bet_cash:Number(parseInt($('#totalBet').prop('innerHTML'),10))};

      $.post("./roulette/writeBet",bet1 ,function(){
          console.log("puntata fatta")
      });
   }
});

$('#confirm-access').click(function(){
  /* check if the daily code is right */
  $.get('http://frankLoadBalancer-1669808597.eu-central-1.elb.amazonaws.com/roulette/getDailyNumber',function(data){
    if($('#codeForm').prop('value')==data.number)
      localStorage.setItem('codeValid','true');
    else location.reload();
  });
});
$('#logout').click(function(){
  /* clear cookies and return to login page */
  localStorage.removeItem('codeValid');
  $.cookie('hand',null, {expires: -1 });
  $.cookie("infoLogin", null, { path: '/' ,domain: 'eu-west-1.elb.amazonaws.com', expires: -1 });
  location.href='http://LoginLoadBalancer-374539538.eu-west-1.elb.amazonaws.com/login.html'

});
