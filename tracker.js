//CODE TO SEE PRICE CHANGE TRACKER GRAPH IN DCA

//SEE CODE AFTER!

//1. Install https://chrome.google.com/webstore/detail/custom-javascript-for-web/poakhlngfciodnhlhhgnaaelnpjljija?utm_source=chrome-app-launcher-info-dialog

//2. Go to your PT WEB GUI DCA LOG

//3. Copy the code and then click the extention button. Then paste the code in and click save!

//4. Profit!?!

//https://gyazo.com/688a3a835401b4262dd38fb604058624

// --- created by Sokol815 1/17/2018
(function(){
	var util = {};

	util.createHiDPICanvas = function(w, h, ratio, elementUse) {
		if(!window.PIXEL_RATIO) {
		    window.PIXEL_RATIO = (function () {
		   		var ctx = document.createElement("canvas").getContext("2d"),
		        dpr = window.devicePixelRatio || 1,
		        bsr = ctx.webkitBackingStorePixelRatio ||
		              ctx.mozBackingStorePixelRatio ||
		              ctx.msBackingStorePixelRatio ||
		              ctx.oBackingStorePixelRatio ||
		              ctx.backingStorePixelRatio || 1;

			    return dpr / bsr;
			})();
		}
	    if (!ratio) { ratio = window.PIXEL_RATIO; }
	    var can = (Array.isArray( elementUse ) ? elementUse[0] : elementUse);
	    can.width = w * ratio;
	    can.height = h * ratio;
	    can.style.width = w + "px";
	    can.style.height = h + "px";
	    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
	    return can;
	};

	util.graph = function() {
		this.stats = {
			totalSamples: 30,
			data: []
		};
		this.stats.data = new Array( this.stats.totalSamples );
		this.stats.data = this.stats.data.join(',').split(',').map(function() { return null; });
	};

	util.graph.prototype.setSelector = function( selector ) {
		this.destination = selector[0];

		var width = selector.width();
		var height = selector.height();

		var canvas = $('#myCanvas');
		var self = this;
		if( canvas.length < 1 ) {
			$('body').append('<div style="position:absolute;display:none;"><canvas id="myCanvas"></canvas></div>');
			var canvas = $('#myCanvas');
			canvas = util.createHiDPICanvas(width, height, 1, canvas[0] );
			util.canvas = canvas;
			util.canvasContext = canvas.getContext('2d');
		}
		this.canvas = canvas;
	};

	util.graph.prototype.rangePad = .02;

	util.graph.prototype.updateStats = function(value) {
		this.stats.data.push( value );
		this.stats.data.shift(); // remove the oldest value
	};

	util.graph.prototype.drawStats = function() {
		var ctx = util.canvasContext;
		var size = this.destination.getBoundingClientRect()
		if( size.width != util.canvas.width || size.height != util.canvas.height ) {
			util.canvas = util.createHiDPICanvas(size.width, size.height, 1, $('#myCanvas')[0] );
			util.canvasContext = util.canvas.getContext('2d');
		}
		ctx.clearRect( 0, 0, size.width, size.height );
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		ctx.beginPath();
		var first = true;
		var totalRun = this.stats.totalSamples;
		var range = {min: 1e8, max: -1e8, size: 0};
		this.stats.data.forEach(function(c){
			if( c !== null ) {
				range.min = Math.min(c,range.min);
				range.max = Math.max(c,range.max);
			}
		});

		range.min -= this.rangePad; //pad range size
		range.max += this.rangePad; //pad range size
		range.size = range.max - range.min;

		var first = true;
		var index = 0;
		for( var i = 0; i < totalRun; i++ ) {
			if( this.stats.data[i] != null ) {
				if( first ) {
					first = false;
					ctx.moveTo( index/totalRun * size.width, size.height - ((this.stats.data[i] - range.min) / range.size * size.height) );
				} else {
					ctx.lineTo( index/totalRun * size.width, size.height - ((this.stats.data[i] - range.min) / range.size * size.height) );
				}
				index++;
			}
		}
		ctx.stroke();
		var res = 'url('+util.canvas.toDataURL()+')';

		this.destination.style['backgroundImage'] = res;
		this.destination.style['backgroundRepeat'] = 'no-repeat';

	};

	var pairData = {};
	var freshPairCutoff = 30000;
	var tick = function( data ) {
		var now = Date.now();
		var keys = Object.keys( pairData );
		for( var i = 0; i < keys.length; i++ ) {
			if( now - pairData[keys[i]].lastTick > freshPairCutoff ) {
				delete pairData[keys[i]];
			}
		}

		for( var i = 0; i < data.dcaLogData.length; i++ ) {
			var pair = data.dcaLogData[i].market;
			if( pairData[pair] == undefined ) {
				pairData[pair] = {
					lastTick: now,
					graph: new util.graph()
				};
			} else {
				pairData[pair].lastTick = now;
			}
			pairData[pair].graph.updateStats(data.dcaLogData[i].profit/100);
		}


	};

	function render() {
		var logs = $('#dtDcaLogs');
		var render = false;
		if( logs.width() != 100 ) {
			render = true;
		}

		if( render ) {
			var logs = $('#dtDcaLogs tbody tr');
			for( var i = 0; i < logs.length; i++ ) {
				var curType = $(logs[i]).children('.market').children('a').html();
				var cur = pairData[curType];
				if( cur !== undefined ) {
					//we can render it!
					cur.graph.setSelector($(logs[i]).children('.profit'));
					cur.graph.drawStats();
				}
			}
		}
	}

	// listen to AJAX requests:

	function addXMLRequestCallback(callback){
	    var oldSend, i;
	    if( XMLHttpRequest.callbacks ) {
	        // we've already overridden send() so just add the callback
	        XMLHttpRequest.callbacks.push( callback );
	    } else {
	        // create a callback queue
	        XMLHttpRequest.callbacks = [callback];
	        // store the native send()
	        oldSend = XMLHttpRequest.prototype.send;
	        // override the native send()
	        XMLHttpRequest.prototype.send = function(){

	            for( i = 0; i < XMLHttpRequest.callbacks.length; i++ ) {
	                XMLHttpRequest.callbacks[i]( this );
	            }
	            // call the native send()
	            oldSend.apply(this, arguments);
	        }
	    }
	}

	addXMLRequestCallback( function( xhr ) {
		xhr.onreadystatechange = function() {
			if( xhr.readyState == 4 && xhr.status == 200 ) {
			    if( xhr.responseURL.indexOf('data') > -1 ) {
			    	var data = JSON.parse( xhr.response );
			    	tick(data);
			    }
			}
		};
	});

	$("body").on('DOMSubtreeModified', "#dvLastUpdatedOn", function() {
		render();
	});
	$(".dca-log").on("click",function(){
		setTimeout(function(){ render(); }, 100 );
	});
})();