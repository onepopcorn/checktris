var 	KEY              = {SPACE:32,LEFT:37,UP:38,RIGHT:39,DOWN:40},
		DIR              = {UP:0,RIGHT:1,DOWN:2,LEFT:3,MIN:0,MAX:3}, 
		POINTS_PER_LINE  = 100,
		LEVEL_UP         = 30
		fieldWidth       = 10, // number of court columns
		fieldHeight      = 20, // number of court rows
		dropSpeed        = 50,
		lines            = 0,
		score            = 0,
		piecesCount      = 0,
		
		current, // current piece info
		next, // next piece info
		nextBox, // next div canvas
		court, // court div canvas
		occupiedBlocks   = [], // blocks currently in court
		actions          = [], // Queued actions
		timestamp        = 0,
		randomPiecesList = [],
		linesToRemove    = [],

		pieces = [
					[0x0F00, 0x2222, 0x0F00, 0x2222], // I
					[0x44C0, 0x8E00, 0x6440, 0x0E20], // J
					[0x4460, 0x0E80, 0xC440, 0x2E00], // L
					[0x0660, 0x0660, 0x0660, 0x0660], // O
					[0x06C0, 0x8C40, 0x06C0, 0x8C40], // S
					[0x0E40, 0x4C40, 0x4E00, 0x4640], // T
					[0x0C60, 0x4C80, 0x0C60, 0x4C80]  // Z
				];
		console.log("HEEKKIIII");
function drawCourt()
{
	court = document.getElementById("court");
	court.style.width = 13 * fieldWidth + "px"; // checkbox is 13px wide on windows chrome & firefox
	court.innerHTML = "";
	for (var i = 0; i < fieldWidth * fieldHeight; i++) {
		court.innerHTML += '<input type="checkbox">';
	};
	
	nextBox = document.getElementById("next");
	nextBox.innerHTML = "";
	nextBox.style.width = 13 * 4+"px";
	for(var i = 0; i < 16;i++){
		nextBox.innerHTML += '<input type="checkbox">';
	};
}

function eachblock(type,x,y,dir,fn)
{
	var bit, 
		row = 0,
		col = 0,
		blocks = type[dir];
	for(bit = 0x8000; bit>0; bit = bit >> 1){
		if(blocks & bit)
			fn(x+col, y+row);
		if(++col === 4){
			col = 0;
			row++;
		}
	}
}

function collision(type,x,y,dir){
	var result = false;
	eachblock(type,x,y,dir,function(x,y){
		if((x < 0) || (x >= fieldWidth) || (y < 0) || (y >= fieldHeight) || occupiedBlocks[x+y*fieldWidth])
			result = true;
	});
	return result;
}

function randomPiece(){
	if(randomPiecesList.length == 0)
		randomPiecesList = [pieces[0],pieces[0],pieces[0],pieces[0],pieces[1],pieces[1],pieces[1],pieces[1],pieces[2],pieces[2],pieces[2],pieces[2],pieces[3],pieces[3],pieces[3],pieces[3],pieces[4],pieces[4],pieces[4],pieces[4],pieces[5],pieces[5],pieces[5],pieces[5],pieces[6],pieces[6],pieces[6],pieces[6]];
	var type = randomPiecesList.splice(Math.floor(Math.random()*(randomPiecesList.length)),1)[0];
	return {type: type, dir: DIR.UP, x:0, y:0};
}

function drawNext(){
	piecesCount++;
	var piece = randomPiece();
	clearNext();
	eachblock(piece.type,piece.x,piece.y,piece.dir,function(x,y){
		drawBlock(nextBox,x,y,4);
	});
	current = next
	next = piece;
	// Every 10 pieces... level up!
	if(piecesCount==LEVEL_UP){
		piecesCount = 0;
		dropSpeed -= 5;
	}
}

function render(){
	eachblock(current.type,current.x,current.y,current.dir,function(x,y){
		drawBlock(court,x,y,fieldWidth);
	});
	
	if(timestamp >= dropSpeed)
	{
		timestamp = 0;
		moveDown();
	}
	else
		timestamp++;
}

function moveDown(){
	if(!move(DIR.DOWN) && current.y > 0){
		// piece is colliding with ground or another piece
		eachblock(current.type,current.x, current.y,current.dir,function(x,y){
			occupiedBlocks[x+y*fieldWidth] = 1;
		});
		drawNext();
		checkCompletedLines();
	} else if(current.y == 0)
		gameOver();
}

function checkCompletedLines(){
	for(var line=fieldHeight-1;line>0;line--)
	{
		var cells = 0;
		for(var row=0;row<fieldWidth;row++){
			if(typeof(occupiedBlocks[row+line*fieldWidth]) != 'undefined')
				cells += occupiedBlocks[row+line*fieldWidth];
		}
		if(cells == fieldWidth)
			linesToRemove.push(line)
	}
	if(linesToRemove.length)
	{
		markLines();
		addScore(linesToRemove.length);	
	}
}

function markLines(){
	pause();
	for(var i=0;i<linesToRemove.length;i++)
	{
		for(var col=0;col<fieldWidth;col++)
			highlightBlock(court,col,linesToRemove[i],fieldWidth);
	}
	setTimeout(removeLines,300);
}

function removeLines(){
	var linesCount = linesToRemove.length;
	// remove all blocks in line
	for(var i=0;i<linesCount;i++)
	{
		for(var col=0;col<fieldWidth;col++)
		{
			occupiedBlocks[col+linesToRemove[i]*fieldWidth] = null;
			clearBlock(court,col,linesToRemove[i],fieldWidth);
		}
	}
	for(var i=linesCount;i>0;i--)
	{
		console.log(i);
		for(var row=linesToRemove[i-1];row>0;row--)
		{
			for(var col=0;col<fieldWidth;col++)
			{
				if(occupiedBlocks[col+row*fieldWidth])
				{
					// Clear previous position hightlighted checkbox
					occupiedBlocks[col+row*fieldWidth] = null;
					clearBlock(court,col,row,fieldWidth);
					// Draw next position checkbox
					occupiedBlocks[col+(row+1)*fieldWidth] = 1;
					drawBlock(court,col,row+1,fieldWidth);
				}
			}
		}
	}
	linesToRemove = [];
	resume();
}

function addScore(multiplier){
	lines = lines + multiplier;
	score += POINTS_PER_LINE * multiplier + (multiplier-1)*10;
	document.getElementById('score').innerHTML = score;
	document.getElementById('linesCounter').innerHTML = lines;
}

function clearCourt(){
	eachblock(current.type,current.x, current.y,current.dir,function(x,y){
		clearBlock(court,x,y,fieldWidth);
	});
}

function clearNext(){
	for(var i=0;i<16;i++)
	{
		nextBox.childNodes[i].className = '';
		nextBox.childNodes[i].checked = false;
	}
}

function highlightBlock(id,x,y,width){
	id.childNodes[x+y*width].checked = true;
}

function clearBlock(id,x,y,width){
	id.childNodes[x + y*width].className = '';
	id.childNodes[x + y*width].checked = false;
}

function drawBlock(id,x,y,width){
	id.childNodes[x + y*width].className = "hide";
}

function inputManager(evt){
	switch(evt.keyCode)
	{
		case KEY.UP: actions.push(DIR.UP); break;
		case KEY.RIGHT: actions.push(DIR.RIGHT); break;
		case KEY.DOWN: actions.push(DIR.DOWN); break;
		case KEY.LEFT: actions.push(DIR.LEFT); break;
	}
}

function rotate(){
	var newDirection = (current.dir == DIR.MAX ? DIR.MIN : current.dir +1);
	if(!collision(current.type,current.x,current.y,newDirection)){
		clearCourt();
		current.dir = newDirection;
	}
}

function move(dir){
	var nextX = current.x, nextY = current.y;
	switch(dir){
		case DIR.LEFT: nextX--; break;
		case DIR.RIGHT: nextX++; break;
		case DIR.DOWN: nextY++; break;
	}

	if(!collision(current.type,nextX,nextY,current.dir))
	{
		clearCourt();
		current.x = nextX;
		current.y = nextY;
		return true
	}
	else
		return false;
}

function play(e){
	e.target.removeEventListener('click',play);
	e.target.style.display = "none";

	drawCourt();
	drawNext();
	drawNext();
	update();

	document.addEventListener('keydown',inputManager);
}

function gameOver(){
	pause();
	if(confirm("Play again?"))
		location.reload();
}

function resume()
{
	animationID = window.requestAnimationFrame(update);
}

function pause()
{
	window.cancelAnimationFrame(animationID);
}

function update(){
	resume();
	if(actions.length){
		switch(actions.shift())
		{
			case DIR.UP: 
				rotate(); 
				break;
			case DIR.LEFT:
				move(DIR.LEFT);
				break;
			case DIR.RIGHT:
				move(DIR.RIGHT);
				break;
			case DIR.DOWN:
				move(DIR.DOWN);
				break;
		}
	}
	render();
}

window.onload = function(e)
{
	 document.getElementById("loading").style.display = "none";
	 document.getElementById("play-button").addEventListener('click',play,false);
}