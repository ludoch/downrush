"use strict";

// Change the following line as needed to point to the parent directory containing your sample directory.
// If you leave it undefined, our code will make an informed guess as to where your samples are located.
// You probably don't need to change it.
var custom_sample_path = undefined;

// Flag to enable local execution (not via the FlashAir web server)
var local_exec = document.URL.indexOf('file:') == 0;

var sample_path_prefix = '/';
var filename_input = document.getElementById ("fname");//.value
// var arg_input = document.getElementById ("line");//.value

var stat_output = document.getElementById ("status")//.value
var respons_output = document.getElementById( "res" )//.innerHTML;

var fname = "";

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

var localClipboard;

class UndoStack {
	constructor(limit) {
		this.stack = [];
		this.index = -1;
		this.limit = limit;
	}
	
	atTop() {
		return this.index === -1;
	}

	canUndo() {
		if(this.stack.length === 0) return false;
		return this.index === -1 || this.index > 0;
	}

	canRedo() {
		if(this.stack.length === 0 || this.index === -1) return false;
		return this.index < this.stack.length - 1;
	}

	push(item) {
		if (this.index >= 0) {
			while (this.index < this.stack.length) this.stack.pop();
			this.index = -1;
		}
		if (this.limit && this.stack.length > this.limit) {
			this.stack.shift();
		}
		this.stack.push(item);
	}

	undo() {
		if (this.stack.length === 0) return undefined;
		if (this.index === -1) { // start one behind the redo buffer
			this.index = this.stack.length - 1;
		}
		if (this.index > 0) this.index--;
		let v = this.stack[this.index];
		return v;
	}

	redo() {
		if (this.stack.length === 0 || this.index === -1) return undefined;
		let nextX = this.index + 1;
		if (nextX >= this.stack.length) return undefined;
		this.index = nextX;
		return this.stack[this.index];
	}
};

var undoStack = new UndoStack(10);



function redrawWave()
{
	//wavesurfer.peakCache.clearPeakCache();
	wavesurfer.drawBuffer();
	wavesurfer.minimap.render();
}


// Page transition warning

var unexpected_close = true;

var wavesurfer;
var TimelinePlugin = window.WaveSurfer.timeline;
var RegionPlugin = window.WaveSurfer.regions;
var Minimap = window.WaveSurfer.minimap;
//var Microphone = window.WaveSurfer.microphone;
var disableWaveTracker;

function openOnBuffer(decoded)
{
	var plugs =  [
		TimelinePlugin.create({
			container: '#waveform-timeline'
			}),
		RegionPlugin.create({
			dragSelection: false,
			}),
			
		Minimap.create({
			container: '#minimap',
			height: 30,
			barHeight: 1.4,
			interact:	true,
			// showOverview: true,
			})
		];

	$('#waveform').empty();
	$('#waveform-timeline').empty();
	$('#minimap').empty();

	wavesurfer = WaveSurfer.create({
		container:		'#waveform',
		waveColor:		'violet',
		progressColor:	'purple',
		splitChannels:	true,
		interact:		false,
		fillParent:		false,
		scrollParent:	true,
		plugins:		plugs,
		partialRender:  false,
		renderer:	JFFCanvas,
	//	barWidth:	1,
	});
// Patch in an override to the drawBuffer function.
wavesurfer.drawBuffer = overDrawBuffer;

	wavesurfer.loadBlob(decoded);


	wavesurfer.on('ready', function () {
		let buf = wavesurfer.backend.buffer;
		let dat = buf.getChannelData(0);
		
		let dur = wavesurfer.getDuration();
		let w = wavesurfer.drawer.getWidth();
		if (dur !== 0) {
			let pps = w / dur * 0.9;
			wavesurfer.zoom(pps);
		}
		disableWaveTracker = setupWaveTracker();
});	

/*
	var slider = document.querySelector('#slider');

	slider.oninput = function () {
		var zoomLevel = Number(slider.value);
		console.log(zoomLevel);
		wavesurfer.zoom(zoomLevel);
	};
*/
}

function getSelection() {
	let buffer = wavesurfer.backend.buffer;
	let srcLen = buffer.getChannelData(0).length;
	let regionMap = wavesurfer.regions.list;
	
	let startT = 0;
	let regional = false;
	let dur =  wavesurfer.getDuration()
	let endT = dur;
	let progS = wavesurfer.drawer.progress() * endT;
	let region = regionMap[function() { for (var k in regionMap) return k }()];
	let cursorTime = wavesurfer.getCurrentTime();

	if (region && region.start < region.end) {
		startT = region.start;
		endT = region.end;
		regional = true;
	}
	let cursorPos = secondsToSampleNum(cursorTime, buffer);
	let startS = secondsToSampleNum(startT, buffer);
	let endS = secondsToSampleNum(endT, buffer);

	return {
		length: srcLen,
		regional: regional,
		start:	startT,
		end:	endT,
		first:  startS,
		last:	endS,
		progress: progS,
		region: region,
		cursorTime: cursorTime,
		cursorPos: 	cursorPos,
		duration:	dur,
	};
}

function seekCursorTo(e) {
	let progress = wavesurfer.drawer.handleEvent(e);
	wavesurfer.seekTo(progress);
}

function setupWaveTracker() {
	var region;
	var dragActive;
	var t0;
	var t1;
	var duration;
	var scroll = wavesurfer.params.scrollParent;
	var scrollSpeed = wavesurfer.params.scrollSpeed || 1;
	var scrollThreshold = wavesurfer.params.scrollThreshold || 10;
	var maxScroll = void 0;
	var scrollDirection = void 0;
	var wrapperRect = void 0;
	var wrapper = wavesurfer.drawer.wrapper;
	var repeater;

	var rangeUpdater = function(e) {
		t1 = wavesurfer.drawer.handleEvent(e);
		let tS = t0;
		let tE = t1;
		if (t1 < t0) {
			tS = t1;
			tE = t0;
			wavesurfer.seekTo(t1);
		}
		region.update({
			start:	tS * duration,
			end:	tE * duration
		});
	}

	var edgeScroll = function edgeScroll(e) {
		if (!region || !scrollDirection) return;

	// Update scroll position
		var scrollLeft = wrapper.scrollLeft + scrollSpeed * scrollDirection;
		var nextLeft =  Math.min(maxScroll, Math.max(0, scrollLeft));
		wrapper.scrollLeft = scrollLeft = Math.min(maxScroll, Math.max(0, scrollLeft));
		rangeUpdater(e);
		// Check that there is more to scroll and repeat
		if(scrollLeft < maxScroll && scrollLeft > 0) {
			window.requestAnimationFrame(function () {
			edgeScroll(e);
			});
		}
	};

	var eventMove = function (e) {
		if (!dragActive) return;
		rangeUpdater(e);
		// If scrolling is enabled
		if (scroll && wavesurfer.drawer.container.clientWidth < wrapper.scrollWidth) {
			// Check threshold based on mouse
			var x = e.clientX - wrapperRect.left;
			if (x <= scrollThreshold) {
				scrollDirection = -1;
			} else if (x >= wrapperRect.right - scrollThreshold) {
				scrollDirection = 1;
			} else {
				scrollDirection = null;
			}
			scrollDirection && edgeScroll(e);
		}
	}

	var eventUp = function (e) {
		dragActive = false;
		if (region) {
			region.fireEvent('update-end', e);
			wavesurfer.fireEvent('region-update-end', region, e);
		}
		region = null;
		let win = $(window); // disconnect listeners.
		win.off('mousemove', eventMove);
		win.off('touchmove', eventMove);
		win.off('mouseup', eventUp);
		win.off('touchend', eventUp);
	}


	var eventDown = function (e) {
		duration = wavesurfer.getDuration();
		// Filter out events intended for the scroll bar
		let hasScroll = wavesurfer.params.scrollParent;
		let r = e.target.getBoundingClientRect();

		if (hasScroll && e.clientY > (r.bottom - 16)) return; // *** JFF Hack magic number.

		maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
		wrapperRect = wrapper.getBoundingClientRect();

		t0 = wavesurfer.drawer.handleEvent(e);

		let xD = e.clientX;

		if (hasScroll) {
			xD += wrapper.scrollLeft;
		}

		t1 = t0;
		if (wavesurfer.isPlaying()) {
			dragActive = false;
			seekCursorTo(e);
		} else {
			dragActive = true;
			wavesurfer.regions.clear();
			wavesurfer.seekTo(t0);
			let pos = {
				start:	t0 * duration,
				end:	t1 * duration,
				drag:	false,
				resize: false,
			};
			region = wavesurfer.regions.add(pos);
		}
		let win = $(window);
		win.on('mousemove', eventMove); // dynamic listeners
		win.on('touchmove', eventMove);
		win.on('mouseup', eventUp);
		win.on('touchend', eventUp);
		//console.log('down');
	}

	let waveElem = $('#waveform');

	waveElem.on('mousedown', eventDown);
	waveElem.on('touchstart', eventDown);

	return function() {
		waveElem.off('mousedown', eventDown);
		waveElem.off('touchstart', eventDown);
	 };
}

var createOfflineContext  = function (buffer) {
	let {numberOfChannels, sampleRate} = buffer;
	return new OfflineContext(numberOfChannels, buffer.getChannelData(0).length, sampleRate);
}

function secondsToSampleNum(t, buffer) {
	let sn = t * buffer.sampleRate;
	if (sn < 0) return 0;
	if (sn > buffer.getChannelData(0).length) return buffer.getChannelData(0).length
	return Math.round(sn);
}


var testFilterGraph = function (ctx)
{
	//set up the different audio nodes we will use for the app
	let analyser = ctx.createAnalyser();
	let distortion = ctx.createWaveShaper();
	let gainNode = ctx.createGain();
	let biquadFilter = ctx.createBiquadFilter();
	let convolver = ctx.createConvolver();

	biquadFilter.type = "lowshelf";
	biquadFilter.frequency.value = 1000; //.setValueAtTime(1000, ctx.currentTime);
	biquadFilter.gain.value = 25; // .setValueAtTime(25, ctx.currentTime);

	let filtList = [analyser, distortion, biquadFilter, gainNode];
	return filtList;
}

// Apply a filter transform implemented using the AudioContext filter system to the selected area
// and paste back the result.
// the setup function is called to knit together the filter graph desired.
function applyFilterTransform(setup)
{
	let working = copySelected();
	let ctx = createOfflineContext(working);
	
	let filters;
	
	if (setup !== undefined) {
		filters = setup(ctx, working);
	} 
	
	let source = ctx.createBufferSource();

	// Connect all filters in the filter chain.
	let prevFilter = source;
	if (filters) {
		for (var i = 0; i < filters.length; ++i) {
			let thisFilter = filters[i];
			prevFilter.connect(thisFilter);
			prevFilter = thisFilter;
		}
	}
	prevFilter.connect(ctx.destination);

	source.buffer = working;
	source.start();

	ctx.oncomplete = function (e) {
		pasteSelected(e.renderedBuffer);
	}
	ctx.startRendering();
/*
	ctx.startRendering().then(function(renderedBuffer) {
		pasteSelected(renderedBuffer);
	}).catch(function(err) {
		alert('Rendering failed: ' + err);
	});
*/
}

function testOfflineContext(e) {
	applyFilterTransform(testFilterGraph);
}

// Simplified to just multiply by 1/max(abs(buffer))
// (which preserves any existing DC offset).
var normalize = function (buffer)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		var maxv = -1000000;
		let d = buffer.getChannelData(cx);
		for (var i = 0; i < d.length; ++i) {
			let s = d[i];
			if (s < 0) s = -s;
			if (s > maxv) maxv = s;
		}
		if (maxv === 0) return;
		let scaler = 1.0 / maxv;
		for (var i = 0; i < d.length; ++i) {
			d[i] = d[i]* scaler;
		}
	}

	return buffer;
}


function reverse (buffer)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;
	let halfbuf = bufLen / 2;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let d = buffer.getChannelData(cx);
		let td = bufLen - 1;
		for (var i = 0; i < halfbuf; ++i) {
			let s = d[i];
			d[i] = d[td];
			d[td--] = s;
		}
	}

	return buffer;
}

var applyFunction = function (buffer, f)
{
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = buffer.getChannelData(0).length;

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		var minv = 1000000;
		var maxv = -1000000;
		let d = buffer.getChannelData(cx);
		for (var i = 0; i < d.length; ++i) {
			d[i] = f(d[i], i, bufLen);
		}
	}

	return buffer;
}


function changeBuffer(buffer) {
	if (!buffer) return;

	let playState = wavesurfer.isPlaying();
	let songPos;
	if (playState) {
		console.log('pausing');
		wavesurfer.pause();
		songPos = wavesurfer.getCurrentTime();
	}

	wavesurfer.backend.load(buffer);
	redrawWave();
	if (playState) {
		if (songPos < 0) songPos = 0;
		let dur = wavesurfer.getDuration();
		if (songPos < dur) {
			wavesurfer.play(songPos);
			console.log('playing');
		}
	}
}

function doPlaySel(e)
{
	let buffer = wavesurfer.backend.buffer;
	let {start, end} = getSelection(buffer);
	wavesurfer.play(start, end);
}


var deleteSelected = function (e)
{
	let buffer = wavesurfer.backend.buffer;
	let {regional, length, first, last, region} = getSelection(buffer);
	if (!regional) return;

	let ds = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let bufLen = length - ds;
	if (bufLen === 0) bufLen = 1;
	let nextBuffer = audioCtx.createBuffer(numberOfChannels, bufLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let dx = 0;
		for(var i = 0; i < first; ++i) {
			da[dx++] = sa[i];
		}
		for(var i = last; i < length; ++i) {
			da[dx++] = sa[i];
		}
	}
	if(region) region.remove();
	undoStack.push(buffer);
	changeBuffer(nextBuffer);
}

var copySelected = function (e)
{
	let buffer = wavesurfer.backend.buffer;
	let {length, first, last, region} = getSelection(buffer);
	let ds = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let nextBuffer = audioCtx.createBuffer(numberOfChannels, ds, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let dx = 0;
		for(var i = first; i < last; ++i) {
			da[dx++] = sa[i];
		}
	}
	return nextBuffer;
}

// Apply a transform function to the selected area and replace the selected area
// with the result. The transform function can be either 'in place' or can return a
// result buffer of any size.
function applyTransform(f, f2)
{
	let working = copySelected();
	let result = f(working, f2);
	pasteSelected(result);
}

function reverser(e) {
	applyTransform(reverse);
}

function normalizer(e) {
	
	applyTransform(normalize);
}

function fadeIn(e) {
	
	let f = function (s, i, len) {
		return s * (i / len);
	}
	applyTransform(applyFunction, f);
}

function fadeOut(e) {
	
	let f = function (s, i, len) {
		return s * (1.0 - i / len);
	}
	applyTransform(applyFunction, f);
}

function selAll(e) {
	let {regional, start, end, duration} = getSelection(wavesurfer.backend.buffer);
	wavesurfer.regions.clear();
	wavesurfer.seekTo(0);
	// If wa are alread a full selection, quit right after we cleared.
	if (regional && start === 0 && end === duration) return;

	let pos = {
		start:	0,
		end:	wavesurfer.getDuration(),
		drag:	false,
		resize: false,
	};
	wavesurfer.regions.add(pos);
}


var pasteSelected = function (pasteData, checkInsert)
{
	let buffer = wavesurfer.backend.buffer;

	let {regional, cursorTime, cursorPos, length, first, last, region} = getSelection(buffer);

	if (checkInsert && !regional) { // regionl === false means its an insertion point.
		first = cursorPos;
		last = cursorPos;
	}

	let pasteLen = pasteData.getChannelData(0).length;
	let dTs = last - first;
	let {numberOfChannels, sampleRate} = buffer;
	let numPasteChannels = pasteData.numberOfChannels;
	let bufLen = length - dTs + pasteLen;
	let nextBuffer = audioCtx.createBuffer(numberOfChannels, bufLen, sampleRate);

	for (var cx = 0; cx < numberOfChannels; ++cx) {
		let sa = buffer.getChannelData(cx);
		let da = nextBuffer.getChannelData(cx);
		let pdx = cx < numPasteChannels ? cx : 0;
		let cb = pasteData.getChannelData(pdx);
		let dx = 0;
		for(var i = 0; i < first; ++i) {
			da[dx++] = sa[i];
		}

		for(var i = 0; i < pasteLen; ++i) {
			da[dx++] = cb[i];
		}

		for(var i = last; i < length; ++i) {
			da[dx++] = sa[i];
		}
	}
	//if(region) region.remove();
	undoStack.push(buffer);
	changeBuffer(nextBuffer);
}


function doUndo(e) {
	console.log("Undo");

	if (undoStack.atTop()) {
		let buffer = wavesurfer.backend.buffer;
		undoStack.push(buffer);
	}
	let unbuf = undoStack.undo();
	changeBuffer(unbuf);
}

function doRedo(e) {
	console.log("Redo");
	let redo = undoStack.redo();
	changeBuffer(redo);
}


function base64ArrayBuffer(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer);
  var byteLength    = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength    = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Insert newlines to avoid super-long strings.
  	if ((i !== 0) && ((i % 72) === 0)) {
    	base64 += '\n';
    }
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }

  return base64
}

function base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function copyToClip(e) 
{
	let clip = e.originalEvent.clipboardData;

	let clipBuff =  copySelected();
	let wavData = audioBufferToWav(clipBuff);
	let asText = base64ArrayBuffer(wavData);
	localClipboard = clipBuff;
	if (clip) clip.setData('text/plain', asText);
	e.preventDefault();
}
/********
// Populate copy to clip board button.
var clipper = new Clipboard('#copybut', {
	text: function(trigger) {
		let clipBuff =  copySelected();
		let wavData = audioBufferToWav(clipBuff);
		let asText = base64ArrayBuffer(wavData);
		// alert(asText);
		console.log("returning clipboard data");
		return asText;
		}
});
*********/

function cutToClip(e) {
	copyToClip(e);
	deleteSelected(e);
}

function pasteFromClip(e)
{
	let clipBd = e.originalEvent.clipboardData;
	if (clipBd) {
		let clip = clipBd.getData('text/plain');
		if (clip.startsWith('Ukl')) {
			let asbin = base64ToArrayBuffer(clip);
			wavesurfer.backend.decodeArrayBuffer(asbin, function (data) {
			if (data) pasteSelected(data, true);
	 	  }, function (err) {
			alert('paste decode error');
		  });
		  return;
		}
	}
	if (localClipboard) pasteSelected(localClipboard, true);
}

function zoom(amt) {
	
	let minPxWas = wavesurfer.params.minPxPerSec;
	let newPx = minPxWas * amt;
	let zoomLimit = 44100;
	let dur = wavesurfer.getDuration();
	/*
	if (dur > 60) zoomLimit = 2756.25; 
		else if (dur > 30) zoomLimit = 5512.5;
			else if (dur > 16) zoomLimit = 11025;
				else if (dur > 10) zoomLimit = 22050;
	*/
	if (newPx > zoomLimit) newPx = zoomLimit;
// console.log('zoom rate: ' + newPx);
	wavesurfer.zoom(newPx);
}


$(window).on('paste', pasteFromClip);
// iOS was screwing up if the following line was not commented out.
$(window).on('copy', copyToClip);
$(window).on('cut', cutToClip);

$(window).on('undo', doUndo);
$(window).on('redo', doRedo);
// Remove highlighting after button pushes:
$('.butn').mouseup(function() { this.blur()});

$('#plsybut').on('click',(e)=>{wavesurfer.playPause(e)});
$('#rewbut').on('click', (e)=>{wavesurfer.seekTo(0)});
$('#plsyselbut').on('click', doPlaySel);
$('#undobut').on('click', doUndo);
$('#redobut').on('click', doRedo);
$('#delbut').on('click', deleteSelected);
$('#cutbut').on('click', cutToClip);
$('#copybut').on('click', copyToClip);
$('#pastebut').on('click',pasteFromClip);
$('#normbut').on('click',normalizer);
$('#testbut').on('click',testOfflineContext);
$('#reversebut').on('click',reverser);
$('#fadeinbut').on('click',fadeIn);
$('#fadeoutbut').on('click',fadeOut);
$('#selallbut').on('click',selAll);


var playBtnImg = $('#playbutimg');
var undoBtn = $('#undobut');
var redoBtn = $('#redobut');

function setDisable(item, state)
{
	item.prop("disabled", state);
	item.css('opacity', state ? 0.3: 1.0);
}

function updateGui()
{
	if(!wavesurfer) return;
	let playState = wavesurfer.isPlaying();

	let newPlayImg = "img/glyphicons-174-play.png"
	if (playState) newPlayImg = "img/glyphicons-175-pause.png";
	if (playBtnImg.attr('src') !== newPlayImg) {
		playBtnImg.attr('src',newPlayImg);
	}

	let canUndo = undoStack.canUndo();
	setDisable(undoBtn, !canUndo);

	let canRedo = undoStack.canRedo();
	setDisable(redoBtn, !canRedo);
}

var guiCheck = setInterval(updateGui, 200);

/*
// Chrome decided to only allow the browser access to the microphone when the page has been served-up via https
// since the FlashAir card doesn't do that, we can't record audio. Another annoying browser incapacity.
function record()
{
	var mike = new Microphone({}, wavesurfer);

	mike.start();
}
*/

// data = DOMException: Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).


//editor
function setEditData(data)
{
	openOnBuffer(data);
}

function openLocal(evt)
{
	var files = evt.target.files;
	var f = files[0];
	if (f === undefined) return;
	var reader = new FileReader();
	
// Closure to capture the file information.
	reader.onloadend = (function(theFile) {
		return openOnBuffer(theFile);
	/*
		return function(e) {
			// Display contents of file
				let buffer = e.target.result;
				openOnBuffer(buffer);
			//	audioCtx.decodeAudioData(buffer).then(function (decoded) {
			//		openOnbuffer(decoded);
			//	});
			};
			*/
		})(f);
	// Read in the image file as a data URL.
	reader.readAsBinaryString(f);
}



//---------- When reading page -------------
function onLoad()
{
	// Getting arguments
	var urlarg = location.search.substring(1);
	if(urlarg != "")
	{
		// Decode and assign to file name box
		filename_input.value = decodeURI(urlarg);
	}

	if(!local_exec) {
		postWorker("load");
		fname = filename_input.value;
	} else {
		$('#filegroup').remove();
		$('#filegroupplace').append(local_exec_head());
		$('#jtab').append (local_exec_info());
		$('#opener').on('change', openLocal);
		if (custom_sample_path) {
			sample_path_prefix = custom_sample_path;
		} else {
			if (document.URL.indexOf('DR/xmlView')> 0) {
				sample_path_prefix = '../../';
			} else if (document.URL.indexOf('xmlView')> 0) {
				sample_path_prefix = '../';
			} else sample_path_prefix = '';
		}
	}
}
window.onload = onLoad;


// Snarfed from: https://github.com/Jam3/audiobuffer-to-wav/blob/master/index.js
function audioBufferToWav (buffer, opt) {
  opt = opt || {}

  let {numberOfChannels, sampleRate} = buffer;
  var format = opt.float32 ? 3 : 1
  var bitDepth = format === 3 ? 32 : 16

  var result
  if (numberOfChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1))
  } else {
    result = buffer.getChannelData(0)
  }

  return encodeWAV(result, format, sampleRate, numberOfChannels, bitDepth)
}

function encodeWAV (samples, format, sampleRate, numChannels, bitDepth) {
  var bytesPerSample = bitDepth / 8
  var blockAlign = numChannels * bytesPerSample

  var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  var view = new DataView(buffer)

  /* RIFF identifier */
  writeString(view, 0, 'RIFF')
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  /* RIFF type */
  writeString(view, 8, 'WAVE')
  /* format chunk identifier */
  writeString(view, 12, 'fmt ')
  /* format chunk length */
  view.setUint32(16, 16, true)
  /* sample format (raw) */
  view.setUint16(20, format, true)
  /* channel count */
  view.setUint16(22, numChannels, true)
  /* sample rate */
  view.setUint32(24, sampleRate, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true)
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true)
  /* bits per sample */
  view.setUint16(34, bitDepth, true)
  /* data chunk identifier */
  writeString(view, 36, 'data')
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true)
  if (format === 1) { // Raw PCM
    floatTo16BitPCM(view, 44, samples)
  } else {
    writeFloat32(view, 44, samples)
  }

  return buffer
}

function interleave (inputL, inputR) {
  var length = inputL.length + inputR.length
  var result = new Float32Array(length)

  var index = 0
  var inputIndex = 0

  while (index < length) {
    result[index++] = inputL[inputIndex]
    result[index++] = inputR[inputIndex]
    inputIndex++
  }
  return result
}

function writeFloat32 (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 4) {
    output.setFloat32(offset, input[i], true)
  }
}

function floatTo16BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}

function writeString (view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}



//-------keyin--------
document.onkeydown = function (e){
	if(!e) e = window.event;

	if(e.keyCode == 112) //F1
	{
		btn_save();
		return false;		
	}

	if(e.keyCode == 123) //F12
	{
		btn_load();
		return false;		
	}
};



//---------Button-----------

//CONFIG
function btn_config()
{
//	if(window.confirm('Load /SD_WLAN/CONFIG?'))
//	{
		filename_input.value="/SD_WLAN/CONFIG";
		postWorker("load");
//	}
}

//Load
function btn_load()
{
//	if(window.confirm('Load ?'))
//	{
		postWorker("load");
		fname = filename_input.value;
//	}
	// jsEditor.markClean();
}

//Save

function btn_save(){

	if(fname != filename_input.value)
	{
		if(!window.confirm('Are you sure you want to save it? \n(Target file name has changed !)'))
		{
			return;
		}
	}
	fname = filename_input.value;

	postWorker("save");
	// jsEditor.markClean();
}

//---------handler-----------

var status_str="";
//status
function clrStat()
{
	status_str="";
	stat_output.value = status_str;
}

// add one line to status
function addStat(x)
{
	status_str += "\n" + x;
	stat_output.value = status_str;
	stat_output.scrollTop = stat_output.scrollHeight;
}

//Worker
function postWorker(mode)
{
	var saveData  = "";
	if(mode === 'save') {
		let aBuf = wavesurfer.backend.buffer;
		saveData = audioBufferToWav(aBuf);
	}

	var msg = {
		filepath: filename_input.value,
		arg: "", // arg_input.value,
		mode: mode,
		edit: saveData,
	};
	worker.postMessage(msg);
}

//------------Worker---------------
if (!local_exec && !window.Worker) {
	alert("Web Worker disabled! Editor won't work!")
}

var worker;

if (!local_exec) {
try {
	worker = new Worker("WAVworker.js");
}catch (e) {
	addStat("Exception!(UI): "+e.message);
}
worker.onmessage = function(e) {
	// RPC outfitting

	//debug
	if(e.data.func == "console.log")
	{
		console.log(e.data.arg);
	}
	if(e.data.func == "clearStatus")
	{
		clrStat();
	}
	if(e.data.func == "addStatus" || e.data.func == "setResponse")
	{
		addStat(e.data.arg);
	}
	if(e.data.func == "setEditor")
	{
		setEditData(e.data.arg);
	}
};

}
