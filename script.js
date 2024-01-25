(function(global, factory){global.onload=factory})(typeof window!=='undefined'?window:this, function(globalLoadEvent){'use strict';

const $w=globalLoadEvent.currentTarget,
    $doc=window.document,
    $body=$doc.body



const HASTOUCHEVENTS = typeof $w.ontouchstart!=='undefined'

let $controls=$doc.getElementById('controls')

let $controlsDragTrigger=$controls.getElementsByTagName('header')[0]
let $controlTogglePanel=$controls.getElementsByClassName('toggle-dropdown')[0]
let $controlToggleAnimation=$controls.getElementsByClassName('toggle-animation')[0]

let dragPos=[0,0]
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

let currentAnimationFrame,
    animationEnabled=true

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
 * Event listener for events that trigger $controls dragging
 * @param {Event} e 
 */
let handleControlsDragStart=function(e){
    e=e||windows.event
    e.preventDefault()

    dragPos = extractCoordsFromEvent(e)

    $controls.classList.add('currentlyDragging')

    $doc.addEventListener(EVENTDRAGEND, handleControlsDragEnd)
    $w.addEventListener('blur', handleControlsDragEnd)
    $doc.addEventListener(EVENTDRAGMOVE, handleControlsDragMove)
}

$controlsDragTrigger.addEventListener(EVENTDRAGSTART, handleControlsDragStart)

/**
 * Event listener for move events during $controls dragging.
 * @param {Event} e
 */

let handleControlsDragMove=function(e){
    e=e||windows.event

    let [x,y]=extractCoordsFromEvent(e),
        computedLeft,
        computedTop

    // compute new positions based on mouse movement

    controlPos[0]=controlPos[0] + x - dragPos[0]
    controlPos[1]=controlPos[1] + y - dragPos[1]

    //store old positions

    dragPos[0]=x
    dragPos[1]=y

    //$controlsDragTrigger.innerHTML=dragPos[0]+', '+dragPos[1]

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


}

/**
 * Event listener for events at the end of $controls dragging
 */
let handleControlsDragEnd=function(){
    $controls.classList.remove('currentlyDragging')
    $doc.removeEventListener(EVENTDRAGEND, handleControlsDragEnd)
    $w.removeEventListener('blur', handleControlsDragEnd)
    $doc.removeEventListener(EVENTDRAGMOVE, handleControlsDragMove)
}

let handleControlPanelToggle=function(){
    $controls.classList.toggle('closed')
}

$controlTogglePanel.addEventListener('click', handleControlPanelToggle)

let handleAnimationToggle=function(e){
    if(animationEnabled){
        animationEnabled=false
        $w.cancelAnimationFrame(currentAnimationFrame)
    }else{
        animationEnabled=true
        $w.requestAnimationFrame(animate)
    }
}

$controlToggleAnimation.addEventListener('change',handleAnimationToggle)









// CANVAS STUFF

var handleResize=function(){
    width=$w.innerWidth;

}

var animate=function(){
    currentAnimationFrame=$w.requestAnimationFrame(animate)
}











})