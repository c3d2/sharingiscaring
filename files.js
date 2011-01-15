var fs = require('fs');

var DB_PATH = 'files.json';
var FILES_PATH = 'files';
var MAX_TOTAL_SIZE = 1 * 1024 * 1024;

/* Keys: id, name, size, type, date, downloads */
var files;
try {
    files = JSON.parse(fs.readFileSync(DB_PATH));
} catch (e) {
    console.error(e.message);
    files = [];
}
exports.getFiles = function() {
    return files;
};

exports.getFile = function(id) {
    var r = undefined;
    files.forEach(function(file) {
	if (file.id == id)
	    r = file;
    });
    return r;
};

var maxId = 0, totalSize = 0;
files.forEach(function(file) {
    totalSize += file.size;
    if (file.id > maxId)
	maxId = file.id;
});
var nextId = maxId + 1;

exports.allocBytes = function(size) {
    totalSize += size;

    /* purge */
    while(totalSize > MAX_TOTAL_SIZE &&
	  files.length > 0) {

	var drop = files.pop();
	exports.freeBytes(drop.size);

	var path = FILES_PATH + '/' + drop.id;
	console.log('rm old ' + path);
	fs.unlink(path);
    }
};
exports.freeBytes = function(size) {
    totalSize -= size;
};

exports.addFile = function(info) {
    info.downloads = 0;
    info.date = new Date().getTime();
    info.id = nextId;
    nextId++;

    var path = FILES_PATH + '/' + info.id;
    var out = fs.createWriteStream(path);
    out.commit = function(size) {
	this.end();

	info.size = size;
	files.unshift(info);
	fs.writeFile(DB_PATH, JSON.stringify(files));
    };
    out.discard = function() {
	this.end();
	console.log('rm incomplete ' + path);
	fs.unlink(path);
    };
    return out;
};

exports.readFile = function(id) {
    var info = exports.getFile(id);
    if (info)
	info.downloads++;

    return fs.createReadStream(FILES_PATH + '/' + id);
};
