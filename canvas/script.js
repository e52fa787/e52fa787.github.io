(typeof window!=='undefined'?window:this).addEventListener('load',function(globalLoadEvent){'use strict';

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
let $controlToggleAnimation=$doc.getElementById('toggle-animation')

let $controlsResetCanvas=$doc.getElementById('reset-canvas')

let $coordOutput=$doc.getElementById('output-coords'),
    outputMsgNotDragging=$coordOutput.innerHTML

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

// CONTROL PANEL

/**
 * Rounds number to a specified number of decimal places
 * @param {Number} number number to round
 * @param {Number} [dp=2] number of decimal places to round to
 * @returns 
 */
let roundToDecimal=function(number,dp=2){
    return parseInt(number*(10**dp))/(10**dp)
}

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

    let [computedLeft, computedTop]=moveCoordsWithinWindow(controlPos,$body.clientWidth-$controls.clientWidth,$body.clientHeight-$controls.clientHeight)

    $controls.style.transform='translate('+computedLeft+'px,'+computedTop+'px)'
},function(){
    $controls.classList.remove('currentlyDragging')
    copyArrayTo(controlPos,moveCoordsWithinWindow(controlPos,$body.clientWidth-$controls.clientWidth,$body.clientHeight-$controls.clientHeight))
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
//$controlsClearCanvas.addEventListener('click', clearCanvas)
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

let $canvas=$doc.getElementById('canvas')
/**
 * @type {CanvasRenderingContext2D}
 */
let ctx=$canvas.getContext('2d')

let canvasDragPos=[0,0],
    canvasDragVel=[0,0],
    canvasDragTime=0,
    canvasDragStopTimeout=0,
    currentAnimationFrame, // stores requestAnimationFrame output for cancelling
    canvasWidth,
    canvasHeight,
    animTick=0,
    canvasTime=0,
    timeSinceLastFrame=0

/**
 * Makes sure canvas width and height continue to fill up Window when resizing
 */
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

const BOBCLICKAREASCALEFACTOR = HASTOUCHEVENTS ? 4 : 1,
    MAXDRAGVEL=8

const L0=1, g=9.81, kOverM=3, pxPerMeter=100

let pivotCoords=[canvasWidth/(pxPerMeter*2), canvasHeight/(pxPerMeter*6)],
    pendulumCoords=vectorAdd(pivotCoords,[0,100/pxPerMeter]),
    pendulumBobRadius=0.15,
    pivotRadius=0.15,
    currentlyDraggingBob=false,
    currentPhaseSpaceCoords=[g/kOverM,0.1,0,0]

//let sigmoid = (x, max=1, slope=1)=>Math.tanh(x*slope/max)*max

let pendulumCoordsToPhaseSpace=function(left,top, leftVel=0, topVel=0){
    let diff=vectorSubtract([left,top], pivotCoords),
        magnitude=Math.sqrt(normSquared(diff)),
        x=magnitude-L0,
        theta=Math.atan2(diff[0],diff[1]),
        xPrime=0,
        thetaPrime=0

    if((leftVel || topVel) && magnitude>0){
        let velNormSquared=leftVel*leftVel + topVel*topVel
        if(velNormSquared > MAXDRAGVEL*MAXDRAGVEL){
            let factor=MAXDRAGVEL*(velNormSquared**-0.5)
            leftVel*= factor
            topVel*=factor
        }
        thetaPrime=(leftVel*diff[1]-topVel*diff[0])/magnitude
        xPrime=(diff[0]*leftVel+diff[1]*topVel)/magnitude
    }
    return [x, theta, xPrime, thetaPrime]
}

let phaseSpaceToPendulumCoords=function(x, theta, xPrime, thetaPrime){
    let L=L0+x
    return vectorAdd(pivotCoords,scalarMult(L,[Math.sin(theta),Math.cos(theta)]))
}

/**
 * Calculates the (termwise) derivatives of the array [x, theta, xPrime, thetaPrime]
 * @param {Number} x deviation from rest length
 * @param {Number} theta angle with vertical in radians (down is zero, right is positive)
 * @param {Number} xPrime Time derivataive of x
 * @param {Number} thetaPrime Time derivative of theta
 * @returns 
 */
let pendulumFunction=function(x, theta, xPrime, thetaPrime){
    let l=L0+x
    return [
        xPrime, thetaPrime,
        l*thetaPrime*thetaPrime-kOverM*x+g*Math.cos(theta),
        -(g*Math.sin(theta)+2*xPrime*thetaPrime)/l
    ]
}

/**
 * Uses order-4 Runge-Kutta to compute future coords cuz I'm lazy
 * @param {Array} curr Array of current polar coordinates and their derivatives wrt time
 * @param {*} h Timestep
 * @returns 
 */
let nextStepRK4=function(curr,h){
    let k1=pendulumFunction(...curr),
        k2=pendulumFunction(...vectorAdd(curr,scalarMult(h/2,k1))),
        k3=pendulumFunction(...vectorAdd(curr,scalarMult(h/2,k2))),
        k4=pendulumFunction(...vectorAdd(curr,scalarMult(h,k3)))
    return vectorAdd(curr,vectorAdd(scalarMult(h/6,vectorAdd(k1,k4)),scalarMult(h/3,vectorAdd(k2,k3))))
}

/**
 * Renders one frame of the canvas
 * @param {Number} timeStamp Timeline's current time in ms, passed as parameter by requestAnimationFrame
 */
let animate=function(timeStamp){
    clearCanvas()
    animTick++
    timeStamp = timeStamp || $doc.timeline.currentTime
    timeSinceLastFrame = Math.min(timeStamp - canvasTime, 30)
    canvasTime = timeStamp


    if(currentlyDraggingBob){
        // no physics calculations, just move the bob to the mouse
        copyArrayTo(pendulumCoords,canvasDragPos)
    }else{
        // compute next step using nextStepRK4
        currentPhaseSpaceCoords=nextStepRK4(currentPhaseSpaceCoords,timeSinceLastFrame*1e-3)
        //collision detection
        if(currentPhaseSpaceCoords[0]+L0<pendulumBobRadius+pivotRadius){
            currentPhaseSpaceCoords[0]=pivotRadius+pendulumBobRadius-L0
            currentPhaseSpaceCoords[2]=-currentPhaseSpaceCoords[2]
        }
        // convert to cartesian coords
        copyArrayTo(pendulumCoords, phaseSpaceToPendulumCoords(...currentPhaseSpaceCoords))
    }

    //draw and stuff
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
    copyArrayTo(canvasDragPos,scalarMult(1/pxPerMeter,coords))
    canvasDragTime=$doc.timeline.currentTime
    if($controlToggleAnimation.checked && normSquared(vectorSubtract(canvasDragPos,pendulumCoords))<=BOBCLICKAREASCALEFACTOR*(pendulumBobRadius**2)){ // factor makes it easier to drag on mobile
        currentlyDraggingBob=true
    }

    $coordOutput.innerHTML=roundToDecimal(canvasDragPos[0])+', '+roundToDecimal(canvasDragPos[1])
},function(coords){
    let posNew=scalarMult(1/pxPerMeter,coords),
        timeDiff=$doc.timeline.currentTime-canvasDragTime
    canvasDragTime+=timeDiff
    if(timeDiff>0){
        copyArrayTo(canvasDragVel, scalarMult(1e3/timeDiff,vectorSubtract(posNew, canvasDragPos)))
    }
    copyArrayTo(canvasDragPos,posNew)
    
    clearTimeout(canvasDragStopTimeout)
    canvasDragStopTimeout=setTimeout(function(){
        copyArrayTo(canvasDragVel,[0,0])
    }, 100)

    $coordOutput.innerHTML=roundToDecimal(canvasDragPos[0])+', '+roundToDecimal(canvasDragPos[1])
},function(){
    // convert to polar coords
    if(currentlyDraggingBob){
        copyArrayTo(currentPhaseSpaceCoords, pendulumCoordsToPhaseSpace(...canvasDragPos, ...canvasDragVel))
        currentlyDraggingBob=false
        $coordOutput.innerHTML=outputMsgNotDragging
    }
})

})