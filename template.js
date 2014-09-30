function escape(s) {
    return s.
	replace(/&/g, '&amp;').
	replace(/"/g, '&quot;').
	replace(/'/g, '&apos;').
	replace(/</g, '&lt;').
	replace(/>/g, '&gt;');
}

function humanSize(i) {
    var suffix = "";
    var suffixes = ["T", "G", "M", "K"];
    while(suffixes.length > 0 && i >= 1024) {
	i /= 1024;
	suffix = suffixes.pop();
    }
    return Math.ceil(i) + " " + suffix;
}

function rjust(s, len, fill) {
    s = s.toString();
    while(s.length < len)
	s = fill + s;
    return s;
}

function formatDate(i) {
    var d = new Date(i);
    return d.getDate() + "." +
	(d.getMonth() + 1) + "." +
	d.getFullYear() + " " +
	rjust(d.getHours(), 2, '0') + ":" +
	rjust(d.getMinutes(), 2, '0') + " Uhr";
}

module.exports = {
    htmlHead: "<!DOCTYPE html>\
<html>\
  <head>\
    <meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>\
    <title>Sharing is Caring</title>\
    <meta name='viewport' content='width=device-width,initial-scale=1'>\
    <link rel='stylesheet' type='text/css' href='style.css'>\
    <link rel='shortcut icon' href='/favicon.png'>\
  </head>\
  <body>\
    <div id='page'>\
      <h1>\
	Sharing is Caring\
      </h1>",
    htmlFoot: "<p class='foot'>\
        Kopimi\
      </p>\
    </div>\
  </body>\
</html>",

    uploadForm: "<div id='up'>\
	<form action='/upload' method='post' enctype='multipart/form-data'>\
	  <input id='file' name='file' type='file' size='8'>\
	  <input type='submit' value='Hochladen'>\
	</form>\
	<p class='hint'>\
          Give something to other visitors!\
	</p>\
      </div>",

    downloadList: function(files) {
	return "<ul id='down'>" +
	    files.map(function(file) {
		var cssClass = file.type.split('/')[0];
		return "<li><a href='/file/" + file.id + "/" + escape(encodeURIComponent(file.name)) + "' type='" + escape(file.type) + "' class='" + escape(cssClass) + "'>" + escape(file.name) + "</a> <span class='size'>" + humanSize(file.size) + "B</span><span class='stats'><b>" + file.downloads + "×</b> seit " + formatDate(file.date) + "</span></li>";
	    }).join('') +
	    "</ul>";
    },

    thanks: "<p>Vielen Dank, <a href='/'>zurück zur Übersicht.</a></p>",

    error: function(e) {
	return "<p>" + escape(e.message) + "</p><p><a href='/'>Zurück zur Übersicht.</a></p>";
    }
};
