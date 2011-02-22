var connect = require('connect');
var formidable = require('formidable');
var files = require('./files');
var template = require('./template');
var sys = require('sys');

var MAX_FILE_SIZE = 300 * 1024 * 1024;

function enforceVhost(vhost) {
    return function(req, res, next) {
	if (!req.headers['host'] || req.headers['host'] === vhost)
	    return next();

	res.writeHead(302, { 'Location': 'http://' + vhost + '/' });
	res.end();
    };
}

function app(app) {
    var HTML_HEADERS = { 'Content-Type': 'text/html; charset=UTF-8' };
    app.get('/', function(req, res) {
	res.writeHead(200, HTML_HEADERS);
	res.write(template.htmlHead);
	res.write(template.uploadForm);
	res.write(template.downloadList(files.getFiles()));
	res.write(template.htmlFoot);
	res.end();
    });

    app.post('/upload', function(req, res) {
	var out, error;

        var form = new formidable.IncomingForm();
        form.encoding = 'utf8';
	form.handlePart = function(part) {
	    if (part.name === 'file' && part.filename) {
		console.log({ part: { name: part.name,
				      filename: part.filename,
				      mime: part.mime
				    } });
		out = files.addFile({ name: part.filename,
					  type: part.mime
					});
		var received = 0;
		part.on('data', function(data) {
		    if (out) {
			received += data.length;
			if (received > MAX_FILE_SIZE) {
			    out.discard();
			    out = undefined;

			    files.freeBytes(received);
			    error = new Error('Exceeded maximum file size');
			    /* TODO: send response ASAP */
			} else {
			    files.allocBytes(data.length);
			    req.pause();
			    out.write(data, function() {
				req.resume();
			    });
			}
		    }
		});
		part.on('end', function() {
		    if (out && received > 0) {
			out.commit(received);
		    } else if (out) {
			out.discard();
			error = new Error('File is empty');
		    }
		});
	    }
	};
        form.parse(req, function(err, fields, files) { if (!error) error = err; });

	form.on('end', function() {
	    if (!out && !error)
		error = new Error('No file received');

	    if (error) {
		/* Error */
		console.error(error.stack);
		res.writeHead(400, HTML_HEADERS);
		res.write(template.htmlHead);
		res.write(template.error(error || new Error('No file received')));
		res.write(template.htmlFoot);
		res.end();
	    } else {
		/* Success */
		res.writeHead(200, HTML_HEADERS);
		res.write(template.htmlHead);
		res.write(template.thanks);
		res.write(template.htmlFoot);
		res.end();
	    }
	});
    });
}

function fileDownload(req, res, next) {
    var m;
    if ((m = req.url.match(/^\/file\/(\d+)\//))) {
	var id = parseInt(m[1], 10);
	var info = files.getFile(id);
	res.writeHead(200, { 'Content-Type': info.mime,
			     'Content-Length': info.size });
	var read = files.readFile(info.id);
	sys.pump(read, res);
	read.on('close', function() {
	    res.end();
	});
    } else
	next();
}

var optionalVhostEnforce = process.env.VHOST ?
			   enforceVhost(process.env.VHOST) :
			   function(req, res, next) { return next(); };

connect.createServer(
    connect.logger(),
    optionalVhostEnforce,
    connect.router(app),
    fileDownload,
    connect.staticProvider(__dirname + '/public'),
    connect.errorHandler({ dumpExceptions: true, showStack: true })
).listen(parseInt(process.env.PORT || "8000", 10), '::');
