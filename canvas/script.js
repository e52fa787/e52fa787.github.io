(function(global, factory){global.addEventListener('load', factory)})(typeof window!=='undefined'?window:this, function(globalLoadEvent){'use strict';

const $w=globalLoadEvent ? globalLoadEvent.currentTarget : this,
    $doc=$w.document,
    $body=$doc.body

const HASTOUCHEVENTS = typeof $w.ontouchstart!=='undefined'

const EVENTDRAGMOVE = HASTOUCHEVENTS ? 'touchmove' : 'mousemove',
    EVENTDRAGEND = HASTOUCHEVENTS ? 'touchend' : 'mouseup',
    EVENTDRAGSTART = HASTOUCHEVENTS ? 'touchstart' : 'mousedown'

let $controls=$doc.getElementById('controls'),
    $cssOutput=$doc.getElementById('css-output')

let $controlsDragTrigger=$controls.getElementsByTagName('header')[0]
let $controlsList=$controls.getElementsByTagName('ul')[0]
let $controlTogglePanel=$controls.getElementsByClassName('toggle-dropdown')[0]
let $controlToggleAnimation=$controls.getElementsByClassName('toggle-animation')[0]

let $controlsClearCanvas=$controls.getElementsByClassName('clear-canvas')[0]
let $controlsResetCanvas=$controls.getElementsByClassName('reset-canvas')[0]

let $coordOutput=$doc.getElementById('output-coords')

let isWindowActive=true

let handleWindowBlur=function(){
    isWindowActive=false
}
$w.addEventListener('blur', handleWindowBlur)

let handleWindowFocus=function(){
    isWindowActive=true
}
$w.addEventListener('focus', handleWindowFocus)

/**
 * Tracks previous mouse position when dragging over $controls
 * @type {Array}
 */
let controlsDragPos=[0,0]
/**
 * Tracks coordinates of the control panel itself (which can't leave the window)
 * Initial values are the computed .left and .top values of $controls
 * @type {Array}
 */
let controlPos=(function(o){return [o.left,o.top]})($controls.getBoundingClientRect())

let $canvas=$doc.getElementById('canvas')
/**
 * @type {CanvasRenderingContext2D}
 */
let ctx=$canvas.getContext('2d')

let canvasDragPos=[0,0],
    currentlyDraggingCanvas=false,
    currentAnimationFrame,
    canvasWidth,
    canvasHeight,
    animTick=0,
    canvasTime=0,
    timeSinceLastFrame=0

// CONTROL PANEL

/**
 * Copies the values of src to destination without changing the reference of desination
 * @param {Array} destination 
 * @param {Array} src 
 */
let copyArrayTo=function(destination, src){
    destination.splice(0,destination.length,...src)
}

/**
 * Extracts [x,y] coordinates from a touch/mouse event
 * @param {Event} e 
 * @returns {Array} Array of two coordinates contained in the event
 */

let extractCoordsFromEvent=function(e){
    if(HASTOUCHEVENTS) {
        const { touches, changedTouches } = e.originalEvent ?? e
        const touch = touches[0] ?? changedTouches[0]
        return [touch.clientX,touch.clientY]
    }else{
        return [e.clientX, e.clientY]
    }
}
/**
 * Moves coords [x,y] within the range 0<=x<=horizontalMax, 0<=y<=verticalMax
 * @param {Array} coords Array of two numbers representing coordinates
 * @param {Number} horizontalMax 
 * @param {Number} verticalMax 
 * @returns {Array} Array of coordinates
 */
let moveCoordsWithinWindow=function(coords, horizontalMax, verticalMax){
    let [left,top]=coords
    if(left<0){
        left=0
    }else if(left>horizontalMax){
        left=horizontalMax
    }
    //if(top>0 && top<=verticalMax){
    //    top=verticalMax
    //}else 
    if(top<0){
        top=0
    }else if(top>verticalMax){
        top=verticalMax
    }
    return [left,top]
}
/**
 * Attaches and removes event listeners for draggable objects and calculates mouse coordinates
 * @param {Element} $elem Element to attach the drag start listener to
 * @param {Function} dragStart Function that runs on drag start
 * @param {Function} dragMove Function that runs on drag move
 * @param {Function} dragEnd Function that runs on drag end
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
/**
 * Set up dragging for $controls
 */
setUpDragListeners($controlsDragTrigger, function(coords){
    copyArrayTo(controlsDragPos,coords)
    $controls.classList.add('currentlyDragging')
}, function(coords){
    // compute new positions based on mouse movement

    controlPos[0] += coords[0] - controlsDragPos[0]
    controlPos[1] += coords[1] - controlsDragPos[1]

    //store old positions
    copyArrayTo(controlsDragPos, coords)

    //$controlsDragTrigger.innerHTML=controlsDragPos[0]+', '+controlsDragPos[1]

    let [computedLeft, computedTop]=moveCoordsWithinWindow(controlPos,$body.clientWidth-$controls.clientWidth,$body.clientHeight-$controls.clientHeight)

    $controls.style.transform='translate('+computedLeft+'px,'+computedTop+'px)'
},function(){
    $controls.classList.remove('currentlyDragging')
    moveCoordsWithinWindow(controlPos,$body.clientWidth-$controls.clientWidth,$body.clientHeight-$controls.clientHeight, true)
})

/**
 * Toggles the closed/expanded state of the $controls
 */
let handleControlPanelToggle=function(){
    $controls.classList.toggle('closed')
}

$controlTogglePanel.addEventListener('click', handleControlPanelToggle)

/**
 * Updates the control panel's CSS height
 * Currently, each child of $controlList contributes 2em to its opened height
 */
let updateControlsHeightCSS=function(){
    $cssOutput.innerHTML="#controls>ul{max-height:"+($controlsList.childElementCount*2)+"em;}"
}
updateControlsHeightCSS()


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
let clearCanvas=function(){
    ctx.clearRect(0,0,canvasWidth,canvasHeight)
}
$controlsClearCanvas.addEventListener('click', clearCanvas)
/**
 * Resets canvas
 */
let handleResetCanvas=function(){
    animTick=0
    currentPhaseSpaceCoords=[g/kOverM,0,0,0]
    clearCanvas()
}
$controlsResetCanvas.addEventListener('click', handleResetCanvas)



// CANVAS STUFF

let handleResize=function(){
    canvasWidth=$w.innerWidth
    canvasHeight=$w.innerHeight

    $canvas.width=canvasWidth;
    $canvas.height=canvasHeight;
}

handleResize()
$w.addEventListener('resize', handleResize)

/**
 * Adds two arrays termwise
 * @param {Array} a 
 * @param {Array} b 
 * @returns {Array} Result is the same size as a (and should be the same size as b, but isn't checked)
 */
let vectorAdd=(a,b) => a.map((x,i) => x+b[i])
/**
 * Subtracts two arrays termwise
 * @param {Array} a 
 * @param {Array} b 
 * @returns {Array} Result is the same size as a (and should be the same size as b, but isn't checked)
 */
let vectorSubtract=(a,b) => a.map((x,i) => x-b[i])
/**
 * Multiplies array termwise by scalar
 * @param {Number} scalar 
 * @param {Array} vector 
 * @returns {Array} same size as vector, with each term multiplied by scalar
 */
let scalarMult=(scalar, vector) => vector.map(x => scalar * x)
/**
 * Sum of termwise squares of array
 * @param {Array} vector 
 * @returns {Number}
 */
let normSquared=(vector)=>vector.reduce((sumSoFar, x)=>(sumSoFar + x*x),0)

const L0=1, g=9.81, kOverM=3, pxPerMeter=100

let pivotCoords=[canvasWidth/(pxPerMeter*2), canvasHeight/(pxPerMeter*6)],
    pendulumCoords=vectorAdd(pivotCoords,[0,100/pxPerMeter]),
    pendulumBobRadius=0.15,
    pivotRadius=0.15,
    currentlyDraggingBob=false,
    currentPhaseSpaceCoords=[g/kOverM,0,0,0]

let pendulumCoordsToPhaseSpace=function(left,top){
    let diff=vectorSubtract([left,top], pivotCoords),
        magnitude=Math.sqrt(normSquared(diff)),
        x=magnitude-L0,
        theta=Math.atan2(diff[0],diff[1])
    //if(x<0){x=0;console.warn('pendulum x coordinate dipped below 0')}
    return [x, theta, 0, 0]
}

let phaseSpaceToPendulumCoords=function(x, theta, xPrime, thetaPrime){
    //if(x<0){x=0;console.warn('pendulum x coordinate dipped below 0')}
    let L=L0+x
    return vectorAdd(pivotCoords,scalarMult(L,[Math.sin(theta),Math.cos(theta)]))
}

let pendulumFunction=function(x, theta, xPrime, thetaPrime){
    let l=L0+x,
        lInverse=1/l
    return [
        xPrime, thetaPrime,
        l*thetaPrime*thetaPrime-kOverM*x+g*Math.cos(theta),
        -(g*Math.sin(theta)+2*xPrime*thetaPrime)*lInverse
    ]
}


let nextStepRK4=function(curr,h,f=pendulumFunction){
    let k1=f(...curr),
        k2=f(...vectorAdd(curr,scalarMult(h/2,k1))),
        k3=f(...vectorAdd(curr,scalarMult(h/2,k2))),
        k4=f(...vectorAdd(curr,scalarMult(h,k3)))
    return vectorAdd(curr,vectorAdd(scalarMult(h/6,vectorAdd(k1,k4)),scalarMult(h/3,vectorAdd(k2,k3))))
}

let animate=function(timeStamp){
    clearCanvas()
    animTick++
    timeStamp = timeStamp || $doc.timeline.currentTime
    timeSinceLastFrame = Math.min(timeStamp - canvasTime, 30)
    canvasTime = timeStamp


    if(currentlyDraggingBob){
        copyArrayTo(pendulumCoords,canvasDragPos)
        copyArrayTo(currentPhaseSpaceCoords, pendulumCoordsToPhaseSpace(...pendulumCoords))
    }else{
        currentPhaseSpaceCoords=nextStepRK4(currentPhaseSpaceCoords,timeSinceLastFrame*1e-3)
        //collision detection
        
        copyArrayTo(pendulumCoords, phaseSpaceToPendulumCoords(...currentPhaseSpaceCoords))
    }
    //$controlsDragTrigger.innerHTML=pendulumCoords.map((x)=>parseInt(x)).toString()

    ctx.beginPath()
    ctx.scale(pxPerMeter,pxPerMeter)
    ctx.arc(...pivotCoords, pivotRadius, 0, 2*Math.PI)
    ctx.fillStyle='#333'
    ctx.fill()

    ctx.moveTo(...pivotCoords)
    ctx.lineWidth=3/pxPerMeter
    ctx.lineTo(...pendulumCoords)
    ctx.strokeStyle='#333'
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(...pendulumCoords, pendulumBobRadius, 0, 2*Math.PI)
    ctx.fillStyle='#ccc'
    ctx.fill()

    ctx.setTransform(1, 0, 0, 1, 0, 0)


    //if($controlToggleAnimation.checked) // REDUNDANT WITH cancelAnimationFrame in handleAnimationToggle()
    currentAnimationFrame=$w.requestAnimationFrame(animate)
}

/**
 * Syncs canvasDragPos with current cursor position when dragging
 * Also updates $coordOutput
 */
setUpDragListeners($canvas, function(coords){
    currentlyDraggingCanvas=true
    copyArrayTo(canvasDragPos,scalarMult(1/pxPerMeter,coords))

    if($controlToggleAnimation.checked && normSquared(vectorSubtract(canvasDragPos,pendulumCoords))<=Math.pow(pendulumBobRadius,2)){
        currentlyDraggingBob=true
    }

    $coordOutput.innerHTML=Math.floor(canvasDragPos[0])+', '+Math.floor(canvasDragPos[1])
},function(coords){
    copyArrayTo(canvasDragPos,scalarMult(1/pxPerMeter,coords))
    $coordOutput.innerHTML=Math.floor(canvasDragPos[0])+', '+Math.floor(canvasDragPos[1])
},function(){
    currentlyDraggingCanvas=false
    currentlyDraggingBob=false
    $coordOutput.innerHTML='no dragging rn'
})

})