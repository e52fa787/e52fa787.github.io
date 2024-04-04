;(/** @param {Window} $w Global window object */($w)=>{'use strict';$w.addEventListener('load',()=>{

const /** @type {Document} */$doc=$w.document,
    /** @type {HTMLElement} */ $body=$doc.body

const /** @type {!string} */ EVENTDRAGMOVE = 'touchmove mousemove',
    /** @type {!string} */ EVENTDRAGEND = 'touchend mouseup',
    /** @type {!string} */ EVENTDRAGSTART = 'touchstart mousedown'

/**
 * Gets element from id, and throws an error if it's not found
 * @param {!string} id id of element
 * @returns {!HTMLElement} element if found, else error
 */
const byId=(id)=>{
    const e=$doc.getElementById(id)
    if(!e){
        throw new Error('Element #'+id+' not found')
    }else{
        return e
    }
}
/**
 * Adds or Removes Event Listeners from an element
 * @param {HTMLElement | Document | Window} $elem Element to change event listeners of
 * @param {string} evs Space-separated string of events
 * @param {EventListenerOrEventListenerObject} listener Event listener callback
 * @param {boolean} [removeInstead=false] Whether to add or remove the element
 */
const changeEvListener=($elem, evs, listener, removeInstead=false)=>{
    for(const /** @type {!string} */ ev of evs.split(' ')){
        if(removeInstead){
            $elem.removeEventListener(ev, listener)
        }else{
            $elem.addEventListener(ev, listener)
        }
    }
}
/**
 * Returns the current time in ms using document.timeline.currentTime
 * @returns {number} the current time in ms
 */
const currTime=()=>{
    const t=$doc.timeline.currentTime
    if('number'===typeof t){
        return t
    }else{
        throw new Error('document.timeline.currentTime is not a number')
    }
}

const /** @type {HTMLElement} */ $controls=byId('controls'),
    /** @type {HTMLElement} */ $cssOutput=byId('css-output'),
    /** @type {HTMLElement} */ $coordOutput=byId('output-coords')

let /** @type {string} */ outputMsgNotDragging=$coordOutput.innerHTML,
    /** @type {!boolean} */ isWindowActive=true

/**
 * Marks the variable isWindowActive as false when the window loses focus
 */
const handleWindowBlur=()=>{
    isWindowActive=false
}
changeEvListener($w, 'blur', handleWindowBlur)

/**
 * Marks the variable isWindowActive as true when the window gains focus
 */
const handleWindowFocus=()=>{
    isWindowActive=true
}
changeEvListener($w, 'focus', handleWindowFocus)

/**
 * Tracks previous mouse position when dragging over $controls
 * @type {![number, number]}
 */
const controlsDragPos=[0,0]
/**
 * Tracks coordinates of the control panel itself (which can't leave the window)
 * Initial values are the computed .left and .top values of $controls
 * @type {![number, number]}
 */
const controlPos=((o)=>[o.left,o.top])($controls.getBoundingClientRect())

// CONTROL PANEL

/**
 * Rounds number to a specified number of decimal places
 * @param {!number} number number to round
 * @param {number} [dp=2] number of decimal places to round to
 * @returns {!number}
 */
const roundToDecimal=(number,dp=2)=>{
    return Math.round(number*(10**dp))/(10**dp)
}

/**
 * Copies the values of src to destination without changing the reference of destination
 * @param {!Array} destination 
 * @param {!Array} src 
 */
const copyArrayTo=(destination, src)=>{
    destination.splice(0,destination.length,...src)
}

/**
 * Extracts [x,y] coordinates from a touch/mouse event
 * @param {MouseEvent | TouchEvent} e 
 * @returns {![number, number]} Array of two coordinates contained in the event
 */

const extractCoordsFromEvent=(e)=>{
    if('touches' in e){
        const {touches, changedTouches} = e
        const touch = touches[0] ?? changedTouches[0]
        return [touch.clientX,touch.clientY]
    }else{
        return [e.clientX, e.clientY]
    }
}
/**
 * Moves coords [x,y] within the range 0<=x<=horizontalMax, 0<=y<=verticalMax
 * @param {![number, number]} coords Array of two numbers representing coordinates
 * @param {!number} horizontalMax 
 * @param {!number} verticalMax 
 * @returns {![number, number]} Array of coordinates
 */
const moveCoordsWithinWindow=(coords, horizontalMax, verticalMax)=>{
    let [/** @type {!number} */ left, /** @type {!number} */ top]=coords
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
 * @param {HTMLElement} $elem Element to attach the drag start listener to
 * @param {!Function} dragStart Function that runs on drag start
 * @param {!Function} dragMove Function that runs on drag move
 * @param {!Function} dragEnd Function that runs on drag end
 */
const setUpDragListeners=($elem, dragStart, dragMove, dragEnd)=>{
    /**
     * Wrapper for dragStart listener
     * @param {Event} e Event for drag start
     */
    const dragStartListener=(e)=>{
        e.preventDefault()
        dragStart.call(this,extractCoordsFromEvent(/** @type {MouseEvent | TouchEvent} */(e)),e)
        changeEvListener($doc, EVENTDRAGMOVE, dragMoveListener)
        changeEvListener($doc, EVENTDRAGEND, dragEndListener)
        changeEvListener($w, 'blur', dragEndListener)
    }
    /**
     * Wrapper for dragMove listener
     * @param {Event} e Event for drag move
     */
    const dragMoveListener=(e)=>{
        e.preventDefault()
        dragMove.call(this, extractCoordsFromEvent(/** @type {MouseEvent | TouchEvent} */(e)),e)
    }
    /**
     * Wrapper for dragEnd listener
     */
    const dragEndListener=()=>{
        if(dragEnd){
            dragEnd.call(this)
        }
        changeEvListener($doc, EVENTDRAGMOVE+' '+EVENTDRAGEND, dragMoveListener, true)
        changeEvListener($w, 'blur', dragEndListener, true)
    }
    changeEvListener($elem, EVENTDRAGSTART, dragStartListener)
}

const /** @type {HTMLElement} */ $controlsDragTrigger=$controls.getElementsByTagName('header')[0]
/**
 * Set up dragging for $controls
 */
setUpDragListeners($controlsDragTrigger, (coords)=>{
    copyArrayTo(controlsDragPos,coords)
    $controls.classList.add('currentlyDragging')
}, (coords)=>{
    // compute new positions based on mouse movement

    controlPos[0] += coords[0] - controlsDragPos[0]
    controlPos[1] += coords[1] - controlsDragPos[1]

    //store old positions
    copyArrayTo(controlsDragPos, coords)

    const [computedLeft, computedTop]=moveCoordsWithinWindow(controlPos,$body.clientWidth-$controls.clientWidth,$body.clientHeight-$controls.clientHeight)

    $controls.style.transform='translate('+computedLeft+'px,'+computedTop+'px)'
},()=>{
    $controls.classList.remove('currentlyDragging')
    copyArrayTo(controlPos,moveCoordsWithinWindow(controlPos,$body.clientWidth-$controls.clientWidth,$body.clientHeight-$controls.clientHeight))
})

const /** @type {HTMLElement} */ $controlTogglePanel=/** @type {HTMLElement} */($controls.getElementsByClassName('toggle-dropdown')[0])
/**
 * Toggles the closed/expanded state of the $controls
 */
const handleControlPanelToggle=()=>{
    $controls.classList.toggle('closed')
}
changeEvListener($controlTogglePanel,'click', handleControlPanelToggle)

const /** @type {HTMLElement} */ $controlsList=$controls.getElementsByTagName('ul')[0]
/**
 * Updates the control panel's CSS height
 * Currently, each child of $controlList contributes 2em to its opened height
 */
const updateControlsHeightCSS=()=>{
    $cssOutput.innerHTML="#controls>ul{max-height:"+($controlsList.childElementCount*2)+"em;}"
}
updateControlsHeightCSS()

const /** @type {HTMLInputElement} */ $controlToggleAnimation=/** @type {HTMLInputElement} */(byId('toggle-animation'))

/**
 * Pauses or unpauses animation
 */
const handleAnimationToggle=()=>{
    if($controlToggleAnimation.checked){
        $w.requestAnimationFrame(animate)
    }else{
        $w.cancelAnimationFrame(currentAnimationFrame) // REDUNDANT WITH if($controlToggleAnimation.checked) in animate()
    }
}
changeEvListener($controlToggleAnimation,'change',handleAnimationToggle)
/**
 * Clears canvas
 */
const clearCanvas=()=>{
    ctx.clearRect(0,0,canvasWidth,canvasHeight)
}

const /** @type {HTMLElement} */ $controlsReset=byId('reset-canvas')
/**
 * Resets canvas
 */
const handleReset=()=>{
    animTick=0
    Object.assign(params,defaultParams)
    currentPhaseSpaceCoords=[params.g/params.k,0,0,0]
    updateParamControls(null)
    clearCanvas()
}
changeEvListener($controlsReset,'click', handleReset)


// CANVAS STUFF

const /** @type {HTMLCanvasElement} */ $canvas=/** @type {HTMLCanvasElement} */(byId('canvas'))
const /** @type {CanvasRenderingContext2D} */ ctx=/** @type {CanvasRenderingContext2D} */($canvas.getContext('2d'))

const /** @type {![number, number]} */ canvasDragPos=[0,0],
    /** @type {![number, number]} */ canvasDragVel=[0,0]
let /** @type {number} */ canvasDragTime,
    /** @type {number} */ canvasDragStopTimeout=0,
    /** @type {number} */ currentAnimationFrame, // stores requestAnimationFrame output for cancelling
    /** @type {!number} */ canvasWidth=0,
    /** @type {!number} */ canvasHeight=0,
    /** @type {!number} */ animTick=0,
    /** @type {number} */ canvasTime=0,
    /** @type {!number} */ timeSinceLastFrame=0

/**
 * Makes sure canvas width and height continue to fill up Window when resizing
 */
const handleResize=()=>{
    canvasWidth=$w.innerWidth
    canvasHeight=$w.innerHeight

    $canvas.width=canvasWidth;
    $canvas.height=canvasHeight;
}

handleResize()
changeEvListener($w, 'resize', handleResize)

/**
 * Adds two arrays termwise
 * @param {!Array<number>} a 
 * @param {!Array<number>} b 
 * @returns {!Array<number>} Result is the same size as a (and should be the same size as b, but isn't checked)
 */
const vectorAdd=(a,b) => a.map((x,i) => x+b[i])
/**
 * Subtracts two arrays termwise
 * @param {!Array<number>} a 
 * @param {!Array<number>} b 
 * @returns {!Array<number>} Result is the same size as a (and should be the same size as b, but isn't checked)
 */
const vectorSubtract=(a,b) => a.map((x,i) => x-b[i])
/**
 * Multiplies array termwise by scalar
 * @param {!number} scalar 
 * @param {!Array<number>} vector 
 * @returns {!Array<number>} same size as vector, with each term multiplied by scalar
 */
const scalarMult=(scalar, vector) => vector.map(x => scalar * x)
/**
 * Sum of termwise squares of array
 * @param {!Array<number>} vector 
 * @returns {!number}
 */
const normSquared=(vector)=>vector.reduce((sumSoFar, x)=>(sumSoFar + x*x),0)

// PENDULUM
/**
 * @typedef {Object} ParamObj
 * @property {number} L0 Rest length
 * @property {number} g Acceleration due to gravity
 * @property {number} k Spring constant per unit mass
 * @property {number} pxPerM Resolution in pixels per meter
 * @property {number} ldc Linear Drag Coefficient
 * @property {number} rBob Radius of pendulum bob
 * @property {number} rPivot Radius of pendulum pivot
 */
const /** @type {ParamObj} */ defaultParams={
    L0: 1,
    g: 9.8,
    k: 3,
    pxPerM: 100,
    ldc: 0.1,
    rBob: 0.15,
    rPivot: 0.15
}
const /** @type {ParamObj} */ params=Object.assign({},defaultParams)

/**
 * Updates the param sliders according to the value of params
 * @param {null | function(string, HTMLInputElement, HTMLInputElement): void} optionalCallback An optional callback, which receieves the param string and the two sibling input elements
 */
const updateParamControls = (optionalCallback)=>{
    for(let /** @type {string} */ label in params){
        if(label){
            let /** @type {Element?} */ $input = $controls.querySelector('[data-param="'+label+'"]'),
                /** @type {ChildNode | null | undefined} */ $sib = $input?.nextSibling
            if($input && $sib && $input instanceof HTMLInputElement && $sib instanceof HTMLInputElement){
                let /** @type {[HTMLInputElement,HTMLInputElement]} */siblingInputs=[$input, $sib]
                siblingInputs.forEach(($elem, i)=>{
                    $elem.value=params[label]
                    if(optionalCallback){
                        optionalCallback(label, $elem, siblingInputs[1-i])
                    }
                })
            }
        }
    }
}
updateParamControls((label, $elem, $sib)=>{
    changeEvListener($elem, 'input', ()=>{
        let val = $elem.value
        params[label] = val
        $sib.value = val
    })
})

const /** @type {!number} */ BOBCLICKAREASCALEFACTOR = 8,
    /** @type {!number} */ MAXDRAGVEL=4

const /** @type {![number, number]} */ pivotCoords=[canvasWidth/(params.pxPerM*2), canvasHeight/(params.pxPerM*6)],
    /** @type {![number, number]} */ pendulumCoords=/** @type {![number, number]} */(vectorAdd(pivotCoords,[0,100/params.pxPerM]))
let /** @type {!boolean} */ currentlyDraggingBob=false,
    /** @type {![number, number, number, number]} */ currentPhaseSpaceCoords=[params.g/params.k,0.1,0,0]

//const sigmoid = (x, max=1, slope=1)=>Math.tanh(x*slope/max)*max

/**
 * Converts pixel left and top offsets to physical polar coodinates 
 * @param {!number} left Left offset in pixels
 * @param {!number} top Top offset in pixels
 * @param {number} [leftVel=0] Time derivative of left offset
 * @param {number} [topVel=0] Time derivative of top offset
 * @returns {![number, number, number, number]}
 */
const pendulumCoordsToPhaseSpace=(left,top, leftVel=0, topVel=0)=>{
    const /** @type {![number, number]} */ diff=/** @type {![number, number]} */(vectorSubtract([left,top], pivotCoords)),
        /** @type {!number} */ magnitude=Math.sqrt(normSquared(diff)),
        /** @type {!number} */ x=magnitude-params.L0,
        /** @type {!number} */ theta=Math.atan2(diff[0],diff[1])
    let /** @type {!number} */ xPrime=0,
        /** @type {!number} */ thetaPrime=0

    if((leftVel || topVel) && magnitude>0){
        const /** @type {!number} */ velNormSquared=leftVel*leftVel + topVel*topVel
        if(velNormSquared > MAXDRAGVEL*MAXDRAGVEL){
            const /** @type {!number} */ factor=MAXDRAGVEL*(velNormSquared**-0.5)
            leftVel *= factor
            topVel *= factor
        }
        thetaPrime=(leftVel*diff[1]-topVel*diff[0])/magnitude
        xPrime=(diff[0]*leftVel+diff[1]*topVel)/magnitude
    }
    return [x, theta, xPrime, thetaPrime]
}

/**
 * Converts physical polar coodinates to pixel left and top offsets
 * @param {!number} x 
 * @param {!number} theta 
 * @param {!number} xPrime 
 * @param {!number} thetaPrime 
 * @returns {![number, number]}
 */
const phaseSpaceToPendulumCoords=(x, theta, xPrime, thetaPrime)=>{
    const /** @type {!number} */ L=params.L0+x
    return /** @type {![number, number]} */(vectorAdd(pivotCoords,scalarMult(L,[Math.sin(theta),Math.cos(theta)])))
}

/**
 * Calculates the (termwise) derivatives of the array [x, theta, xPrime, thetaPrime]
 * @param {!number} x deviation from rest length
 * @param {!number} theta angle with vertical in radians (down is zero, right is positive)
 * @param {!number} xPrime Time derivataive of x
 * @param {!number} thetaPrime Time derivative of theta
 * @returns {![number, number, number, number]}
 */
const pendulumFunction=(x, theta, xPrime, thetaPrime)=>{
    const /** @type {!number} */ l=params.L0+x
        //lthetaPrime2=l*thetaPrime*thetaPrime,
        //v2=xPrime*xPrime+l*lthetaPrime2
    return [
        xPrime, thetaPrime,
        l*thetaPrime*thetaPrime-params.k*x+params.g*Math.cos(theta)-params.ldc*xPrime,
        -(params.g*Math.sin(theta)+2*xPrime*thetaPrime)/l-params.ldc*thetaPrime
    ]
}
/**
 * Uses order-4 Runge-Kutta to compute future coords cuz I'm lazy
 * @param {![number, number, number, number]} curr Array of current polar coordinates and their derivatives wrt time
 * @param {!number} h Timestep
 * @returns {![number, number, number, number]}
 */
const nextStepRK4=(curr,h)=>{
    const /** @type {![number, number, number, number]} */ k1=pendulumFunction(...curr),
        /** @type {![number, number, number, number]} */ k2=pendulumFunction(.../** @type {![number, number, number, number]} */(vectorAdd(curr,scalarMult(h/2,k1)))),
        /** @type {![number, number, number, number]} */ k3=pendulumFunction(.../** @type {![number, number, number, number]} */(vectorAdd(curr,scalarMult(h/2,k2)))),
        /** @type {![number, number, number, number]} */ k4=pendulumFunction(.../** @type {![number, number, number, number]} */(vectorAdd(curr,scalarMult(h,k3))))
    return /** @type {![number, number, number, number]} */(vectorAdd(curr,vectorAdd(scalarMult(h/6,vectorAdd(k1,k4)),scalarMult(h/3,vectorAdd(k2,k3)))))
}

/**
 * Renders one frame of the canvas
 * @param {number} [timeStamp=document.timeline.currentTime] Timeline's current time in ms, passed as parameter by requestAnimationFrame
 */
const animate=(timeStamp=currTime())=>{
    clearCanvas()
    animTick++
    timeSinceLastFrame = Math.min(timeStamp - canvasTime, 30)
    canvasTime = timeStamp
    if(currentlyDraggingBob){
        // no physics calculations, just move the bob to the mouse
        copyArrayTo(pendulumCoords,canvasDragPos)
    }else{
        // compute next step using nextStepRK4
        copyArrayTo(currentPhaseSpaceCoords,nextStepRK4(currentPhaseSpaceCoords,timeSinceLastFrame*1e-3))
        //collision detection
        if(currentPhaseSpaceCoords[0]+params.L0<params.rBob+params.rPivot){
            currentPhaseSpaceCoords[0]=params.rPivot+params.rBob-params.L0
            currentPhaseSpaceCoords[2]=-currentPhaseSpaceCoords[2]
        }
        // convert to cartesian coords
        copyArrayTo(pendulumCoords, phaseSpaceToPendulumCoords(...currentPhaseSpaceCoords))
    }

    //draw and stuff
    ctx.beginPath()
    ctx.scale(params.pxPerM,params.pxPerM)
    ctx.arc(...pivotCoords, params.rPivot, 0, 2*Math.PI)
    ctx.fillStyle='#333'
    ctx.fill()

    ctx.moveTo(...pivotCoords)
    ctx.lineWidth=3/params.pxPerM
    ctx.lineTo(...pendulumCoords)
    ctx.strokeStyle='#333'
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(...pendulumCoords, params.rBob, 0, 2*Math.PI)
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
setUpDragListeners($canvas, (coords)=>{
    copyArrayTo(canvasDragPos,scalarMult(1/params.pxPerM,coords))
    canvasDragTime=currTime()
    if($controlToggleAnimation.checked && normSquared(vectorSubtract(canvasDragPos,pendulumCoords))<=BOBCLICKAREASCALEFACTOR*(params.rBob**2)){ // factor makes it easier to select on mobile by making the "hitbox" larger
        currentlyDraggingBob=true
    }

    $coordOutput.innerHTML=roundToDecimal(canvasDragPos[0])+', '+roundToDecimal(canvasDragPos[1])
},(coords)=>{
    const /** @type {![number, number]} */ posNew=/** @type {![number, number]} */(scalarMult(1/params.pxPerM,coords)),
        /** @type {!number} */ timeDiff=currTime()-canvasDragTime
    canvasDragTime+=timeDiff
    if(timeDiff>0){
        copyArrayTo(canvasDragVel, scalarMult(1e3/timeDiff,vectorSubtract(posNew, canvasDragPos)))
    }
    copyArrayTo(canvasDragPos,posNew)
    clearTimeout(canvasDragStopTimeout)
    canvasDragStopTimeout=setTimeout(()=>{
        copyArrayTo(canvasDragVel,[0,0])
    }, 50)

    $coordOutput.innerHTML=roundToDecimal(canvasDragPos[0])+', '+roundToDecimal(canvasDragPos[1])
},()=>{
    // convert to polar coords
    if(currentlyDraggingBob){
        copyArrayTo(currentPhaseSpaceCoords, pendulumCoordsToPhaseSpace(...canvasDragPos, ...canvasDragVel))
        currentlyDraggingBob=false
    }
    $coordOutput.innerHTML=outputMsgNotDragging
})

})})(window)