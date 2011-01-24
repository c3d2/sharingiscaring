/**
 * ndns appears very buggy. commands to test:
 *
 * dig foo @localhost -p 5353
 * dig ANY foo @localhost -p 5353
 * dig AAAA foo @localhost -p 5353
 * dig NS foo @localhost -p 5353
 *
 * also, try exposing it to mdns traffic on port 5353 :-(
 */
var sys = require('sys');
var ndns = require('ndns');

var server = ndns.createServer ('udp4');

var TTL = 60;
var NAMESERVER_A = '10.0.0.1';
var NAMESERVER_AAAA = 'fec0::1';
var TARGETSERVER_A = '10.0.0.1';
var TARGETSERVER_AAAA = 'fec0::1';

server.bind (5353);
server.on ('request', function onRequest (req, res) {
console.log({header:req.header,question:req.question});
    res.header = req.header;
    res.question = req.question;
    res.header.qr = 1;  /* is response */
    res.header.ancount = 0;
    res.header.aa = 1; /* authoritative */

    req.question.forEach(function(q) {
	switch(q.type) {
	case ndns.ns_t.a:
	    res.addRR(q.name, ndns.ns_t.a, ndns.ns_c.in, TTL, TARGETSERVER_A);
	    res.header.ancount++;
	    break;
	case ndns.ns_t.aaaa:
	    res.addRR(q.name, ndns.ns_t.aaaa, ndns.ns_c.in, TTL, TARGETSERVER_AAAA);
	    res.header.ancount++;
	    break;
	case ndns.ns_t.any:
	    res.addRR(q.name, ndns.ns_t.a, ndns.ns_c.in, TTL, TARGETSERVER_A);
	    res.addRR(q.name, ndns.ns_t.aaaa, ndns.ns_c.in, TTL, TARGETSERVER_AAAA);
	    res.header.ancount += 2;
	    break;
	case ndns.ns_t.ns:
	    res.addRR(q.name, ndns.ns_t.ns, ndns.ns_c.in, TTL, 'ns.' + q.name);
	    /* these two may need to go into the additional section */
	    res.addRR('ns.' + q.name, ndns.ns_t.a, ndns.ns_c.in, TTL, NAMESERVER_A);
	    res.addRR('ns.' + q.name, ndns.ns_t.aaaa, ndns.ns_c.in, TTL, NAMESERVER_AAAA);
	    res.header.ancount += 3;
	    break;
	}
    });

    res.send();
});

