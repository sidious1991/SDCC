const rft = require('./raftNode');
const awsUtil = require('./libs/awsLib')
const async = require('async')
const sch = require('./utils/stateChangeHndlr.js');
/** Main : start this peer */

sch.unsubscribeAll();
awsUtil.filterPeers("9490","Eire")
async.whilst(function(){return awsUtil.filtered === false},
  function(callback){
    console.log(".____.", awsUtil.filtered)
    setTimeout(function(){
      callback()
    },100);
  },
  function(err,n){
    var net= awsUtil.readFilter();
    console.log("private net:",net)

    rft.startRaft(net.peers,net.me);
  }
)

// var peers = ['/ip4/127.0.0.1/tcp/9491', '/ip4/127.0.0.1/tcp/9492'];
// rft.startRaft(peers);
