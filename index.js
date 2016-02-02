#!/usr/bin/env node

var fs = require('fs'),
    child_process = require('child_process'),
    lineReader = require('line-reader'),
    params = [],
    comments = '',
    type = '',
    filePath = 'CHANGELOG.md',
    gitList = ['b','c','clone','init','add','mv','reset','rm','bisect','grep','log','show','status','branch','checkout','commit','diff','merge','rebase','tag','fetch','pull','push'];

var argvsMap = {};
var argvs = (function(){
    var arr = [];
    process.argv.forEach(function(v,i){
        if(v !== '-x'){
            arr.push(v);
        }
        argvsMap[v] = true;
    });
    return arr.slice(2);
})();

function initParams(){

    new Promise(function(reslove, reject){
        var key = argvs[0];
        if(key){
            if(gitList.indexOf(key) !== -1){
                argvs.unshift('git');
                if(key === 'branch' || key === 'b'){ //新增分支
                    var branch = getValue(key);
                    getNewVersion().then(function(newVersion){
                        console.log('新建分支', newVersion);
                        _write('\n' + newVersion + '\n',function(){
                            reslove();
                        });
                    });
                }else if(key === 'commit' || key === 'c'){
                    var commit = getValue(key)
                    console.log('提交修改', commit);
                    _write(commit && '* ' + commit || '',function(){
                        reslove();
                    });
                }else{
                    reslove()
                }
            }
        }else{
            reslove();
        }
    })
    .then(function(){
        execute(argvs);
    });
}

function _write(val,callback){
    if(!val){
        console.log('未输入修改信息');
        callback && callback();
        return;
    }
    fs.appendFile(filePath, val + '\n' ,'utf8',function(err){
        if (err){
            throw err;
        }else{
            callback && callback();
        }
    });
}

function getValue(key){
    var flag = false,value = '';
    if(argvsMap['-x']){
        return '';
    }
    for(var i=0,len=argvs.length;i<len;i++){
        var v = argvs[i];
        if(v === key){
            flag = true;
            continue;
        }
        if(flag && !v.match(/^\-/g)){
            value = v;
            continue;
        }
    }
    return value;
}

function getNewVersion(){
    var ver = '';
    var p = new Promise(function(reslove,reject){
        fs.exists(filePath,function(bool){
            if(bool){
                ver = '';
                var flag = false;
                lineReader.eachLine(filePath, function(line, last){
                    if(line && line.match(/\#\#\#\#\#\s\d+\.\d+\.\d+\.(\d)+/g)){
                        var position = line.lastIndexOf('.');
                        var localVer = line.substr(position+1).match(/\d+/);
                        localVer = localVer && localVer[0] || 0;
                        localVer = parseInt(localVer,10) + 1;
                        var nativeVer = line.substr(0,position+1);
                        ver = nativeVer + localVer;
                        flag = true;
                    }

                    if(last && !flag){
                        ver = '##### 1.0.0.0';
                        flag = true;
                    }

                    if(last){
                        reslove(ver);
                    }
                });

                setTimeout(function(){
                    if(!flag){
                        reslove('##### 1.0.0.0');
                    }
                },100)

            }else{
                // 1.0.0 = native 版本，最后一位是本地版本
                ver = '##### 1.0.0.0';
                console.log('version name : ', ver);
                reslove(ver);
            }
        });
    });
    return p;
}

function execute(){
    var commands = argvs.map(function(v){
        if(v.match(/\s/gi)){
            return ('"' + v + '"');
        }else{
            return v;
        }
    }).join(' ');
    child_process.exec(commands , function(err,stdout,stderr){
        if(err){
            console.log('-----------------------')
            console.log(commands);
            console.log(stdout);
            console.log('execute fail');
            console.log('-----------------------')
        }else{
            console.log('-----------------------')
            stdout && console.log(stdout);
            console.log('execute success');
            console.log('-----------------------')
        }
    });
}


initParams();
