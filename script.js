(function($w){
const $doc=$w.document,
    $body=$doc.body
let $controls=$doc.getElementById('control-panel')
let $canvas=$doc.getElementById('canvas')

let $controlsDragTrigger=$controls.getElementsByTagName('header')[0]

let dragPos=[0,0]
let controlPos=[$controls.offsetLeft,$controls.offsetTop]

/**
 * Event listener for events that trigger $controls dragging
 * @param {Event} e 
 */
let handleControlsDragStart=function(e){
    e=e||windows.event
    e.preventDefault()
    dragPos[0]=e.clientX
    dragPos[1]=e.clientY
    $controls.classList.add('currentlyDragging')

    $doc.addEventListener('mouseup', handleControlsDragEnd)
    $w.addEventListener('blur', handleControlsDragEnd)
    $doc.addEventListener('mousemove', handleControlsDragMove)
}

$controlsDragTrigger.addEventListener('mousedown', handleControlsDragStart)

/**
 * Event listener for move events during $controls dragging.
 * @param {Event} e
 */

let handleControlsDragMove=function(e){
    e=e||windows.event
    e.preventDefault()

    controlPos[0]=controlPos[0] + e.clientX - dragPos[0]
    controlPos[1]=controlPos[1] + e.clientY - dragPos[1]

    dragPos[0]=e.clientX
    dragPos[1]=e.clientY

    //$controlsDragTrigger.innerHTML=dragPos[0]+', '+dragPos[1]

    if(controlPos[0] > 0 && controlPos[0] + $controls.clientWidth <= $body.clientWidth){
        $controls.style.left=controlPos[0] + 'px'
    }else if(controlPos[0] < 0){
        $controls.style.left='0'
    }else if(controlPos[0] + $controls.clientWidth > $body.clientWidth){
        $controls.style.left=($body.clientWidth-$controls.clientWidth) + 'px'
    }
    if(controlPos[1] > 0 && controlPos[1] + $controls.clientHeight <= $body.clientHeight){
        $controls.style.top=controlPos[1] + 'px'
    }else if(controlPos[1] < 0){
        $controls.style.top='0'
    }else if(controlPos[1] + $controls.clientHeight > $body.clientHeight){
        $controls.style.top=($body.clientHeight-$controls.clientHeight) + 'px'
    }
}

/**
 * Event listener for events at the end of $controls dragging
 */
let handleControlsDragEnd=function(){
    $controls.classList.remove('currentlyDragging')
    $doc.removeEventListener('mouseup', handleControlsDragEnd)
    $w.removeEventListener('blur', handleControlsDragEnd)
    $doc.removeEventListener('mousemove', handleControlsDragMove)
}











})(window)