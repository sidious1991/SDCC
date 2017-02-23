var AWS = require('aws-sdk');
AWS.config.loadFromPath('./utils/config.json');
var redisCluster = require('fast-redis-cluster2').clusterClient;

var output;

AWS.config.apiVersions = {
  elasticache: '2015-02-02',
  region: 'eu-central-1'
};

var elasticache = new AWS.ElastiCache();


exports.CreateCacheCluster = function CreateCacheCluster(CacheClusterId) {
  /** Create a Cache Cluster with redis service with a cache cluster id
  *  @param CacheClusterId  id of cache caluster
  */
  var params = {
    CacheClusterId: CacheClusterId, /* required */
    AZMode: 'single-az',

    CacheNodeType: 'cache.t2.micro',

    Engine: 'redis',

    NotificationTopicArn: 'arn:aws:sns:eu-west-1:579332910827:TestTopic',
    NumCacheNodes: 1,
    Port: 9490,
    PreferredAvailabilityZone: 'eu-west-1b'
  };

  elasticache.createCacheCluster(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log("CREAZIONE CLUSTER CACHE REDIS: ", data);
    }
  });

};


exports.DescribeCacheCluster = function DescribeCacheCluster(CacheClusterId) {
  /** Describe a Cache Cluster with redis service with a cache cluster id
  *  @param CacheClusterId  id of cache caluster
  */
  var param = {
    CacheClusterId: CacheClusterId,
    //Marker: 'STRING_VALUE',
    MaxRecords: 20,
    ShowCacheNodeInfo: true
  };

  elasticache.describeCacheClusters(param, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      console.log("Stampa DESCRIZIONE CACHE CLUSTER", data); // successful response
      console.log("CacheNodes: ", data.CacheClusters[0].CacheNodes);
    }
  });

}

exports.ModifyCacheCluster = function ModifyCacheCluster(CacheClusterId) {
  /** Modify a Cache Cluster with redis service with a cache cluster id
  *  @param CacheClusterId  id of cache caluster
  */
  var params = {
    CacheClusterId: CacheClusterId, /* required */
    AZMode: 'single-az | cross-az',
    ApplyImmediately: true || false,
    AutoMinorVersionUpgrade: true || false,
    CacheNodeIdsToRemove: [
      'STRING_VALUE',
      /* more items */
    ],
    CacheNodeType: 'STRING_VALUE',
    CacheParameterGroupName: 'STRING_VALUE',
    CacheSecurityGroupNames: [
      'STRING_VALUE',
      /* more items */
    ],
    EngineVersion: 'STRING_VALUE',
    NewAvailabilityZones: [
      'STRING_VALUE',
      /* more items */
    ],
    NotificationTopicArn: 'STRING_VALUE',
    NotificationTopicStatus: 'STRING_VALUE',
    NumCacheNodes: 0,
    PreferredMaintenanceWindow: 'STRING_VALUE',
    SecurityGroupIds: [
      'STRING_VALUE',
      /* more items */
    ],
    SnapshotRetentionLimit: 0,
    SnapshotWindow: 'STRING_VALUE'
  };

  elasticache.modifyCacheCluster(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log("Stampa CLUSTER MOIFICATO: ", data); // successful response
  });

}


exports.createConnection = function createConnection() {
  /** Create a Client connection to redis peer service */

  var opts = {
    host: 'frank-redis.eox38k.clustercfg.euc1.cache.amazonaws.com',
    port: 6379

  };

  var redis = new redisCluster.clusterInstance(opts, function (err) {
    if (err) throw new Error(err);
    console.log('Connected, cluster is fine and ready for using');

  });

  return redis;

}


exports.setRedis = function setRedids(redis, name, value) {
  /** Create key value objet in redis memory
  *  @param redis  redis client object
  *  @param  name  name of key
  *  @param  value  value of assigned key
  */
  redis.set(name, value, function (err, resp) {
    console.log('set command returns err: %s, resp: %s', err, resp);
  });

}

exports.getRedis = function getRedids(redis, name) {
  /** Read a single or more value for the selected key in redis memory
  *  @param redis  redis client object
  *  @param  name  name of key
  */
  redis.get(name, function (err, resp) {
    console.log('get foo command returns err: %s, resp: %s', err, resp);
  });

}


exports.setJsonRedis = function setJsonRedis(redis, message, nameTable) {
  /** Write Hash Table with selected message
  *  @param redis  redis client object
  *  @param message object to save
  *  @param  nameTable  name of hash Table
  */
  var bool = 0;
  var messageArr = [];
  var readTable = [];

  //read Table Hash redis
  redis.hgetall('HSET:' + nameTable, function (err, resp) {

    console.log('hgetall command returns err: %s, resp: ', err, resp);

    if (resp === null) {
      messageArr.push(message);
      var params = {
        'default': JSON.stringify(messageArr)
      };
    }

    else {
      readTable = JSON.parse(resp.default);
      for (var i = 0; i < readTable.length; i++) {
        if (readTable[i].username == message.username && readTable[i].hand == message.hand) {
          readTable[i].bet = message.bet;
          readTable[i].bet_cash = message.bet_cash;
          bool = 1;
        }
      }
      if (bool == 0) readTable.push(message);
      //edit object
      var params = {
        'default': JSON.stringify(readTable)
      };
    }
    //write
    redis.hmset('HSET:' + nameTable, params);

  });
};

exports.getJsonRedis = function getJsonRedis(redis, nameTable) {
  /**  This function read an hash table for the selected key
  *  @param redis  redis client object
  *  @param  nameTable  name of hash Table
  */
  redis.hgetall('HSET:' + nameTable, function (err, resp) {

    console.log('hgetall command returns err: %s, resp: ', err, resp);
    exports.output = resp.default;
  });

}


exports.deleteDataTable = function deleteDataTable(redis, key, nameTable) {
  /** This function delete data from table
  *  @param redis  redis client object
  *  @param  nameTable  name of hash Table
  */
  var readTable = [];
  redis.hgetall('HSET:' + nameTable, function (err, resp) {

    console.log('hgetall command returns err: %s, resp: ', err, resp);
    readTable = JSON.parse(resp.default);

    for (var i = 0; i < readTable.length; i++) {
      if (readTable[i].key.username == key.username && readTable[i].key.hand == key.hand) {
        readTable.splice(i, 1);
        i--;
      }
    }

    var params = {
      'default': JSON.stringify(readTable)
    };

    redis.hmset('HSET:' + nameTable, params);
  });

}

exports.deleteAllTable = function deleteAllTable(redis, nameTable) {
  /** This function delete all data from table
  *  @param redis  redis client object
  *  @param  nameTable  name of hash Table
  */
  var table = [];

  var params = {
    'default': JSON.stringify(table)
  };

  redis.hmset('HSET:' + nameTable, params);
}

exports.getSlotNumber = function setSlotNumber(redis, Key) {
  /** This function return the slot NUMBER of memory area of Cache for the selcted key */

  var slot = redis.calcSlot(Key);
  console.log("SLOT NUMBER for the selected key is: " + slot);

}


module.exports.output = output;
