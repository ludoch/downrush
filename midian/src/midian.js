import $ from'./js/jquery-3.2.1.min.js';
import {openMidiDoc, MidiDoc} from './MidiDoc.jsx';

require('file-loader?name=[name].[ext]!../midian.htm');
require('file-loader?name=[name].[ext]!../css/edit.css');

import filegroup_template from "./templates/filegroup_template.handlebars";
import local_exec_head from "./templates/local_exec_head.handlebars";
import local_exec_info from "./templates/local_exec_info.handlebars";
import UndoStack from './UndoStack.js';
import {base64ArrayBuffer, base64ToArrayBuffer} from './base64data.js';
import Dropdown from './Dropdown.js';
import {openFileBrowser, saveFileBrowser, fileBrowserActive} from './FileBrowser.js';
import FileSaver from 'file-saver';
import {stepNextFile} from "./StepNextFile.js";

"use strict";

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0;
var sample_path_prefix = '/';

// Used to enable 'multiple samples open on one page'.
var multiDocs = false;

var gIdCounter = 0;
var localClipboard;

var focusMidiView;
var firstOpened = false;

function openMidiFile(e) {
	let initial;
	if (focusMidiView) initial = focusMidiView.fname;
	if (!initial) initial = '/';
	openFileBrowser({
		initialPath:  initial,
		opener: function(name) {
			openFile(name);
		}
	});
}

function stepNextAsync(dir) {
	setTimeout(e=>{
		stepNextFile(focusMidiView.fname, dir, openFile);
	}, 0);
}

function registerGlobalHandlers() {
	console.log('register global handlers');

	/* 
	$(window).on('paste', e=>{focusMidiView.pasteFromClip(e)});
	// iOS was screwing up if the following line was not commented out.
	$(window).on('copy', e=>{focusMidiView.copyToClip(e)});
	$(window).on('cut', e=>{focusMidiView.cutToClip(e)});

	$(window).on('undo', e=>{focusMidiView.doUndo(e)});
	$(window).on('redo', e=>{focusMidiView.doRedo(e)});
	*/

	$('.savebut').click(e=>{focusMidiView.saveAs(e)});
	$('.openmidibutn').click(e=>{openMidiFile(e)});
	$('.upbut').click(e=>{
		stepNextFile(focusMidiView.fname, -1, openFile);
	});
	
	$('.downbut').click(e=>{
		stepNextFile(focusMidiView.fname, 1, openFile);
	});
	
	$(document).keypress(function(e){
		focusMidiView.handleKeyPress(e);
	});

}

class MidiViewer {
  constructor(name) {

	this.idNumber = gIdCounter++;
	this.idString = "" + this.idNumber;
	this.homeId = this.idFor(name);
	this.html = filegroup_template({idsuffix: this.idNumber});
	this.undoStack = new UndoStack(10);
  }

  idFor(root) {
	return '#' + root + this.idString;
  }


// At present, our keypress handling is crude. Most keypresses come thru here, even if the focus
// is in other places. We filter-out file browser keypresses, and avoid other problems
// by not using number keys as shortcuts, which stays out of the way of the filter dials.
  handleKeyPress(e)
{
	if (fileBrowserActive()) return; // Mask keys intended for file browser.

	let ch = e.key;
	let chlow = ch.toLowerCase();

	if (chlow === 'u') {
		stepNextAsync(-1);
	} else if (chlow === 'd') {
		stepNextAsync(1);
	}
//	console.log("*** Key down: " + e.keyCode);
}

/*

	$('.upbut').click(e=>{
		stepNextFile(focusMidiView.fname, -1, openFile);
	});
	
	$('.downbut').click(e=>{
		stepNextFile(focusMidiView.fname, 1, openFile);
	});
*/
  bindGui() {
	let me = this;
	let id = this.idFor('butnrow');
	let baseEl = $(id);
/*
	var sfxdd = sfx_dropdn_template();
	new Dropdown(this.idFor('dropdn'), sfxdd, e=>{me.openFilter(e)});
	this.playBtnImg = $('.playbutimg', baseEl);
	this.undoBtn = $('.undobut', baseEl);
	this.redoBtn = $('.redobut', baseEl);
*/
}

  setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

  updateGui()
{


}

  startGuiCheck() {
	let me = this;
 	this.checker = e=>{me.updateGui()};
	if(!this.guiCheck) this.guiCheck = setInterval(this.checker, 200);
}

/*
// Chrome decided to only allow the browser access to the microphone when the page has been served-up via https
// since the FlashAir card doesn't do that, we can't record audio. Another annoying browser incapacity.
function record()
{
	var mike = new Microphone({}, this.wave.surfer);

	mike.start();
}
*/

// data = DOMException: Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).


//editor
  setEditData(data)
{
	if(!this.midiDoc) {
		this.midiDoc = openMidiDoc($(this.idFor('waveform'))[0]);
	}
	this.midiDoc.openOnBuffer(data);
	this.startGuiCheck();
	// let loadEndTime = performance.now();
	// console.log("Load time: " + (loadEndTime - loadStartTime));
}

// use ajax to load wav data (instead of a web worker).
  loadFile(fname)
{
	this.fname = fname;
	let me = this;
	$("#statind").text("Loading: " +  this.fname);
	$.ajax({
	url         : this.fname,
	cache       : false,
	processData : false,
	method:		'GET',
	type        : 'GET',
	success     : function(data, textStatus, jqXHR){
		me.setEditData(data);
		$("#statind").text(me.fname + " loaded.");
	},

	error: function (data, textStatus, jqXHR) {
		console.log("Error: " + textStatus);
	},

	xhr: function() {
		var xhr = new window.XMLHttpRequest();
		xhr.responseType= 'blob';
		return xhr;
	},

	});
}

// use ajax to save-back wav data (instead of a web worker).
  saveFile(filepath, data)
{
	let me = this;
	var timestring;
	var dt = new Date();
	var year = (dt.getFullYear() - 1980) << 9;
	var month = (dt.getMonth() + 1) << 5;
	var date = dt.getDate();
	var hours = dt.getHours() << 11;
	var minutes = dt.getMinutes() << 5;
	var seconds = Math.floor(dt.getSeconds() / 2);
	var timestring = "0x" + (year + month + date).toString(16) + (hours + minutes + seconds).toString(16);
	var urlDateSet = '/upload.cgi?FTIME=' + timestring + "&TIME="+(Date.now());;
	$.get(urlDateSet, function() {
		$.ajax(filepath, {
		headers:	{'Overwrite': 't', 'Content-type': 'audio/wav'},
		cache:		false,
		contentType: false,
		data:		data,
		processData : false,
		method:		'PUT',
		error:		function(jqXHR, textStatus, errorThrown) {
			alert(textStatus + "\n" + errorThrown);
		},
		success: function(data, textStatus, jqXHR){
			console.log("Save OK");
			$.ajax("/upload.cgi?WRITEPROTECT=OFF",{
				error:	function(jqXHR, textStatus, errorThrown) {
					alert(textStatus + "\n" + errorThrown);
				},
				headers: {"If-Modified-Since": "Thu, 01 Jan 1970 00:00:00 GMT"},
				success: function(data, textStatus, jqXHR){
					console.log("save and unlock done");
					$("#statind").text(filepath + " saved.");
				},
			})
		},

		xhr: function() {
			var xhr = new window.XMLHttpRequest();
			xhr.upload.addEventListener("progress", function(evt){
			  if (evt.lengthComputable) {
				  var percentComplete = Math.round(evt.loaded / evt.total * 100.0);
				  //Do something with upload progress
				 $("#statind").text(filepath + " " + percentComplete + "%");
				 //console.log(percentComplete);
			  }
			}, false);
		 	return xhr;
		 }
		});
	});
}

//---------Button-----------


//Save

  saveAs(){
	let me = this;
	saveFileBrowser({
		initialPath:  this.fname,
		saver: function(name) {
		//	let aBuf = me.midiDoc.getMidiFile;
		//	let saveData = audioBufferToWav(aBuf);
			// console.log("Save to: " + name);
		//	me.saveFile(name, saveData);
		}
	});
}

  saveFast(){
	// let aBuf = this.wave.backend.buffer;
	// let saveData = audioBufferToWav(aBuf);
	// this.saveFile(this.fname, saveData);
}


  openLocal(evt)
 {
 	let me = this;

	if (firstOpened && multiDocs) {
		 that = new MidiViewer('midiview');
		 $('#midiview').append(me.html);
		 me.bindGui();
		 focusMidiView = that;
	}
	firstOpened = true;
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	this.fname = f;
	var reader = new FileReader();
	if(!me.midiDoc) {
		me.midiDoc = new MidiDoc(me.idFor('midiview'));
	}

// Closure to capture the file information.
	reader.onloadend = (function(theFile) {
		me.midiDoc.openOnBuffer(theFile);
		me.startGuiCheck();
	})(f);
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
 }
/*
 genWAV() {
 	let aBuf = this.wave.backend.buffer;
	let saveData = audioBufferToWav(aBuf);
	return saveData;
 }
*/
}; // ** End of class

//.value

function downloader(evt) {
	if(!focusMidiView) return;
	/*
	let saveWAV = focusMidiView.genWAV();
	var blob = new Blob([saveWAV], {type: "audio/wav"});
	let saveName;
	if (local_exec) {
		saveName = focusMidiView.fname.name 
	} else {
		saveName = focusMidiView.fname.split('/').pop();
	}
	console.log(saveName);
	FileSaver.saveAs(blob, saveName);
	*/
}

//---------- When reading page -------------
function onLoad()
{
	let homeDoc = new MidiViewer('midiview');
	$('#midiview').append(homeDoc.html);

	if(!focusMidiView) {
		focusMidiView = homeDoc;
		registerGlobalHandlers();
	}

	if(!local_exec) {
		var urlarg = location.search.substring(1);
		let fname = decodeURI(urlarg);
		homeDoc.loadFile(fname);
	} else { // We are running as a 'file://', so change the GUI to reflect me.
		$('#filegroup').remove();
		$('#filegroupplace').append(local_exec_head());
		$(homeDoc.idFor('jtab')).append (local_exec_info());
		$('#opener').on('change', (e)=>{homeDoc.openLocal(e)});
	}
	$('#downloadbut').click((e)=>{downloader(e)});
	homeDoc.bindGui();
}

function openFile(fname)
{
	let homeDoc = new MidiViewer('midiview');
	homeDoc.loadFile(fname);
	if(!multiDocs) $('#midiview').empty();
	$('#midiview').append(homeDoc.html);

	homeDoc.bindGui();

	focusMidiView = homeDoc;
}

window.onload = onLoad;