(function(global, factory){global.addEventListener('load', factory)})(typeof window!=='undefined'?window:this, function(globalLoadEvent){'use strict';

const $w=globalLoadEvent.currentTarget,
    $doc=window.document,
    $body=$doc.body



const HASTOUCHEVENTS = typeof $w.ontouchstart!=='undefined'

let $controls=$doc.getElementById('controls')

let $controlsDragTrigger=$controls.getElementsByTagName('header')[0]
let $controlTogglePanel=$controls.getElementsByClassName('toggle-dropdown')[0]
let $controlToggleAnimation=$controls.getElementsByClassName('toggle-animation')[0]

let $controlsClearCanvas=$controls.getElementsByClassName('clear-canvas')[0]

let $coordOutput=$doc.getElementById('output-coords')

let controlsDragPos=[0,0]
let controlPos=[$controls.offsetLeft,$controls.offsetTop]

let EVENTDRAGMOVE='mousemove',
    EVENTDRAGEND='mouseup',
    EVENTDRAGSTART='mousedown'

if(HASTOUCHEVENTS){
    EVENTDRAGEND='touchend'
    EVENTDRAGMOVE='touchmove'
    EVENTDRAGSTART='touchstart'
}

let $canvas=$doc.getElementById('canvas'),
    ctx=$canvas.getContext('2d')

let canvasDragPos=[0,0],
    currentlyDraggingCanvas=false,
    currentAnimationFrame,
    canvasWidth,
    canvasHeight,
    animTick=0


// CONTROL PANEL

/**
 * Extracts [x,y] coordinates from a touch/mouse event
 * @param {Event} e 
 * @returns {Array} Array of two coordinates contained in the event
 */

let extractCoordsFromEvent=function(e){
    let pos=[0,0]
    if(HASTOUCHEVENTS) {
        const { touches, changedTouches } = e.originalEvent ?? e;
        const touch = touches[0] ?? changedTouches[0];
        pos[0] = touch.clientX;
        pos[1] = touch.clientY;
    }else{
        pos[0] = e.clientX;
        pos[1] = e.clientY;
    }
    return pos
}
/**
 * @callback handleDrag
 * @param {Array} coords Coordinates of the drag event as an array of integers
 * @param {Event} [e] The underlying Event (optional)
 */
/**
 * Attaches and removes event listeners for draggable objects and calculates mouse coordinates
 * @param {Element} $elem Element to attach the drag start listener to
 * @param {handleDrag} dragStart Function that runs on drag start
 * @param {handleDrag} dragMove Function that runs on drag move
 * @param {handleDrag} dragEnd Function that runs on drag end
 */
let setUpDragListeners=function($elem, dragStart, dragMove, dragEnd){
    let dragStartListener=function(e){
        e=e||$w.event
        e.preventDefault()
        dragStart.call(this,extractCoordsFromEvent(e),e)
        $doc.addEventListener(EVENTDRAGMOVE, dragMoveListener)
        $doc.addEventListener(EVENTDRAGEND, dragEndListener)
        $w.addEventListener('blur', dragEndListener)
    }
    let dragMoveListener=function(e){
        e=e||$w.event
        e.preventDefault()
        dragMove.call(this, extractCoordsFromEvent(e),e)
    }
    let dragEndListener=function(){
        if(dragEnd){
            dragEnd.call(this)
        }
        $doc.removeEventListener(EVENTDRAGMOVE, dragMoveListener)
        $doc.removeEventListener(EVENTDRAGEND, dragEndListener)
        $w.removeEventListener('blur', dragEndListener)
    }
    $elem.addEventListener(EVENTDRAGSTART, dragStartListener)
}

setUpDragListeners($controlsDragTrigger, function(coords){
    controlsDragPos[0] = coords[0]
    controlsDragPos[1] = coords[1]
    $controls.classList.add('currentlyDragging')
}, function(coords){
    let [x,y]=coords,
        computedLeft,
        computedTop

    // compute new positions based on mouse movement

    controlPos[0]=controlPos[0] + x - controlsDragPos[0]
    controlPos[1]=controlPos[1] + y - controlsDragPos[1]

    //store old positions

    controlsDragPos[0]=x
    controlsDragPos[1]=y

    //$controlsDragTrigger.innerHTML=controlsDragPos[0]+', '+controlsDragPos[1]

    // Move $controls horizontally

    if(controlPos[0] > 0 && controlPos[0] + $controls.clientWidth <= $body.clientWidth){
        computedLeft=controlPos[0]
    }else if(controlPos[0] < 0){
        computedLeft=0
    }else if(controlPos[0] + $controls.clientWidth > $body.clientWidth){
        computedLeft=$body.clientWidth-$controls.clientWidth
    }

    // Move $controls vertically

    if(controlPos[1] > 0 && controlPos[1] + $controls.clientHeight <= $body.clientHeight){
        computedTop=controlPos[1]
    }else if(controlPos[1] < 0){
        computedTop=0
    }else if(controlPos[1] + $controls.clientHeight > $body.clientHeight){
        computedTop=$body.clientHeight-$controls.clientHeight
    }

    $controls.style.transform='translate('+computedLeft+'px,'+computedTop+'px)'
},function(){
    $controls.classList.remove('currentlyDragging')
})

/**
 * Toggles the closed/expanded state of the $controls
 */
let handleControlPanelToggle=function(){
    $controls.classList.toggle('closed')
}

$controlTogglePanel.addEventListener('click', handleControlPanelToggle)

/**
 * Pauses or unpauses animation
 */
let handleAnimationToggle=function(){
    if($controlToggleAnimation.checked){
        $w.requestAnimationFrame(animate)
    }else{
        $w.cancelAnimationFrame(currentAnimationFrame) // REDUNDANT WITH if($controlToggleAnimation.checked) in animate()
    }
}

$controlToggleAnimation.addEventListener('change',handleAnimationToggle)

/**
 * Clears canvas
 */
let handleClearCanvas=function(){
    ctx.clearRect(0,0,canvasWidth,canvasHeight)
}
$controlsClearCanvas.addEventListener('click', handleClearCanvas)


setUpDragListeners($canvas, function(coords){
    currentlyDraggingCanvas=TextTrackCueList
    canvasDragPos[0]=coords[0]
    canvasDragPos[1]=coords[1]
},function(coords){
    canvasDragPos[0]=coords[0]
    canvasDragPos[1]=coords[1]
    
    

    $coordOutput.innerHTML=Math.floor(canvasDragPos[0])+', '+Math.floor(canvasDragPos[1])
},function(){
    currentlyDraggingCanvas=false
    $coordOutput.innerHTML='no drawing'
})








// CANVAS STUFF

let handleResize=function(){
    canvasWidth=$w.innerWidth
    canvasHeight=$w.innerHeight

    $canvas.width=canvasWidth;
    $canvas.height=canvasHeight;
}

handleResize()
$w.addEventListener('resize', handleResize)

let circleRadius=100,circleX=canvasWidth/2,circleY=canvasHeight/2

let animate=function(){
    circleRadius = 3 //100+10*Math.sin(animTick*0.1)
    //ctx.clearRect(0,0,canvasWidth,canvasHeight)
    ctx.beginPath()
    ctx.arc(circleX,circleY,circleRadius,0,2*Math.PI)
    ctx.fillStyle='rgb('+ Math.floor(animTick/100)%255 + ',' + Math.floor(animTick/100 + 85)%255 + ',' + Math.floor(animTick/100 + 170)%255 + ')'
    ctx.fill();ctx.closePath()
    circleX = canvasWidth/2 + 200 * Math.sin(0.01 * animTick * 1)
    circleY = canvasHeight/2 + 200 * Math.sin(0.01 * animTick * Math.sqrt(3))





    animTick++
    //if($controlToggleAnimation.checked) // REDUNDANT WITH cancelAnimationFrame in handleAnimationToggle()
    currentAnimationFrame=$w.requestAnimationFrame(animate)
}











})