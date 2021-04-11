require('dotenv').config();
const { json } = require('express');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const jp = require('jsonpath');
const { v4: uuidv4 } = require('uuid');

app.get('/', function(req, res) {
    res.render('index.ejs');
});

app.get('/:table', function(req, res) {
	// if (req.header('password') == process.env.password) {
    res.send(`${fs.readFileSync('./json/' + req.params.table + '.json')}`);
	// } else {
	// 	res.send('invalid or missing password. include it as the \'password\' header')
	// };
});

app.get('/:table/:entryid', function(req, res) {
	// if (req.header('password') == process.env.password) {
		tabledata = JSON.parse(fs.readFileSync('./json/' + req.params.table +'.json', 'utf8'));
		returnjson = jp.query(tabledata, `$..[?(@._id =='${req.params.entryid}')]`)
		res.send(returnjson);
	// } else {
	// 	res.send('invalid or missing password. include it as the \'password\' header')
	// };
});

io.sockets.on('connection', function(socket) {

	io.emit('prompt');
	console.log('Client connected')

    socket.on('password', function(password) {

        if (password == process.env.password) {
			console.log('Client logged in as: '+ socket.id);

			var jsondata = fs.readFileSync('./json/table15.json', 'utf8');

			io.emit('login', jsondata);
		} else {
			io.emit('fail')
			console.log('Failed login with: ' + password)
		}
    });

	socket.on('request', function(requestid) {
        console.log('Requested entry: '+ requestid);

			var jsondata = JSON.parse(fs.readFileSync('./json/table15.json', 'utf8'));
			returnjson = jp.query(jsondata, `$..[?(@._id =='${requestid}')]`);
			console.log(returnjson);
			io.emit('returnEntry', JSON.stringify(returnjson));
    });

	socket.on('writeEntry', function(entrydata) {
		var jsondata = JSON.parse(fs.readFileSync('./json/table15.json', 'utf8'));
		console.log(`Pre-write table: ${JSON.stringify(jsondata)}`);

		var entry = [{}];
		entry[0]._id = uuidv4();
		entry[0]._date = new Date();
		entrydataobj = JSON.parse(entrydata);
		entry[0] = Object.assign(entry[0], entrydataobj);

		console.log(entry);

		jsondata = jsondata.concat(entry);
		console.log(jsondata);

		fs.writeFileSync('./json/table15.json', `${JSON.stringify(jsondata)}`, function(err) {
		 	if (err) throw err;
		});
    });

});

const server = http.listen(8080, function() {
    console.log('listening on http://localhost:8080');
});