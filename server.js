var connect = require('connect');
var formidable = require('formidable');
var files = require('./files');
var template = require('./template');

var MAX_FILE_SIZE = 100 * 1024 * 1024;

function app(app) {
    app.get('/', function(req, res) {
	res.writeHead(200, { 'Content-Type': 'text/html' });
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
		var out = files.addFile({ name: part.filename,
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
			} else {
			    files.allocBytes(data.length);
			    out.write(data);
			}
		    }
		});
		part.on('end', function() {
		    if (out) {
			out.commit(received);
		    }
		});
	    }
	};
        form.parse(req, function(err, fields, files) { if (!error) error = err; });

	req.on('end', function() {
	    if (error) {
		console.error(error.stack);
		res.writeHead(400, { 'Content-Type': 'text/html' });
		res.write(template.htmlHead);
		res.write(template.error(error || new Error('No file received')));
		res.write(template.htmlFoot);
		res.end();
	    } else {
		res.writeHead(200, { 'Content-Type': 'text/html' });
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
	read.on('data', function(data) {
	    res.write(data);
	});
	read.on('close', function() {
	    res.end();
	});
    } else
	next();
}

connect.createServer(
    connect.logger(),
    connect.router(app),
    fileDownload,
    connect.staticProvider(__dirname + '/public'),
    connect.errorHandler({ dumpExceptions: true, showStack: true })
).listen(parseInt(process.env.PORT || "8000", 10), '::');
