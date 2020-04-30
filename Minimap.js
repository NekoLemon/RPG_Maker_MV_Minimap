//Minimap.js
/*:
*  @plugindesc 小地图插件
*  @author CatLemon
*  @param ShowMinimap
*  @type boolean
*  @desc 显示小地图
*  @default true
*  @param Width
*  @type number
*  @desc 宽度
*  @default 200
*  @min 0
*  @param Height
*  @type number
*  @desc 高度
*  @default 200
*  @min 0
*  @param UseCustomEdge
*  @type boolean
*  @desc 使用自定义边框
*  @default false
*  @param EdgeColor
*  @type string
*  @desc 默认边框基色
*  @default #DEFF00
*  @param CustomEdgeUri
*  @type string
*  @desc 自定义边框图片位置
*  @default null
*  @param CustomEdgeOffsetX
*  @type number
*  @desc 自定义边框横向偏移
*  @default 0
*  @param CustomEdgeOffsetY
*  @type number
*  @desc 自定义边框纵向偏移
*  @default 0
*/
(function(){
	
	let bitmap=new Bitmap();
	let tilemap;
	let tileColor,tileColors;
	
	let SCALE=4;
	
	let parameters=PluginManager.parameters('Minimap');
	
	function GetMap(){
		let map=new Array();
		let width=$dataMap.width;
		let height=$dataMap.height;
		for(var i=0;i<width;i++){
			map[i]=new Array();
			for(var j=0;j<height;j++){				
				map[i][j]=$gameMap.terrainTag(i,j);
				if($gameMap.isPassable(i,j)){
					map[i][j]|=0x10;
				};
				if($gameMap.isShipPassable(i,j)){
					map[i][j]|=0x20;
				};
			};
		};
		return map;
	};
	
	let _Scene_Map_onMapLoaded=Scene_Map.prototype.onMapLoaded;
	Scene_Map.prototype.onMapLoaded=function(){
		_Scene_Map_onMapLoaded.call(this);
		setTimeout(function(){Refresh();RefreshPlayer(2);},100);		
	};
	
	function rgb2hex(color){
		return "#" + ((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).substring(1);
	};
	
	function GetBorderColors(baseColor){
		function Brighter(color,lighter){
			return [Math.round(color[0]+(255-color[0])*lighter),Math.round(color[1]+(255-color[1])*lighter),Math.round(color[2]+(255-color[2])*lighter)];
		};
		function Darker(color,blacker){
			return [Math.round(color[0]*(1-blacker)),Math.round(color[1]*(1-blacker)),Math.round(color[2]*(1-blacker))];
		};
		color=[Number('0x'+baseColor.slice(1,3)),Number('0x'+baseColor.slice(3,5)),Number('0x'+baseColor.slice(5,7))];
		colors=[Brighter(color,0.75),Brighter(color,0.1),Darker(color,0.1),Darker(color,0.5)];
		return colors.map(rgb2hex);
	};
	
	function Refresh(){		
		DeleteMinimap();
		if(parameters['ShowMinimap']==false){
			return;
		};
		CreateMinimap();
	};
	
	function DeleteMinimap(){
		let minimap=document.getElementById('Minimap');
		if(minimap!=undefined){
			minimap.remove();
		};
	};
	
	function CreateMinimap(){
		minimap_colors=GetBorderColors(parameters['EdgeColor']);
		let minimap=document.createElement('div');
		minimap.id='Minimap';
		minimap.style='position:fixed;z-index:100;right:0;top:0;background:linear-gradient(to bottom right,'+minimap_colors[0]+','+minimap_colors[1]+' 40%,'+minimap_colors[2]+' 60%,'+minimap_colors[3]+');';
		wrapper=CreateWrapper();
		minimap.appendChild(wrapper);
		canvas=CreateCanvas();
		wrapper.appendChild(canvas);
		document.body.appendChild(minimap);
		DrawMap(canvas);
		player=CreatePlayer();
		wrapper.appendChild(player);
	};
	
	function CreateWrapper(){
		wrapper=document.createElement('div');
		wrapper.id='Minimap_Wrapper';
		wrapper.style='width:'+parameters["Width"]+'px;height:'+parameters["Height"]+'px;overflow:hidden;background:#000;margin:5px;';		
		return wrapper;
	};
	
	function CreateCanvas(){
		let canvas=document.createElement('canvas');		
		canvas.width=($dataMap.width<parameters["Width"]/SCALE)?parameters["Width"]:$dataMap.width*SCALE;
		canvas.height=($dataMap.height<parameters["Height"]/SCALE)?parameters["Height"]:$dataMap.height*SCALE;
		canvas.style='position:relative;background:#555;';
		return canvas;
	};
	
	function DrawMap(canvas){
		CreateTilemap();
		CreateBitmap();
		let dx=($dataMap.width<parameters["Width"]/SCALE)?parameters["Width"]/2-$dataMap.width*SCALE/2:0;
		let dy=($dataMap.height<parameters["Height"]/SCALE)?parameters["Height"]/2-$dataMap.height*SCALE/2:0;
		let ctx=canvas.getContext('2d');
		//let COLORS={'default':'#AAA','forbidden':'#F00'};
		//let MAP=GetMap();
		for(var i=0;i<$dataMap.width;i++){
			for(var j=0;j<$dataMap.height;j++){
				let tiles=$gameMap.layeredTiles(i,j);
				//let color=[0,0,0];
				let colors;
				for(var k in tiles){
					if(tiles[k]){
						//color=GetTileColor(tiles[k]);
						colors=GetTileColors(tiles[k]);
						break;
					};
				};
				/*let color;
				if((MAP[i][j]&0x10)==0x10){
					color=COLORS['default'];
				}else{
					color=COLORS['forbidden'];
				};
				ctx.fillStyle=color;*/
				/*ctx.fillStyle=rgb2hex(color);
				ctx.fillRect(dx+i*SCALE,dy+j*SCALE,SCALE,SCALE);*/
				for(var ii=0;ii<2;ii++){
					for(var jj=0;jj<2;jj++){
						ctx.fillStyle=rgb2hex(colors[2*ii+jj]);
						ctx.fillRect(dx+i*SCALE+ii*SCALE/2,dy+j*SCALE+jj*SCALE/2,SCALE/2,SCALE/2);
					};
				};
			};
		};
		DeleteBitmap();
	};
	
	function CreatePlayer(){
		let player=document.createElementNS('http://www.w3.org/2000/svg','svg');
		player.setAttribute('id','Minimap-player');
		player.setAttribute('width','30');
		player.setAttribute('height','30');
		player.setAttribute('style','position:absolute;')
		player.innerHTML='<path xmlns="http://www.w3.org/2000/svg" stroke="none" id="svg_1" d="M 10.5 16 L 15 25 L 19.5 16 Q 21,10 15,10 Q 9,10 10.5 16 Z" fill-opacity="null" fill="#ffffff"/><ellipse stroke="none" id="svg_2" cx="15" cy="14" fill="#0f93ff" rx="4" ry="3"/>'
		return player;
	};
	
	function CreateBitmap(){
		wrapper=document.getElementById('Minimap_Wrapper');
		let canvas=document.createElement('canvas');
		wrapper.appendChild(canvas);
		canvas.id='TileTest';
		canvas.width=tilemap._tileWidth;
		canvas.height=tilemap._tileHeight;
		canvas.style='display:none;';
		bitmap.__canvas=canvas;
		bitmap.__context=bitmap.__canvas.getContext('2d')
		bitmap._setDirty();
	};
	
	function DeleteBitmap(){
		document.getElementById('TileTest').remove();
	};
	
	function CreateTilemap(){
		tilemap=new Tilemap();
		tilemap.bitmaps=SceneManager._scene._spriteset._tilemap.bitmaps;
		tilemap.animationFrame=0;
		tilemap.flags=SceneManager._scene._spriteset._tilemap.flags;
		tileColor={};
		tileColors={};
	};
	
	function GetTileColor(tileId){
		if(tileId in tileColor){
			return tileColor[tileId];
		};
		tilemap._drawTile(bitmap,tileId,0,0);	
		let data = bitmap.__context.getImageData(0,0,tilemap._tileWidth,tilemap._tileHeight).data;
		let r=0,g=0,b=0;
		for (var row = 0; row < tilemap._tileHeight; row++) {
			for (var col = 0; col < tilemap._tileWidth; col++) {
				r += data[((tilemap._tileWidth * row) + col) * 4];
				g += data[((tilemap._tileWidth * row) + col) * 4 + 1];
				b += data[((tilemap._tileWidth * row) + col) * 4 + 2];
			};
		};
		r/=tilemap._tileWidth*tilemap._tileHeight;
		g/=tilemap._tileWidth*tilemap._tileHeight;
		b/=tilemap._tileWidth*tilemap._tileHeight;
		r=Math.round(r);
		g=Math.round(g);
		b=Math.round(b);
		tileColor[tileId]=[r,g,b];
		return [r,g,b];
	};
	
	function GetTileColors(tileId){
		if(tileId in tileColors){
			return tileColors[tileId];
		};
		tilemap._drawTile(bitmap,tileId,0,0);
		let colors=[];
		for(var i=0;i<2;i++){
			for(var j=0;j<2;j++){
				let data = bitmap.__context.getImageData(tilemap._tileWidth*i/2,tilemap._tileHeight*j/2,tilemap._tileWidth/2,tilemap._tileHeight/2).data;
				let r=0,g=0,b=0;
				for (var row = 0; row < tilemap._tileHeight/2; row++) {
					for (var col = 0; col < tilemap._tileWidth/2; col++) {
						r += data[((tilemap._tileWidth/2 * row) + col) * 4];
						g += data[((tilemap._tileWidth/2 * row) + col) * 4 + 1];
						b += data[((tilemap._tileWidth/2 * row) + col) * 4 + 2];
					};
				};
				r/=tilemap._tileWidth/2*tilemap._tileHeight/2;
				g/=tilemap._tileWidth/2*tilemap._tileHeight/2;
				b/=tilemap._tileWidth/2*tilemap._tileHeight/2;
				r=Math.round(r);
				g=Math.round(g);
				b=Math.round(b);
				colors.push([r,g,b])
			}
		}
		
		tileColors[tileId]=colors;
		return colors;
	};
	
	function RefreshPlayer(direction=0,update=false){
		let cor_x=$gamePlayer._realX;
		let cor_y=$gamePlayer._realY;
		if(update){
			switch(direction){
				case 2:
				cor_y=(cor_y==$dataMap.height)?cor_y:cor_y+1;
				break;
				case 4:
				cor_x=(cor_x==0)?cor_x:cor_x-1;
				break;
				case 6:
				cor_x=(cor_x==$dataMap.width)?cor_x:cor_x+1;
				break;
				case 8:
				cor_y=(cor_y==0)?cor_y:cor_y-1;
				break;
			};
		};
		let canvas=document.getElementById('Minimap').getElementsByTagName('canvas')[0]
		if($dataMap.width>=parameters["Width"]/SCALE && cor_x*SCALE>=parameters["Width"]/2 && ($dataMap.width-cor_x)*SCALE>=parameters["Width"]/2){
			canvas.style.left='-'+(cor_x*SCALE-parameters["Width"]/2)+'px';
		};
		if($dataMap.height>=parameters["Height"]/SCALE && cor_y*SCALE>=parameters["Height"]/2 && ($dataMap.height-cor_y)*SCALE>=parameters["Height"]/2){
			canvas.style.top='-'+(cor_y*SCALE-parameters["Height"]/2)+'px';
		};
		
		let player=document.getElementById('Minimap-player');
		player.style.transform='scale(0.8) rotate('+({2:0,4:90,8:180,6:-90})[$gamePlayer.direction()]+'deg)';
		if($dataMap.width>=parameters["Width"]/SCALE && cor_x*SCALE>=parameters["Width"]/2 && ($dataMap.width-cor_x)*SCALE>=parameters["Width"]/2){
			player.style.left=parameters["Width"]/2-15;
		}else if($dataMap.width<parameters["Width"]/SCALE){
			player.style.left=parameters["Width"]/2-$dataMap.width*SCALE/2+cor_x*SCALE-15;
		}else if(cor_x*SCALE<parameters["Width"]/2){
			player.style.left=cor_x*SCALE-15;
		}else{
			player.style.left=parameters["Width"]-($dataMap.width-cor_x)*SCALE-15;
		};
		if($dataMap.height>=parameters["Height"]/SCALE && cor_y*SCALE>=parameters["Height"]/2 && ($dataMap.height-cor_y)*SCALE>=parameters["Height"]/2){
			player.style.top=parameters["Height"]/2-15;
		}else if($dataMap.height<parameters["Height"]/SCALE){
			player.style.top=parameters["Height"]/2-$dataMap.height*SCALE/2+cor_y*SCALE-15;
		}else if(cor_y*SCALE<parameters["Height"]/2){
			player.style.top=cor_y*SCALE-15;
		}else{
			player.style.top=parameters["Height"]-($dataMap.height-cor_y)*SCALE-15;
		};
	};
	
	let _GamePlayer_executeMove=Game_Player.prototype.executeMove;
	Game_Player.prototype.executeMove=function(direction){
		_GamePlayer_executeMove.call(this,direction);
		RefreshPlayer(direction,true);
	};
	
}());