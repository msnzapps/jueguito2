// common eludi functions
// (c) 2010-2013 by Gerald Franz, all rights reserved

/// String trim extensions, removes leading and/or tailing whitespace
String.prototype.ltrim = function (clist) { return this.replace (clist ? (new RegExp ('^[' + clist + ']+')) : /^\s+/, ''); }
String.prototype.rtrim = function (clist) { return this.replace (clist ? (new RegExp ('[' + clist + ']+$')) : /\s+$/, ''); }
String.prototype.trim = function(clist) { return this.ltrim(clist).rtrim(clist); }

/// String reverse extension
String.prototype.reverse=function(){return this.split("").reverse().join("");}
/// encodes reserved characters and umlauts to html entities
String.prototype.htmlStr = function(){
	var from = [ /&/g,/</g,/>/g,/"/g, /Ö/g, /ö/g, /Ä/g, /ä/g, /Ü/g, /ü/g, /ß/g];
	var to = ["&amp;", "&lt;", "&gt;", "&quot;", "&Ouml;", "&ouml;", "&Auml;", "&auml;", "&Uuml;", "&uuml;", "&szlig;" ];
	var string = this;
	for (var i=0; i<from.length; ++i) string = string.replace(from[i], to[i]);
	return string;
}
/// encodes html entities to unicode
String.prototype.html2unicode = function(){
	var from = [ /&apos;/g, /&quote;/g, /&Ouml;/g, /&ouml;/g, /&Auml;/g, /&auml;/g, /&Uuml;/g, /&uuml;/g, /&szlig;/g];
	var to = [ "'", '"', "\u00d6", "\u00f6", "\u00c4", "\u00e4", "\u00dc", "\u00fc", "\u00df" ];
	var string = this;
	for (var i=0; i<from.length; ++i) string = string.replace(from[i], to[i]);
	return string;
}
/// string formatting
String.prototype.format = function() {
	var s = this;
	for (var i = 0; i < arguments.length; ++i) {
		var regexp = new RegExp('\\{'+i+'\\}', 'gi');
		s = s.replace(regexp, arguments[i]);
	}
	return s;
}

/// clear array
Array.prototype.clear=function() { this.length = 0; }
/// Array remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
}
/// swaps element i and j of array
Array.prototype.swap = function(i, j) {
	var tmp = this[i];
	this[i] = this[j]
	this[j] = tmp;
}
if(!Array.isArray) Array.isArray = function (arg) { // isArray
	return Object.prototype.toString.call(arg) === "[object Array]";
}

if(!('$' in window))
	$ = function(arg) { return document.querySelector(arg); }
/// implementation of document.getElementsByClassName, if missing
if(!document.getElementsByClassName) document.getElementsByClassName = function(className) {
	var ret=[];
	var all_obj = document.all ? document.all : document.getElementsByTagName("*");
	for(var i=0; i<all_obj.length; ++i)
		if(all_obj[i].className.indexOf(className)!=-1)
			if((","+all_obj[i].className.split(" ").join(",")+",").indexOf(","+className+",")!=-1)
				ret.push(all_obj[i]);
	return ret;
}

if(!window.requestAnimationFrame) window.requestAnimationFrame = (function(callback) {
	return window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame || 
	window.oRequestAnimationFrame || 
	window.msRequestAnimationFrame ||
	function(callback) { window.setTimeout(callback, 1000 / 60); };
})();

/// namespace for shared functionality
eludi = {
	/// generates a random sequence of length n, 0..n-1
	randomSequence: function(n) {
		var seq = [ ];
		for(var i=0; i<n; ++i) seq.push(i);
		for(var i=n-1; i>0; --i) seq.swap(i, Math.floor(Math.random()*(i+1)));
		return seq;
	},
//--- DOM utilities ---
	/// permutes child nodes sequence
	permutateChildren: function(parentId) {
		var parent = document.getElementById(parentId);
		var n = parent.children.length;
		for(var i=n-1; i>0; --i) {
			var j = Math.floor(Math.random()*(i+1));
			if(i==j) continue;
			var child1 = parent.removeChild(parent.children[i]);
			var child2 = parent.removeChild(parent.children[j]);
			parent.appendChild(child2);
			parent.insertBefore(child1, parent.children[j]);
		}
	},
	/// switches a single child on, and all other children of its parent off
	switchToChild: function(childId, display) {
		var refChild = document.getElementById(childId);
		if(!refChild) return false;
		if(display===undefined)
			display="block";
		var parent= refChild.parentNode;
		for(var i = 0; i < parent.childNodes.length; ++i) {
			var child = parent.childNodes[i];
			if(child.nodeType!=1) continue;
			child.style.display = (child===refChild) ? display : "none";
		}
		return true;
	},
	/// localization of HTML document
	localizeDocument: function(dict) {
		var elements = document.getElementsByClassName('l10n');
		for(var i=0; i<elements.length; ++i) {
			var key = elements[i].innerHTML;
			if(key in dict) elements[i].innerHTML = dict[key];
		}
	},
	click2touch: function(element) {
		var evt='onclick';
		if(window.navigator.msPointerEnabled)
			evt = 'onmspointerdown'; // WinRT / 8
		else if(session.input=='touch')
			evt = 'ontouchstart';
		else return evt;
		var elems = element ? [ element ] : document.getElementsByTagName('*');
		for(var i=0; i<elems.length; ++i) {
			var elem = elems[i];
			if(elem.onclick && !elem[evt]) {
				elem.callback = elem.onclick;
				elem[evt]=function(e) { e.preventDefault(); return this.callback(e); }
				elem.onclick=null;
			}
		}
		return evt;
	},
	addPointerEventListener: function(target, callback) {
		var cb = function(e) {
			var events = eludi.normalizeEvents(e);
			for(var i=0; i<events.length; ++i)
				callback(events[i]);
			return true;
		}
		if (typeof target.style.msTouchAction != 'undefined') {
			target.style.msTouchAction = 'none';
			target.onmspointerdown = target.onmspointermove = target.onmspointerup = target.onmspointerout
				= function(event) { return cb(event); };
		}
		else {
			target.onmousedown = target.onmousemove = target.onmouseup = target.onmouseout
				= function(event) { return cb(event); };
			target.ontouchstart = function(event) { this.onmousedown=null; return cb(event); };
			target.ontouchend = function(event) { this.onmouseup=null; return cb(event); };
			target.ontouchmove = function(event) { this.onmousemove=null; return cb(event); };
		}
	},
	normalizeEvents: function(e) {
		if(this.normalizeEvents.preventDefault ===undefined)
			this.normalizeEvents.preventDefault = true;
		if(!e) e = window.event;
		if (e.preventManipulation)
			e.preventManipulation();
		if (e.preventDefault && this.normalizeEvents.preventDefault)
			e.preventDefault();

		var events = [];
		if(e.type in { 'touchstart':true, 'touchmove':true, 'touchend':true }) {
			var node = e.target;
			var offsetX = 0, offsetY=0;
			while(node && (typeof node.offsetLeft != 'undefined')) {
				offsetX += node.offsetLeft;
				offsetY += node.offsetTop;
				node = node.offsetParent;
			}
			for(var i=0; i<e.changedTouches.length; ++i) {
				var touch = e.changedTouches[i];
				events.push({ type:e.type.substr(5), id:touch.identifier, 
					pageX:touch.pageX, pageY:touch.pageY, 
					clientX:touch.clientX,clientY:touch.clientY, 
					x: touch.clientX - offsetX, y: touch.clientY - offsetY });
			}
		}
		else if(e.type.substr(0,2)=='MS') { // Microsoft Pointer events
			if(e.pointerId!=1) 
				return false; // currently no multitouch support
			var type = null;
			if(e.type=='MSPointerDown') {
				type = 'start';
				this.normalizeEvents.pointerdown = true;
			}
			else if(e.type in {'MSPointerUp':true, 'MSPointerOut':true}) {
				if(this.normalizeEvents.pointerdown)
					type = 'end';
				this.normalizeEvents.pointerdown = false;
			}
			else if(e.type=='MSPointerMove')
				type = this.normalizeEvents.pointerdown ? 'move' : 'hover';
			if(type) events.push({ type:type, target:e.target, id:e.pointerId, 
				pageX:e.pageX, pageY:e.pageY, 
				clientX:e.clientX,clientY:e.clientY, 
				x:e.offsetX,y:e.offsetY });
		}
		else { // mouse events:
			if(e.offsetX===undefined) {
				e.offsetX = e.pageX - e.target.offsetLeft;
				e.offsetY = e.pageY - e.target.offsetTop;
			}
			if(e.pageX===undefined) {
				e.pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				e.pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			var type = null;
			if(e.type=='mousedown') {
				type = 'start';
				this.normalizeEvents.pointerdown = true;
			}
			else if(e.type in {'mouseup':true, 'mouseout':true}) {
				if(this.normalizeEvents.pointerdown)
					type = 'end';
				this.normalizeEvents.pointerdown = false;
			}
			else if(e.type=='mousemove')
				type = this.normalizeEvents.pointerdown ? 'move' : 'hover';
			
			if(type) events.push({ type:type, target:e.target, id:e.button, 
				pageX:e.pageX, pageY:e.pageY, 
				clientX:e.clientX,clientY:e.clientY, 
				x:e.offsetX,y:e.offsetY });
		}
		return events.length ? events : false;
	},
	windowMetrics: function() {
		var metrics = { innerWidth:window.innerWidth, innerHeight:window.innerHeight,
		outerWidth:window.outerWidth, outerHeight:window.outerHeight,
		screenWidth:screen.width, screenHeight:screen.height, 
		availWidth:screen.availWidth, availHeight:screen.availHeight,
		orientation:(window.orientation||0) };

		if( !navigator.standalone && (navigator.userAgent.indexOf("iPhone") != -1 || navigator.userAgent.indexOf("iPod") != -1))
			metrics.innerHeight = screen.availHeight - 44;
		else if(navigator.userAgent.indexOf('Android') != -1) // probably Android default browser only
			metrics.innerHeight = Math.floor(metrics.innerWidth*metrics.outerHeight/metrics.outerWidth);
		return metrics;
	},
	genXlinks: function(parentId, exclude, numXlinks) {
		var basePath = '../';
		var titles = [ 'jewelcase', 'explodi', 'memoludi', 'return', 'louloudia', 'fortaleza', 'tictactoe', 'eluqiz', 'caramboli' ];
		var dirs = [ 'jewelcase', 'explodi', 'memoludi', 'pong', 'louloudia', 'fortaleza', 'tictactoe', 'eluqiz', 'caramboli' ];
		if(exclude) for(var i=0; i<titles.length; ++i) if(titles[i]==exclude) {
			titles.remove(i);
			dirs.remove(i);
			break;
		}
		var parent = document.getElementById(parentId);
		for(var i=0; i<numXlinks; ++i) {
			var id = Math.floor(Math.random()*titles.length);
			parent.innerHTML += '<a href="'+basePath+dirs[id]+'">'+titles[id]+'</a>';
			titles.remove(id);
			dirs.remove(id);
		}
	},

//--- communication helpers ---
	/// returns URL parameters as map
	paramsRequest: function() {
		var map = (typeof params === 'undefined') ? {} : params;
		if(window.location.protocol!='file:' && sessionStorage && sessionStorage['eludi_paramsRequest']) {
			var storedParams = JSON.parse(sessionStorage['eludi_paramsRequest']);
			for(var key in storedParams)
				map[key] = storedParams[key];
			delete sessionStorage['eludi_paramsRequest'];
		}
		if(window.location.href.indexOf('?')>=0)
			window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				var v = decodeURIComponent(value);
				map[key] = (v.charAt(0) in { '[':true, '{':true }) ? JSON.parse(v) : v; 
			});
		return map;
	},
	/// dynamically loads a javascript file from a url
	loadjs: function (url, callback) {
		var node=document.createElement('script');
		node.setAttribute("type","text/javascript");
		node.setAttribute("src", url);
		if(callback) {
			if (node.addEventListener)
				node.addEventListener("load", callback, false);
			else node.onreadystatechange = function() {
				if (this.readyState == "complete") callback(this);
			}
		}
		document.getElementsByTagName("head")[0].appendChild(node);
	},
	encodeURI: function(obj) {
		var s = '';
		for(var key in obj) {
			if(s.length) s += '&';
			var value = obj[key];
			if(typeof value == 'object')
				value = JSON.stringify(value);
			s += key+'='+encodeURIComponent(value);
		}
		return s;
	},
	/// executes an asynchronous XMLHttpRequest request
	httpRequest: function(url, params, callback, method) {
		if(method=='JSONP')
			return this.jsonpRequest(url, params, callback);

		var paramStr = this.encodeURI(params);
		if((method!='POST') && params)
			url+='?'+paramStr;

		var xhr = new XMLHttpRequest();
		try {
			xhr.open( method, url, true );
		} catch(error) {
			try {
				xhr = new XDomainRequest(); // IE<10 specific
				if(callback) {
					xhr.onload = function() {
						var response = (xhr.contentType=='application/json') ? JSON.parse(xhr.responseText) : xhr.responseText;
						var status = response.status ? response.status : 200;
						callback( response, status );
					}
					xhr.onerror = function() { callback( 'xdr error', -1); }
				}
				else xhr.onload = xhr.onerror = function() {} // dummies, see http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/30ef3add-767c-4436-b8a9-f1ca19b4812e
				xhr.onprogress = xhr.ontimeout = function() {}

				if(params) {
					if(method=='POST')
						url+='?'+paramStr;
					url+='&alt=json';
				}
				else url += '?alt=json';

				xhr.open('GET', url);
				xhr.send(null);
				return xhr;
			} catch(error) { return false; }
		}
		try {
			if((method=='POST') && params)
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			if(callback) xhr.onload = xhr.onerror = function(event) {
				var response = (xhr.responseXML && xhr.responseXML.documentElement)
					? xhr.responseXML : (xhr.contentType=='application/json' || (('getResponseHeader' in xhr) && xhr.getResponseHeader('Content-Type')=='application/json'))
					? JSON.parse(xhr.responseText) : xhr.responseText;
				var status = (xhr.status===undefined) ? -1 : xhr.status;
				if(status == 1223) status = 204; // IE bug
				callback( response, status );
			}
			xhr.send( ((method=='POST') && params) ? paramStr : null );
		} catch(error) { return false; }
		return xhr;
	},
	/// executes an asynchronous JSON-P request
	jsonpRequest: function(url, params, callback) {
		var nocache = Math.random().toString().substr(2);
		if(callback) {
			nocache = '_cb'+nocache;
			window[nocache] = function(resp) {
				callback(resp, (!resp ? 204 : resp.status ? resp.status : 200));
				delete window[nocache];
			}
			url+='?callback=' + nocache;
		}
		else url+= '?nocache='+nocache;
		if(params) 
			url+='&'+this.encodeURI(params);
		var script = document.createElement('script');
		script.setAttribute('src', url);
		script.setAttribute('type', 'text/javascript');
		var cleanup = function() { script.parentNode.removeChild(script); };
		if(script.addEventListener)
			script.addEventListener("load", cleanup, false);
		else script.onload = cleanup;
		document.getElementsByTagName('head')[0].appendChild(script);
		return true;
	},
	/// opens another (eludi) url and passes parameters preferably via sessionStorage
	openUrl: function(url, params, replace) {
		if(params) {
			if(window.location.protocol!='file:' && sessionStorage)
				sessionStorage['eludi_paramsRequest']=JSON.stringify(params);
			else url += '?' + this.encodeURI(params);
		}
		if(replace)
			window.location.replace(url);
		else window.location.href=url;
	},
	
	/// executes a structured query on a Google spreadsheet
	spreadsheetQuery: function(spreadsheetKey, worksheetKey, callback, params) {
		var filter = '';
		for(var key in params)
			filter+= '&'+key+'='+((key=='sq')?encodeURIComponent(params[key]):params[key]);
		var scriptId = spreadsheetKey+worksheetKey;
		var script = document.getElementById(scriptId);
		if (script) script.parentNode.removeChild(script);
		script = document.createElement('script');
		script.setAttribute('src', 'http://spreadsheets.google.com/feeds/list'
			+ '/' + spreadsheetKey + '/' + worksheetKey + '/public/values' 
			+ '?alt=json-in-script&callback='+callback + filter );
		script.setAttribute('id', scriptId);
		script.setAttribute('type', 'text/javascript');
		document.getElementsByTagName('body')[0].appendChild(script);
	},

//--- shared specific functionality ---
	popupToggle: function (popupName) {
		var menu=document.getElementById(popupName);
		var show = (menu.style.display=='none');
		menu.style.display= show ? 'block':'none';
		var button = document.getElementById('button_'+popupName);
		if(button) button.className = show ? 'emenuButtonSelected' : 'emenuButton';
	},
	sessionRequest: function(callback, timeout, params) {
		if(typeof session==='undefined')
			session = { lang:'en' };
		// detect presentation, input, platform:
		session.presentation = (screen.width<=800) ? 'mobile' : 'desktop';
		session.input = (('ontouchstart' in window) || ('onmsgesturechange' in window)) ? 'touch' : 'mouseKbd';
		var browserId = navigator.userAgent;
		if(browserId.indexOf('AppleWebKit')!=-1) {
			session.platform = 'webkit';
			if(browserId.indexOf('Android') != -1)
				session.platform = 'Android';
			else if(browserId.indexOf("iPhone") != -1 || browserId.indexOf("iPod") != -1 || browserId.indexOf("iPad") != -1)
				session.platform = 'iOS';
			//if(browserId.indexOf("Mobile") != -1) session.presentation = 'mobile';
		}
		else if(browserId.indexOf('Presto')!=-1) {
			session.platform = 'Opera';
			//if((browserId.indexOf('Opera Mobi/') != -1)||(browserId.indexOf('Opera Mini/') != -1)||(browserId.indexOf('Opera Tablet/') != -1)) session.presentation = 'mobile';
		}
		else if(browserId.indexOf('Trident')!=-1) {
			session.platform = 'MSIE';
			//if(browserId.indexOf('Windows Phone') != -1) session.presentation = 'mobile';
		}
		else if(browserId.indexOf('Gecko/') != -1) {
			session.platform = 'Gecko';
			//if((browserId.indexOf('Mobile;') != -1)||(browserId.indexOf('Tablet;') != -1)) session.presentation = 'mobile';
		}

		if(callback)
			eludi.sessionReceive.callback = callback;
		if((!params && window.location.protocol!='file:' && sessionStorage && sessionStorage.session)
			|| (('onLine' in navigator) && !navigator.onLine))
			eludi.sessionReceive(sessionStorage.session ? JSON.parse(sessionStorage.session) : null);
		else {
			if(timeout)
				eludi.sessionRequest.timeout = window.setTimeout(eludi.sessionReceive, timeout);
			eludi.jsonpRequest('http://eludi.net/services/session.php', params, eludi.sessionReceive);
		}
		return session;
	},
	sessionReceive: function(json) {
		var timeout = true;
		if(json) {
			clearTimeout(eludi.sessionRequest.timeout);
			for(var key in json)
				session[key]=json[key]; 
			timeout = false;
			if(localStorage)
				localStorage.lang = session.lang;
		}
		else if(localStorage && localStorage.lang)
			session.lang = localStorage.lang;
		
		if(window.location.protocol!='file:' && sessionStorage)
			sessionStorage.session=JSON.stringify(session);
		delete eludi.sessionRequest.timeout;
		if(typeof l10n!='undefined') {
			if(session.lang && (session.lang!='en'))
				eludi.loadjs('l10n.'+session.lang+'.js');
			else eludi.localizeDocument(l10n);
		}
		if(eludi.sessionReceive.callback) {
			eludi.sessionReceive.callback(timeout);
			delete eludi.sessionReceive.callback;
		}
	},
	scores: {
		service: "http://eludi.net/services/scores.php",
		submit: function(app, version, score, name, sid, ip, mode, scenario, league) {
			params = { action:'insert', app:app, version:version, score:score, name:name };
			if(mode) params.mode = mode;
			if(scenario) params.scenario = scenario;
			if(league) params.scenario = league;
			eludi.httpRequest(this.service, params, null, 'POST');
		},
		period2yearmonth: function(period) {
			if (period=='allTime') return null;
			if (period=='thisMonth') { 
				var date = new Date();
				var month = date.getMonth()+1;
				return { year:date.getFullYear(), month:month };
			}
			return period;
		},
		request: function(callback, app, period, mode, scenario, limit) {
			var filter = "app = '"+ app+"'";
			if(mode)
				filter+= " AND mode ='"+mode+"'";
			if(scenario)
				filter+= " AND scenario ='"+scenario+"'";

			period=this.period2yearmonth(period);
			if(period && period.month && period.year) {
				var month = String(period.month);
				if(month.length<2)
					month = '0'+month;
				if(filter.length)
					filter+=' AND '
				filter += 'date>='+Number(String(period.year)+month+'01') 
					+ ' AND date<='+Number(String(period.year)+month+'31');
			}
			var params = { filter:filter };
			if(limit)
				params.limit = limit;
			eludi.httpRequest(this.service, params, callback, 'GET');
		},
		display: function(json) {
			if(this.request.timeout) {
				clearTimeout(this.request.timeout);
				this.request.timeout = null;
			}
			var tbody = document.getElementById('tableHighscores').lastChild;
			while(tbody.childNodes.length>1)
				tbody.removeChild(tbody.lastChild);

			if(json) for (var i = 0; i < json.length; ++i) {
				var data = json[i];
				var tr = document.createElement('tr');
				tr.appendChild(document.createElement('td'));
				tr.childNodes[tr.childNodes.length-1].innerHTML=(i+1);
				tr.appendChild(document.createElement('td'));
				tr.childNodes[tr.childNodes.length-1].innerHTML=data.score;
				tr.appendChild(document.createElement('td'));
				tr.childNodes[tr.childNodes.length-1].innerHTML=data.name.htmlStr().substr(0,16);
				tr.appendChild(document.createElement('td'));
				tr.childNodes[tr.childNodes.length-1].innerHTML= data.date.substr(0,4)+'-'+data.date.substr(4,2)+'-'+data.date.substr(6);
				tbody.appendChild(tr);
			}
			if(this.display.callback)
				this.display.callback();
		},
		updateMin: function(json) {
			if(this.request.timeout) {
				clearTimeout(this.request.timeout);
				this.request.timeout = null;
			}
			if(!json)
				this.min = false;
			else {
				var nEntriesMax=10;
				this.min = (json.length<nEntriesMax) ? 
					0 : Number(json[json.length-1].score);
			}
			if(this.updateMin.callback)
				this.updateMin.callback(this.min);
		},
		requestMin: function(game, period, mode, scenario, callback, timeout) {
			this.request(function(json) { eludi.scores.updateMin(json); }, game, period, mode, scenario, 10);
			this.updateMin.callback = callback;
			this.request.timeout = timeout ? setTimeout(function() { eludi.scores.updateMin(false); }, timeout) : null;
		},
		requestDisplay: function(game, period, mode, scenario, title, callback, timeout) {
			var screen_scores_title;
			period=this.period2yearmonth(period);
			if(period && period.month && period.year)
				screen_scores_title = l10n.highscores+' '+l10n.months[period.month-1]+' '+period.year;
			else screen_scores_title = l10n.allTimeBest;
			if(mode && l10n[mode])
				screen_scores_title += ' '+l10n[mode];
			if(title)
				screen_scores_title += ', "'+title+'"';
			this.request(function(json) {eludi.scores.display(json); if(callback) callback(json); }, game, period, mode, scenario, 10);
			this.display.callback = function() {
				if(document.getElementById('screen_scores_title'))
					document.getElementById('screen_scores_title').innerHTML = screen_scores_title;
				eludi.switchToChild('screen_scores');
				eludi.switchToChild('controls_scores');
			}
			this.request.timeout = (timeout&&callback) ? setTimeout(function() { callback(false); }, timeout) : null;
		},
		min:0
	}
}
