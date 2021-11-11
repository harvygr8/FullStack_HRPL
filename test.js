var ping = require('ping');

var hosts='yahoo.com';
ping.promise.probe(hosts)
		.then(function (res) {
				console.log(res);
		});
