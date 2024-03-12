;(typeof window!=='undefined'?window:this).addEventListener('load',function(globalLoadEvent){'use strict';

const /** @type {Window} */ $w=globalLoadEvent ? globalLoadEvent.currentTarget : this,
    /** @type {Document} */$doc=$w.document,
    /** @type {HTMLBodyElement} */ $body=$doc.body

const /** @type {boolean} */ HASTOUCHEVENTS = typeof $w.ontouchstart!=='undefined'

const /** @type {string} */ EVENTDRAGMOVE = HASTOUCHEVENTS ? 'touchmove' : 'mousemove',
    /** @type {string} */ EVENTDRAGEND = HASTOUCHEVENTS ? 'touchend' : 'mouseup',
    /** @type {string} */ EVENTDRAGSTART = HASTOUCHEVENTS ? 'touchstart' : 'mousedown'

let /** @type {Element} */ $controls=$doc.getElementById('controls'),
    /** @type {Element} */ $cssOutput=$doc.getElementById('css-output')

let /** @type {Element} */ $controlsDragTrigger=$controls.getElementsByTagName('header')[0]
let /** @type {Element} */ $controlsList=$controls.getElementsByTagName('ul')[0]
let /** @type {Element} */ $controlTogglePanel=$controls.getElementsByClassName('toggle-dropdown')[0]
let /** @type {Element} */ $controlToggleAnimation=$doc.getElementById('toggle-animation')

let /** @type {Element} */ $controlsResetCanvas=$doc.getElementById('reset-canvas')

let /** @type {Element} */ $coordOutput=$doc.getElementById('output-coords'),
    /** @type {string} */ outputMsgNotDragging=$coordOutput.innerHTML

let /** @type {boolean} */ isWindowActive=true

/**
 * Marks the variable isWindowActive as false when the window loses focus
 */
let handleWindowBlur=function(){
    isWindowActive=false
}
$w.addEventListener('blur', handleWindowBlur)

/**
 * Marks the variable isWindowActive as true when the window gains focus
 */
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
 * @param {number} number number to round
 * @param {number} [dp=2] number of decimal places to round to
 * @returns 
 */
let roundToDecimal=function(number,dp=2){
    return Math.round(number*(10**dp))/(10**dp)
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
    if(HASTOUCHEVENTS){
        const {touches, changedTouches} = e.originalEvent ?? e
        const touch = touches[0] ?? changedTouches[0]
        return [touch.clientX,touch.clientY]
    }else{
        return [e.clientX, e.clientY]
    }
}
/**
 * Moves coords [x,y] within the range 0<=x<=horizontalMax, 0<=y<=verticalMax
 * @param {Array} coords Array of two numbers representing coordinates
 * @param {number} horizontalMax 
 * @param {number} verticalMax 
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
    /**
     * Wrapper for dragStart listener
     * @param {Event} e 
     */
    let dragStartListener=function(e){
        e.preventDefault()
        dragStart.call(this,extractCoordsFromEvent(e),e)
        $doc.addEventListener(EVENTDRAGMOVE, dragMoveListener)
        $doc.addEventListener(EVENTDRAGEND, dragEndListener)
        $w.addEventListener('blur', dragEndListener)
    }
    /**
     * Wrapper for dragMove listener
     * @param {Event} e 
     */
    let dragMoveListener=function(e){
        e.preventDefault()
        dragMove.call(this, extractCoordsFromEvent(e),e)
    }
    /**
     * Wrapper for dragEnd listener
     */
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

let /** @type {Element} */ $canvas=$doc.getElementById('canvas')
let /** @type {CanvasRenderingContext2D} */ ctx=$canvas.getContext('2d')

let /** @type {!Array} */ canvasDragPos=[0,0],
    /** @type {!Array} */ canvasDragVel=[0,0],
    /** @type {number} */ canvasDragTime=0,
    /** @type {number} */ canvasDragStopTimeout=0,
    /** @type {number} */ currentAnimationFrame, // stores requestAnimationFrame output for cancelling
    /** @type {number} */ canvasWidth,
    /** @type {number} */ canvasHeight,
    /** @type {number} */ animTick=0,
    /** @type {number} */ canvasTime=0,
    /** @type {number} */ timeSinceLastFrame=0

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
 * @returns {!Array} Result is the same size as a (and should be the same size as b, but isn't checked)
 */
let vectorAdd=(a,b) => a.map((x,i) => x+b[i])
/**
 * Subtracts two arrays termwise
 * @param {Array} a 
 * @param {Array} b 
 * @returns {!Array} Result is the same size as a (and should be the same size as b, but isn't checked)
 */
let vectorSubtract=(a,b) => a.map((x,i) => x-b[i])
/**
 * Multiplies array termwise by scalar
 * @param {number} scalar 
 * @param {Array} vector 
 * @returns {!Array} same size as vector, with each term multiplied by scalar
 */
let scalarMult=(scalar, vector) => vector.map(x => scalar * x)
/**
 * Sum of termwise squares of array
 * @param {Array} vector 
 * @returns {!number}
 */
let normSquared=(vector)=>vector.reduce((sumSoFar, x)=>(sumSoFar + x*x),0)

const /** @type {number} */ BOBCLICKAREASCALEFACTOR = HASTOUCHEVENTS ? 4 : 1,
    /** @type {number} */ MAXDRAGVEL=4

let /** @type {number} */ L0=1,
    /** @type {number} */ g=9.81,
    /** @type {number} */ kOverM=3,
    /** @type {number} */ pxPerMeter=100,
    /** @type {number} */ linearDragCoeff=0.1

let /** @type {!Array} */ pivotCoords=[canvasWidth/(pxPerMeter*2), canvasHeight/(pxPerMeter*6)],
    /** @type {!Array} */ pendulumCoords=vectorAdd(pivotCoords,[0,100/pxPerMeter]),
    /** @type {number} */ pendulumBobRadius=0.15,
    /** @type {number} */ pivotRadius=0.15,
    /** @type {boolean} */ currentlyDraggingBob=false,
    /** @type {!Array} */ currentPhaseSpaceCoords=[g/kOverM,0.1,0,0]

//let sigmoid = (x, max=1, slope=1)=>Math.tanh(x*slope/max)*max

/**
 * Converts pixel left and top offsets to physical polar coodinates 
 * @param {number} left Left offset in pixels
 * @param {number} top Top offset in pixels
 * @param {number} [leftVel=0] Time derivative of left offset
 * @param {number} [topVel=0] Time derivative of top offset
 * @returns {Array}
 */
let pendulumCoordsToPhaseSpace=function(left,top, leftVel=0, topVel=0){
    let /** @type {Array} */ diff=vectorSubtract([left,top], pivotCoords),
        /** @type {number} */ magnitude=Math.sqrt(normSquared(diff)),
        /** @type {number} */ x=magnitude-L0,
        /** @type {number} */ theta=Math.atan2(diff[0],diff[1]),
        /** @type {number} */ xPrime=0,
        /** @type {number} */ thetaPrime=0

    if((leftVel || topVel) && magnitude>0){
        let /** @type {number} */ velNormSquared=leftVel*leftVel + topVel*topVel
        if(velNormSquared > MAXDRAGVEL*MAXDRAGVEL){
            let /** @type {number} */ factor=MAXDRAGVEL*(velNormSquared**-0.5)
            leftVel*= factor
            topVel*=factor
        }
        thetaPrime=(leftVel*diff[1]-topVel*diff[0])/magnitude
        xPrime=(diff[0]*leftVel+diff[1]*topVel)/magnitude
    }
    return [x, theta, xPrime, thetaPrime]
}

/**
 * Converts physical polar coodinates to pixel left and top offsets
 * @param {number} x 
 * @param {number} theta 
 * @param {number} xPrime 
 * @param {number} thetaPrime 
 * @returns {Array}
 */
let phaseSpaceToPendulumCoords=function(x, theta, xPrime, thetaPrime){
    let /** @type {number} */ L=L0+x
    return vectorAdd(pivotCoords,scalarMult(L,[Math.sin(theta),Math.cos(theta)]))
}

/**
 * Calculates the (termwise) derivatives of the array [x, theta, xPrime, thetaPrime]
 * @param {number} x deviation from rest length
 * @param {number} theta angle with vertical in radians (down is zero, right is positive)
 * @param {number} xPrime Time derivataive of x
 * @param {number} thetaPrime Time derivative of theta
 * @returns {Array}
 */
let pendulumFunction=function(x, theta, xPrime, thetaPrime){
    let /** @type {number} */ l=L0+x
        //lthetaPrime2=l*thetaPrime*thetaPrime,
        //v2=xPrime*xPrime+l*lthetaPrime2
    return [
        xPrime, thetaPrime,
        l*thetaPrime*thetaPrime-kOverM*x+g*Math.cos(theta)-linearDragCoeff*xPrime,
        -(g*Math.sin(theta)+2*xPrime*thetaPrime)/l-linearDragCoeff*thetaPrime
    ]
}

/**
 * Uses order-4 Runge-Kutta to compute future coords cuz I'm lazy
 * @param {Array} curr Array of current polar coordinates and their derivatives wrt time
 * @param {number} h Timestep
 * @returns {Array}
 */
let nextStepRK4=function(curr,h){
    let /** @type {Array} */ k1=pendulumFunction(...curr),
        /** @type {Array} */ k2=pendulumFunction(...vectorAdd(curr,scalarMult(h/2,k1))),
        /** @type {Array} */ k3=pendulumFunction(...vectorAdd(curr,scalarMult(h/2,k2))),
        /** @type {Array} */ k4=pendulumFunction(...vectorAdd(curr,scalarMult(h,k3)))
    return vectorAdd(curr,vectorAdd(scalarMult(h/6,vectorAdd(k1,k4)),scalarMult(h/3,vectorAdd(k2,k3))))
}

/**
 * Renders one frame of the canvas
 * @param {number} timeStamp Timeline's current time in ms, passed as parameter by requestAnimationFrame
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
        copyArrayTo(currentPhaseSpaceCoords,nextStepRK4(currentPhaseSpaceCoords,timeSinceLastFrame*1e-3))
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
    if($controlToggleAnimation.checked && normSquared(vectorSubtract(canvasDragPos,pendulumCoords))<=BOBCLICKAREASCALEFACTOR*(pendulumBobRadius**2)){ // factor makes it easier to select on mobile by making the "hitbox" larger
        currentlyDraggingBob=true
    }

    $coordOutput.innerHTML=roundToDecimal(canvasDragPos[0])+', '+roundToDecimal(canvasDragPos[1])
},function(coords){
    let /** @type {Array} */ posNew=scalarMult(1/pxPerMeter,coords),
        /** @type {number} */ timeDiff=$doc.timeline.currentTime-canvasDragTime
    canvasDragTime+=timeDiff
    if(timeDiff>0){
        copyArrayTo(canvasDragVel, scalarMult(1e3/timeDiff,vectorSubtract(posNew, canvasDragPos)))
    }
    copyArrayTo(canvasDragPos,posNew)
    
    clearTimeout(canvasDragStopTimeout)
    canvasDragStopTimeout=setTimeout(function(){
        copyArrayTo(canvasDragVel,[0,0])
    }, 50)

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