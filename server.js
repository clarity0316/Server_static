var http = require('http');
var url = require('url');
var fs = require('fs');
var mime = require('./mime').types;
var path = require('path');
var config = require('./config');
var port = 8080;
var rootUrl = "D:/www/server";
var server = http.createServer(function (request, response){
    var pathname = url.parse(request.url).pathname;
    if(pathname === '/'){
        pathname += config.Expires.index;
    }
    pathname = path.normalize(pathname.replace(/\.\./g, ""));
    var realPath = rootUrl + pathname;
    fs.exists(realPath, function (exists){
        if (!exists) {
            response.writeHead(404, {'Content-Type' : 'text/plain'});
            response.write('this request url ' + realPath + ' was not found on this server');
            response.end();
        }
        else{
            var ext = path.extname(realPath);

            ext = ext ? ext.slice(1) : 'unknown';
            var contentType = mime[ext] || 'text/plain';
            response.setHeader('Content-Type', contentType); 
            fs.stat(realPath, function (err, stat){
                var lastModified = stat.mtime.toUTCString();
                var ifModifiedSince = "If-Modified-Since".toLowerCase();
                response.setHeader('Last-Modified', lastModified);//设置最后修改时间
                if (ext.match(config.Expires.fileMatch)) {
                    var expires = new Date();
                    expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
                    response.setHeader('Expires', expires.toUTCString());
                    response.setHeader('Cache-Control', "max-age=" + config.Expires.maxAge);
                }
                if (request.headers[ifModifiedSince] && request.headers[ifModifiedSince] == lastModified) {
                    console.log("从浏览器cache里取");
                    response.writeHead(304, 'Not Modified');
                    response.end();
                }
                else{
                    fs.readFile(realPath, 'binary', function (err, file){
                        if (err) {
                            response.writeHead(500, "Internal Server Error" , {'Content-Type': 'text/plain'});
                            response.end(err);
                        }
                        else{
                            response.writeHead('200', 'Ok');
                            response.write(file, "binary");
                            response.end();                    
                        }
                    });
                }

            });
        }
    });
});
server.listen(port);
console.log("Server running at:"+port);