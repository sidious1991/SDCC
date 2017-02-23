const rft = require('./raftNode');
const awsUtil = require('./libs/awsLib')
const async = require('async')
const sch = require('./utils/stateChangeHndlr.js');
/** Main : start this peer */

sch.unsubscribeAll();
awsUtil.filterPeers("9490","SuperLeader")
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
