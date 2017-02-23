var async = require('async');
var metadata = require('node-ec2-metadata');

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./utils/config.json');
AWS.config.apiVersions = {
  ec2: '2016-09-15',
};

var ec2 = new AWS.EC2();
var net = [];
var groupFilt = [];
var filterNet = [];
var erasedNet = [];
var file = [];
var master;
var filtered = false;
var loginInfo = {
  Zones: [{
    Zone: "eu-west-1",
    Balancer: "load2-1099375857.eu-west-1.elb.amazonaws.com"
  }
  ]
}

var readFilter = function () {
  console.log("{peer:groupFilt,me:master}", { peer: groupFilt, me: master })
  return { peers: groupFilt, me: master }
}


/** get all raft node from a group
* @param group name of tag
*/
var getRaftNodes = function (group) {
  var temp1 = [];
  groupFilt = []
  ec2.describeInstances(function (error, data) {
    if (error) {
      return null;
    } else {
      net = []
      data.Reservations.forEach(insert);
      console.log("net", net)
      temp1 = filterNetByClusterName(net, group, "filter")
      for (var i = 0; i < temp1.length; i++) {
        groupFilt.push(temp1[i].PrivateIpAddress)
      }
      console.log("net filter", groupFilt)
    }
  });

};


/** filter the array of peers and delete your ip address
*  @param port port of ip address
* @param group name of tag
*/
var filterPeers = function (port, group) {
  var temp = []
  filtered = false;
  async.parallel([
    function (callback) {
      getRaftNodes(group);
      callback()
    },
    function (callback) {
      metadata.getMetadataForInstance('local-ipv4')
        .then(function (privateAddress) {
          master = "/ip4/" + privateAddress + "/tcp/" + port
          callback(null, privateAddress)
        })
        .fail(function (error) {
          console.log("Error: " + error);
        });
    }], function (err, results) {
      console.log("private", results[1])
      console.log("bab", groupFilt)
      async.whilst(
        function () { return groupFilt.length === 0; },
        function (callback) {
          console.log("-");
          setTimeout(function () {
            callback();
          }, 100);
        },
        function (err, n) {
          console.log("prima del filtro del proprio ip", groupFilt)

          for (var j = 0; j < groupFilt.length; j++) {
            if (groupFilt[j] == results[1])
              groupFilt.splice(j, 1)
          }

          for (var j = 0; j < groupFilt.length; j++)
            groupFilt[j] = "/ip4/" + groupFilt[j] + "/tcp/" + port
          filtered = true; exports.filtered = true;
          console.log("dopo il filtro del proprio ip", groupFilt)

        }
      );
    }
  );
}


/** read file from a selected zone
*  @param zone  is the selected zone
*/
var readFile = function (zone) {

  var newObj;
  console.log(file.length);
  var bool = false;
  for (var i = 0; i < file.length; i++) {
    console.log("zone", file[i].Zone);
    if (file[i].Zone == zone) {
      bool = true;
      console.log("found " + zone);
      newObj = {
        Zone: file[i].Zone,
        Master: file[i].Master,
        peers: file[i].peers
      };
    }
  }
  return file
}


function writeNetInFile(zone, master, net) {
  var fs = require('fs');
  var newObj = {
    Zone: zone,
    Master: master,
    peers: net
  }
  var bool = false;
  for (var i = 0; i < file.length; i++) {
    console.log("zone", file[i].Zone);
    if (file[i].Zone == zone) {
      bool = true;
      console.log("found " + zone);
      file[i] = newObj;
    }
  }
  if (bool == false)
    file.push(newObj);
  return file;
};


/** Get Tag value tags è l'array di tag del nodo ec2
*  @param tags all tags of ec2-server
* @param tagKey is the tag that i search
*/
function retriveTagValue(tags, tagKey) {
  var name = null;
  for (var i = 0; i < tags.length; i++) {
    if (tags[i].Key == tagKey) {
      console.log(tagKey + " of tag[" + i + "]:", tags[i].Value)
      name = tags[i].Value;
    }
  }
  return name;
}


var addTag = function (resource, key, value) {
  var params = {
    Resources: [ /* required */
      resource
    ],
    Tags: [ /* required */
      {
        Key: key,
        Value: value
      },
      /* more items */
    ]
  };
  ec2.createTags(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data);           // successful response
  });
}
/* -- se mode è filter della net verranno prelevati
      solo gli elementi con Name=tagName
   -- se mode è erase della net verranno prelevati
      solo gli elementi con Name!=tagName
*/
function filterNetByTagName(net, tagName, mode) {
  var temp = [];
  for (var i = 0; i < net.length; i++) {
    if (mode == "erase") {
      if (net[i].Name != tagName) {
        temp.push(net[i]);
      }
    }
    else if (mode == "filter") {
      if (net[i].Name == tagName) {
        temp.push(net[i]);
      }
    }
  }
  return temp;
}


function filterNetByRaftStat(net, tagStat, mode) {
  var temp = [];
  for (var i = 0; i < net.length; i++) {
    if (mode == "erase") {
      if (net[i].RaftRole != tagStat) {
        temp.push(net[i]);
      }
    }
    else if (mode == "filter") {
      if (net[i].RaftRole == tagStat) {
        temp.push(net[i]);
      }
    }
  }
  return temp;
}

/** If mode = filter take all net nodes with tagStat as scope */
function filterNetByClusterName(net, tagStat, mode) {
  var temp = [];
  for (var i = 0; i < net.length; i++) {
    if (mode == "erase") {
      if (net[i].Scope != tagStat) {
        temp.push(net[i]);
      }
    }
    else if (mode == "filter") {
      if (net[i].Scope == tagStat) {
        temp.push(net[i]);
      }
    }
  }
  return temp;
}


function setNet(tnet, elastic) {
  var temp = [];
  for (var i = 0; i < elastic.length; i++) {
    for (var j = 0; j < tnet.length; j++) {
      if (tnet[j].PublicIpAddress == elastic[i].PublicIp)
        tnet[j].ElasticAssigned = true;
    }
  }
  for (var j = 0; j < tnet.length; j++)
    temp.push(tnet[j]);
  return temp;
}


function insert(item, index) {
  var found;
  for (var i = 0; i < item.Instances.length; i++) {
    net.push({
      PrivateIpAddress: item.Instances[i].PrivateIpAddress,
      PublicIpAddress: item.Instances[i].PublicIpAddress,
      PublicDnsName: item.Instances[i].PublicDnsName,
      InstanceId: item.Instances[i].InstanceId,
      ElasticAssigned: false,
      Name: retriveTagValue(item.Instances[i].Tags, "Name"),
      RaftRole: retriveTagValue(item.Instances[i].Tags, "RaftRole"),
      Scope: retriveTagValue(item.Instances[i].Tags, "Scope")
    })
  }
}


var netGen = function (zn, group) {
  async.parallel([

    function (callback) {
      ec2.describeInstances(function (error, data) {
        if (error) {
          console.log(error); // an error occurred
        } else {
          net = []
          data.Reservations.forEach(insert);
          callback(null, net);
        }
      });
    },
    function (callback) {
      var params = {
        Filters: [
          {
            Name: "domain",
            Values: ["vpc"]
          }
        ]
      };

      var temp;
      ec2.describeAddresses(params, function (err, data) {
        if (err) console.log(err); // an error occurred
        else {               // successful response
          temp = data.Addresses;
          callback(null, temp);
        }
      })
    },

  ], // optional callback
    function (err, results) {
      setNet(results[0], results[1])
      filterNet = filterNetByRaftStat(filterNetByClusterName(net, group, "filter"), "Leader", "filter")
      erasedNet = filterNetByRaftStat(filterNetByClusterName(net, group, "filter"), "Leader", "erase")


      console.log("one", results[0])
      console.log("two", results[1])
      /*zone,master,peers*/
      writeNetInFile(zn, filterNet, erasedNet)

    });
};


var setElastic = function () {
  metadata.getMetadataForInstance('instance-id')
    .then(function (instanceId) {
      console.log("Instance ID: " + instanceId);
      console.log(instanceId); // 'i-35aebd3'
      var params = {
        AllocationId: 'eipalloc-6afb7c0e',
        InstanceId: instanceId
      };
      ec2.associateAddress(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data);           // successful response
      });
    })
    .fail(function (error) {
      console.log("Error: " + error);

    });
}


var setMasterInfo = function (group, zone) {

  ec2.describeInstances(function (error, data) {
    if (error) {
      console.log(error); // an error occurred
    } else {
      for (var item = 0; item < data.Reservations.length; item++) {
        for (var i = 0; i < data.Reservations[item].Instances.length; i++) {
          if ((retriveTagValue(data.Reservations[item].Instances[i].Tags, "RaftRole")
            == "Leader") && (retriveTagValue(data.Reservations[item].Instances[i].Tags, "Scope") == group)) {

            for (var j = 0; j < loginInfo.Zones.length; j++) {
              console.log("zone", loginInfo.Zones[j]);
              if (loginInfo.Zones[j].Zone == zone) {
                loginInfo.Zones[j].Master = {
                  InstanceId: data.Reservations[item].Instances[i].InstanceId,
                  PublicDnsName: data.Reservations[item].Instances[i].PublicDnsName,
                  PublicIpAddress: data.Reservations[item].Instances[i].PublicIpAddress
                }
                console.log("master update", loginInfo.Zones[j]);
              }
            }
          }
        }
      }
    }

  });
}


/* potrebbe servire se si aggiunge un nuovo cluster , bisogna eseguire
  setMasterInfo per avere info aggiornate *guarda masterInfo in loginRoute * */
var retriveMasterInfo = function (zone) {
  var obj;
  for (var i = 0; i < loginInfo.Zones.length; i++) {
    console.log("zone", loginInfo[i]);
    if (loginInfo.Zones[i].Zone == zone) {
      console.log("master update", loginInfo.Zones[i].Master);
      obj = loginInfo.Zones[i]
      return obj;
    }
  }
  return obj;
}


module.exports.setMasterInfo = setMasterInfo;
module.exports.retriveMasterInfo = retriveMasterInfo;
module.exports.setElastic = setElastic;
module.exports.readFile = readFile;
module.exports.netGen = netGen;
module.exports.addTag = addTag;
module.exports.readFilter = readFilter;
module.exports.filterPeers = filterPeers;
module.exports.filtered = filtered;
