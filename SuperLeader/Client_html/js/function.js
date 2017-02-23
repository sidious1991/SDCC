var disableTable = function () {
  $('.tabellone tr').each(function () {
    //console.log($(this).attr('data-target'));
    if ($(this).attr('data-target') == "#modale-puntata")
      $(this).attr('data-target', null);
  });
  $('#1st12').attr('data-target', null);
  $('#2nd12').attr('data-target', null);
  $('#3rd12').attr('data-target', null);
  $('.tabellone').css('opacity', 0.5);
};
var activeTable = function () {
  $('.tabellone tr').each(function () {
    if ($(this).attr('data-toggle') != null)
      $(this).attr('data-target', "#modale-puntata");
  });
  $('#1st12').attr('data-target', "#modale-puntata");
  $('#2nd12').attr('data-target', "#modale-puntata");
  $('#3rd12').attr('data-target', "#modale-puntata");
  $('.tabellone').css('opacity', 1);
};
var noMoreBet = function () {
  disableTable();
  $('#modale-roulette').modal({ backdrop: false });
  $('#video').get(0).play();

};


var gameChanger = function (actualState) {
  switch (actualState) {
    case "Place your bets":
      $('#gamePhase').prop('value', actualState);
      activeTable();
      $('#puntata').prop('innerHTML', null);
      $('#totalBet').prop('innerHTML', null);
      $('#totalBet').prev().prop('innerHTML', "Place you're bet");
      $('#confirmBetText').prop('innerHTML', null);
      $('#confirmBet').prop('disabled', null);
      $('#confirmBet').prop('hidden', true);
      //      $.cookie('gamePhase', 'Place your bets',{expires: 7});
      setTimeout(function () {
        gameChanger("Last bets");
      }, 10000)//25
      break;
    case "Last bets":
      $('#gamePhase').prop('value', actualState);
      $.cookie('gamePhase', 'Last bets');

      setTimeout(function () {
        gameChanger("No more bets");
      }, 5000);
      break;
    case "No more bets":
      if ($("#modale-puntata").is(':visible')) {
        $('#modale-puntata').modal('toggle');
      }
      $('#gamePhase').prop('value', actualState);
      $('#confirmBet').prop('disabled', 'disabled');
      if ($('#totalBet').prev().prop('innerHTML') == "Place you're bet")
        $('#totalBet').prev().prop('innerHTML', "Wait next hand");

      noMoreBet();
      setTimeout(function () {
        gameChanger("Payment");
      }, 10000);
      break;
    case "Payment":
      $('#modale-roulette').modal('toggle');//chiude il modale
      $('#gamePhase').prop('value', actualState);
      setTimeout(function () {
        gameChanger("Place your bets");
      }, 3000);
      break;
  }
}
$(document).ready(function () {
  gameChanger("Place your bets");
  //qui ci va la richiesta di dati al server
});
$(".tabellone td").click(function () {
  //alert("tabellone"+this.id);
  //console.log("hey",this.id,this.id=="");
  if (this.id != "") {
    $('#textModal').prop('innerHTML', this.id);
    $('#tempModalQuote').prop('innerHTML', 0);
  }
});

$(".modal-fiches").click(function () {

  var tempSum = parseInt($('#tempModalQuote').prop('innerHTML')) + parseInt(this.value);
  if (tempSum < 0)
    tempSum = 0;
  $('#tempModalQuote').prop('innerHTML', tempSum);
});

$(".modal-fiches-confirm").click(function () {

  var tempSum = parseInt($('#tempModalQuote').prop('innerHTML'));
  var totalBet;
  if (tempSum != 0) {

    $('#confirmBetText').prop('innerHTML', "Confirm?   ");
    $('#confirmBet').prop('hidden', false);
    $('#puntata').prop('innerHTML', " euro on " + $('#textModal').prop('innerHTML'));
    $('#totalBet').prop('innerHTML', $('#tempModalQuote').prop('innerHTML'));
    $('#totalBet').prev().prop('innerHTML', "Did you bet ");
  }
});

$('#confirmBet').click(function () {

  disableTable();
  $('#totalCredit').prop('innerHTML', parseInt($('#totalCredit').prop('innerHTML')) - parseInt($('#totalBet').prop('innerHTML')));

});
