#!/usr/bin/env node

var startupCmd = "";
const fs = require("fs");
const Rcon = require("rcon");
const { exec } = require("child_process");

fs.writeFile("latest.log", "", (err) => {
	if (err) console.log("Callback error in appendFile:" + err);
});

// Parse startup command from args
var args = process.argv.splice(process.execArgv.length + 2);
for (var i = 0; i < args.length; i++) {
	startupCmd += (i === args.length - 1) ? args[i] : args[i] + " ";
}

if (startupCmd.length < 1) {
	console.log("Error: Please specify a startup command.");
	process.exit();
}

function filter(data) {
	const str = data.toString().trim();
	
	if(str != null){
		console.log(str);
			
		fs.appendFile("latest.log", "\n" + str, (err) => {
			if (err) console.log("Callback error in appendFile:" + err);
		});
	}
}

// Start game process
console.log("Starting Renown...");
var exited = false;
const gameProcess = exec(startupCmd);

gameProcess.stdout.on("data", filter);
gameProcess.stderr.on("data", filter);


gameProcess.on("exit", function (code, signal) {
	exited = true;
	
	if (code) {
		console.log("Main game process exited with code " + code);
	}
});

function initialListener(data) {
	const command = data.toString().trim();
	
	if (command === "DoExit") {
		console.log('Exiting Game');
		process.exit();
	} else {
		console.log('Unable to run "' + command + '" due to RCON not being connected yet.');
		
		if(rcon == null || rcon == undefined){
			connectRcon();
			
			return;
		}
		
		if(!rcon.hasAuthed){
			connectRcon();
			
			return;
		}
	}
}

function commandProcessing (text) {
	const cmd = text.trim();
	
	if (cmd.length > 0)
		rcon.send(cmd);
	
	if (cmd === "DoExit") {
		if(exited) return;
		rcon.send("saveworld");
		console.log("Received request to stop the process, stopping the game...");
		exited = true;
		setTimeout(process.exit(), 5000);
		//process.exit();
	}
}

process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", initialListener);

process.on("exit", function (code) {
	if (exited) return;
	
	console.log("Received request to stop the process, stopping the game...");
	exited = true;
	
	gameProcess.kill("SIGTERM");
});

// ---- RCON Section ----
let rcon;
let heartbeatInterval;
let waiting = true;

function connectRcon() {
	const serverHostname = process.env.RCON_IP || "localhost";
	const serverPort = process.env.RCON_PORT || 28016;
	const serverPassword = process.env.RCON_PASS || "";

	console.log(`Attempting RCON connection.`);

	rcon = new Rcon(serverHostname, serverPort, serverPassword);

	rcon.on("auth", function () {
		console.log("Connected to RCON. Please wait until the server status switches to \"Running\".");
		waiting = false;

		process.stdin.removeListener("data", initialListener);
		
		gameProcess.stdout.removeListener("data", filter);
		gameProcess.stderr.removeListener("data", filter);

		process.stdin.on("data", commandProcessing);
		
		heartbeatInterval = setInterval(() => {
                if (rcon.hasAuthed) {
                    rcon.send("getchat");
                }
            }, 8000);
	});

	rcon.on("response", function (data) {
		const str = data.toString().trim();
		
		if(str != null){
			console.log(str);
			fs.appendFile("latest.log", "\n" + str, (err) => {
				if (err) console.log("Callback error in appendFile:" + err);
			});
		}
	});
	
	rcon.on("data", function (data) {
		const str = data.toString().trim();
		
		if(str != null){
			console.log(str);
			fs.appendFile("latest.log", "\n" + str, (err) => {
				if (err) console.log("Callback error in appendFile:" + err);
			});
		}
	});

	rcon.on("end", function () {
		waiting = true;
		clearInterval(heartbeatInterval);
		
		//console.log("RCON connection closed, retrying in 5 seconds...");
		process.stdin.removeListener("data", commandProcessing);
		
		setTimeout(connectRcon, 5000);
	});

	rcon.on("error", function (err) {
		waiting = true;
		clearInterval(heartbeatInterval);
		
		//console.log("RCON error:", err.message);
		process.stdin.removeListener("data", commandProcessing);
		
		setTimeout(connectRcon, 5000);;
	});

	rcon.connect();
	
}

connectRcon();
