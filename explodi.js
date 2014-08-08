session = { lang:'en' };
var app = {
	state: 'init',
	nSelected: 0,
	score:0,
	
	onItemClick: function(item)  {
		if(this.state=='init') {
			eludi.switchToChild('button_reload');
			this.state='running';
		}
		if(this.state!='running') return;
		if (!this.nSelected || !item.flag) { 
			if(this.nSelected) for(var i=0; i<this.sizeY; ++i) for(var j=0; j<this.sizeX; ++j) {  // deselect
				var it = this.itemAt(i,j);
				it.innerHTML='';
				it.flag = 0;
			}
			// select:
			this.nSelected = this.calcConnection(item.row, item.col);
			if (this.nSelected>0) {
				++this.nSelected;
				for(var i=0; i<this.sizeY; i++) for(var j=0; j<this.sizeX; j++) {
					var it = this.itemAt(i,j);
					it.innerHTML= (it.flag > 0) ? ('<p class="noselect">'+this.nSelected+"</p>") : '';
				}
			}
			else item.flag=0;
			return;
		}
		this.score += this.nSelected*(this.nSelected+1);
		document.getElementById("statScore").innerHTML = this.score;
		this.step=0;
		this.state='animating';
		this.explodeStep();
	},
	
	explodeStep: function() {
		var stepMax=240;
		if(!this.step) { // initialization
			for(var i=0; i<this.sizeY; i++) for(var j=0; j<this.sizeX; j++) {
				var it = this.itemAt(i,j);
				it.innerHTML='';
			}
		}
				
		if(this.step<stepMax) {
			var bgColor = 'rgb(255,255,'+(127+Math.floor(128*this.step/stepMax))+')';
			var sz = Math.floor((1+this.step*2/stepMax)*this.sz);
			var sz2 = Math.floor((sz-this.sz)/2);
			for(var i=0; i<this.sizeY; i++) for(var j=0; j<this.sizeX; j++) {
				var it = this.itemAt(i,j);
				if (!it.flag)
					continue;
				it.style.backgroundImage = bgColor;
				this.setOpacity(it, 1.0-this.step/stepMax);
				it.style.left = (j*this.sz-sz2)+"px"
				it.style.top = (i*this.sz-sz2)+"px";			
				it.style.width = it.style.height = sz+"px";	
				this.setBorderRadius(it, sz/2);				
			}
			
			this.step += cfg.animationRes;
			window.setTimeout(function() { app.explodeStep(); }, cfg.animationRes );
			return;
		}
		for(var i=0; i<this.sizeY; i++) for(var j=0; j<this.sizeX; j++) {
			var it = this.itemAt(i,j);
			if (!it.flag) 
				continue;
			it.style.backgroundImage = document.body.style.backgroundColor;
			this.setOpacity(it, 1.0);
			it.flag = 0;
			var sz = this.sz-2;
			it.style.width = it.style.height = sz+"px";
			it.style.left = (j*this.sz)+"px"
			it.style.top = (i*this.sz)+"px";
			this.setBorderRadius(it, sz/2);
		}
		this.step=0;
		this.fallStep();
	},
	
	fallStep: function() {
		var stepMax=80;
		if(!this.step) {
			var wasFall = false;
			for(var i=this.sizeY-1; i>0; i--) for(var j=0; j<this.sizeX; j++) {
				var currItem = this.itemAt(i,j), shiftItem = this.itemAt(i-1,j);
				if ((currItem.flag||currItem.isEmpty()) && !shiftItem.isEmpty() ) {
					shiftItem.flag=1;
					wasFall = true;
				}
			}
			if (!wasFall) 
				return this.shiftStep();
		}
		else if(this.step<stepMax) {
			var offset = Math.floor(this.sz*this.step/stepMax)+'px';
			for(var i=this.sizeY-1; i>0; i--) for(var j=0; j<this.sizeX; j++) {
				var shiftItem = this.itemAt(i-1,j);
				if(shiftItem.flag)
					shiftItem.style.marginTop = offset;
			}
		}
		else {
			for(var i=this.sizeY-1; i>0; i--) for(var j=0; j<this.sizeX; j++) {
				var currItem = this.itemAt(i,j), shiftItem = this.itemAt(i-1,j);
				if (shiftItem.flag) {
					shiftItem.flag=0;
					currItem.style.backgroundImage = shiftItem.style.backgroundImage;
					shiftItem.style.backgroundImage = document.body.style.backgroundColor;
					shiftItem.style.marginTop=0;
				}
			}
			this.step=0;
			return this.fallStep();
		}
		this.step += cfg.animationRes;
		window.setTimeout(function() { app.fallStep(); }, cfg.animationRes);
	},

	shiftStep: function() {
		var stepMax=80;
		if(!this.step) {
			var wasShift = false;
			for(var j=0; j<this.sizeX-1;j++) {
				if (wasShift || ((this.itemAt(this.sizeY-1, j).isEmpty()) && !this.itemAt(this.sizeY-1, j+1).isEmpty())) {
					wasShift = true;
					for(var i=0; i<this.sizeY;i++)
						this.itemAt(i,j+1).flag=1;
				}
			}
			if (!wasShift) 
				return this.checkState();
		}
		else if(this.step<stepMax) {
			var offset = (-1*Math.floor(this.sz*this.step/stepMax))+'px';
			for(var i=0; i<this.sizeY; ++i) for(var j=0; j<this.sizeX; ++j) {
				var shiftItem = this.itemAt(i,j);
				if(shiftItem.flag)
					shiftItem.style.marginLeft = offset;
			}
		}
		else {
			for(var j=0; j<this.sizeX-1;j++) {
				for(var i=0; i<this.sizeY;i++) {
					var currItem = this.itemAt(i,j), shiftItem = this.itemAt(i,j+1);
					if(shiftItem.flag) {
						shiftItem.flag=0;
						currItem.style.backgroundImage = shiftItem.style.backgroundImage;
						shiftItem.style.backgroundImage = document.body.style.backgroundColor;
						shiftItem.style.marginLeft=0;
					}
				}
			}
			this.step=0;
			return this.shiftStep();
		}		
		this.step += cfg.animationRes;		
		window.setTimeout(function() { app.shiftStep() }, cfg.animationRes);
	},

	itemAt: function (row, col) {
		return document.getElementById("item_"+row+"_"+col);
	},	
	isFlagged: function(row, col) {
		return this.itemAt(row,col).flag==1;
	},
	calcConnection: function(row, col) {
		var item = this.itemAt(row,col);
		if (item.isEmpty()) return 0;
		item.flag = 1;
		var score = 0;
		if ((col<this.sizeX-1)&&item.isSameColor(this.itemAt(row, col+1)) && !this.isFlagged(row, col+1)) 
			score+=1+this.calcConnection(row, col+1);
		if ((col>0)&&item.isSameColor(this.itemAt(row, col-1)) && !this.isFlagged(row, col-1)) 
			score+=1+this.calcConnection(row, col-1);
		if ((row<this.sizeY-1)&&item.isSameColor(this.itemAt(row+1, col)) && !this.isFlagged(row+1, col)) 
			score+=1+this.calcConnection(row+1, col );
		if ((row>0)&&item.isSameColor(this.itemAt(row-1, col)) && !this.isFlagged(row-1, col)) 
			score+=1+this.calcConnection(row-1, col);
		return score;
	},
	checkState: function() {
		if(this.state!='running' && this.state!='animating') 
			return this.state;
		this.state='running';
		var nItems=0;
		for(var i=0; i<this.sizeY; ++i) for(var j=0; j<this.sizeX; ++j) {
			var item = this.itemAt(i,j);
			if(item.isEmpty()) continue;
			++nItems;
			if((i+1<this.sizeY)&&item.isSameColor(this.itemAt(i+1,j))) 
				return this.state;
			if((j+1<this.sizeX)&&item.isSameColor(this.itemAt(i,j+1))) 
				return this.state;
		}
		
		this.state = 'over';
		if(!nItems)
			this.score += 1000;			
		document.getElementById("statScore").innerHTML = this.score;
		document.getElementById("finalScore").innerHTML = this.score;			
		document.getElementById("bestScore").innerHTML = this.score;
		eludi.scores.requestMin(cfg.name, 'thisMonth', cfg.gameMode, this.scenario, function(score) { app.scoreCheckReceive(score); }, cfg.netTimeout);
		return this.state;
	},
	
	setOpacity: function( elem, value ) {
		elem.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity="+Math.floor(value*100)+")";
		elem.style.opacity = value;
	},
	setBorderRadius: function( elem, value ) {
		value = Math.floor(0);
		elem.style.MozBorderRadius = value+'px';
		elem.style.WebkitBorderRadius = value+'px';
		elem.style.borderRadius = value+'px';
	},
//------------------------------------------------------------------	
	switchTo: function(screenNew, params) {
		if(screenNew=='scores') {
			if(this.screen!=screenNew)
				this.scorePeriod = 'thisMonth';
			else
				this.scorePeriod = this.scorePeriod ? null : 'thisMonth';
			eludi.scores.requestDisplay(cfg.name, this.scorePeriod, cfg.gameMode, this.scenario);
			eludi.switchToChild('button_back');
			eludi.switchToChild('controls_back');
		}
		else if(screenNew=='help') {
			eludi.switchToChild('button_back');		
			eludi.switchToChild('controls_back');
		}
		else if(screenNew=='game') {
			eludi.switchToChild('controls_game');
		}
		
		this.screen = screenNew;
		eludi.switchToChild('screen_'+this.screen);
		if(screenNew=='game')
			document.getElementById("overlay").style.display = '';
	},
	scoreCheckReceive: function(value) {
		if(value===false || this.score<=value) 
			this.switchTo('over');
		else {
			document.getElementById('bestScore').innerHTML = this.score;
			if(window.location.protocol!='file:' && sessionStorage && sessionStorage.name!==undefined)
				document.getElementById('inputName').value = sessionStorage.name;
			this.switchTo('scoreSubmit');
		}
	},
	scoreSubmit: function(doSubmit) {
		document.getElementById("screen_scoreSubmit").style.display='none';
		if(!doSubmit) return this.switchTo('scores');
		var name = document.getElementById("inputName").value;
		if(!name.length) return;
		eludi.scores.submit(cfg.name, cfg.version, this.score, name, session.id, session.ip, cfg.gameMode, this.scenario);
		setTimeout(function() { app.switchTo('scores'); }, 1500 );
	},
	
	layout: function() {
		// determine optimal dimensions:
		this.sz = Math.min(Math.floor(layout.center_width/this.sizeX), Math.floor(layout.center_height/this.sizeY));
		var actualWidth = this.sz*this.sizeX, actualHeight = this.sz*this.sizeY;
		
		// adapt elements:
		var screenGame = document.getElementById("screen_game");
		screenGame.style.marginLeft = Math.floor((layout.center_width-actualWidth)/2)+'px';
		screenGame.style.marginTop = Math.floor((layout.center_height-actualHeight)/2)+'px';
		screenGame.style.width = actualWidth+'px';
		screenGame.style.height = actualHeight+'px';
		this.setBorderRadius(screenGame, this.sz/2);
		
		document.getElementById('screen_over').style.marginLeft 
			= document.getElementById('screen_scoreSubmit').style.marginLeft 
			= Math.floor((window.innerWidth-layout.reserved.overlay.width)/2)+'px';
		document.getElementById('screen_over').style.marginTop 
			= document.getElementById('screen_scoreSubmit').style.marginTop 
			= Math.floor((window.innerHeight-layout.reserved.overlay.height)/2)+'px';
		
		for(var i=0; i<this.sizeY; ++i) for(var j=0; j<this.sizeX; ++j) {
			var item = document.getElementById('item_'+i+"_"+j);
			item.style.width = item.style.height = (this.sz-2)+'px';
			item.style.left = (j*this.sz)+"px"
			item.style.top = (i*this.sz)+"px";
			item.style.fontSize = Math.floor(0.6*this.sz)+'px';
			this.setBorderRadius(item, this.sz/2-1);
		}
	},
	
	init: function() {	
		this.sizeX = cfg.nCols;
		this.sizeY = cfg.nRows;
		this.scenario='square_'+cfg.nCols+'_'+cfg.nRows;
		if(session.platform=='iOS' && !navigator.standalone && window.innerHeight<460) {
			this.sizeX += 1;
			this.sizeY -= 1;
		}
		
		var parent = document.getElementById("screen_game");
		for(var i=0; i<this.sizeY; ++i) for(var j=0; j<this.sizeX; ++j) {
			//color = Math.floor((Math.random()*cfg.colors.length));
			color = Math.floor((Math.random()*4))+1; // 0,1
			var item = document.createElement('div');
			item.setAttribute('id', 'item_'+i+"_"+j);
			item.className = 'noselect';
			//item.style.background = cfg.colors[color];
			var icono = "icon" + color.toString() + ".png";
			//alert(icono);
			item.style.backgroundImage = "url('" + icono + "')";
			item.style.backgroundSize = "contain";
			item.row = i;
			item.col = j;
			item.onclick = function(event) { app.onItemClick(this); event.preventDefault(); return true; };
			//item.isEmpty = function() { return this.style.backgroundColor == document.body.style.backgroundColor; }
			item.isEmpty = function() { return this.style.backgroundImage == document.body.style.backgroundColor; }
			//item.isSameColor = function(item) { if(!item) return false; return this.style.backgroundColor == item.style.backgroundColor; }
			item.isSameColor = function(item) { if(!item) return false; return this.style.backgroundImage == item.style.backgroundImage; }
			parent.appendChild(item);
		}
		if(session.input=='touch') {
			document.ontouchmove = function(event){ event.preventDefault(); } // prevent elastic scrolling
			eludi.click2touch();
		}
	}
};
