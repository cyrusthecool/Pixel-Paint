// JS Paint!
console.log('JS Paint starting...');
// Startup
// create startup variables
// CONSTANTS
const colours = ['black','white','gray','red','green','yellow','blue','purple','brown','orange'];
const canvas = document.createElement('canvas'); canvas.className = 'canvas'
const pen = canvas.getContext('2d');
const colourPallet = document.createElement('div'); colourPallet.className = 'pallet colours'
const toolPallet = document.createElement('div'); toolPallet.className = 'pallet tools'
const tools = [
  {
    name: "Pencil",
    image: "res/pencil.png"
  },
  {
    name: "Eraser",
    image: "res/eraser.png"
  }
]

// history object used to record actions and undo!
const history = {
  actions: [],

  addHistory: function (x, y, oldColour, newColour, activity) {
    // add a new action to history
    this.actions.push(
      {
        x: x,
        y: y,
        oldColour: oldColour,
        newColour: newColour,
        tool: activity
      }
    )
  }
}
// changeable
let canvasWidth = 640; // width in pixels of canvas before scaling
let canvasHeight = 480; // height in pixels of canvas before scaling
let pixelSize = 16; // will be used for css styles to set width and height
let pencilColour = 'black'; // default colour is black, can be changed

//********************* Functions for creating the interface *******************

// create canvas for paint pixels
const makeCanvas = function () {
  // for x,y create a div
  while (canvas.hasChildNode) {
    canvas.removeChild(canvas.firstChild);
  }



  // canvas resolution
  canvas.setAttribute('width',`${ canvasWidth }px`);
  canvas.setAttribute('height',`${ canvasHeight }px`);

  // mouse events
  canvas.addEventListener( 'mousedown', startDraw );
  canvas.addEventListener( 'mouseup', endDraw );

  //touch events
  canvas.addEventListener('touchstart', startDraw, {passive: true});
  canvas.addEventListener('touchend', endDraw, {passive: true});

  // add the canvas to the page
  document.body.prepend( canvas );

  // adjust background image size to scale
  resizeBgGrid();
  window.addEventListener( 'resize' , resizeBgGrid );
};

const resizeBgGrid = function () {

  // check to see if height will be greater than the view size if so, calculate new size using height first
  let newWidth, newHeight, sizeRatio, pixelSizeAdjusted;

  if ( window.innerWidth * 0.75 > window.innerHeight ) {
    // console.log( 'calculating with height', window.innerHeight );
    // calculate new canvas size using height as basis
    sizeRatio = window.innerHeight / canvasHeight;
    pixelSizeAdjusted = Math.floor( sizeRatio * pixelSize );

    newHeight = Math.floor( window.innerHeight / pixelSizeAdjusted / 3 ) * pixelSizeAdjusted * 3; // the 3 allows us to keep a good 4:3 ratio for the canvas.
    newWidth = newHeight / 3 * 4;
  } else {
    // console.log( 'calculating with width', window.innerWidth );
    // calculate new canvas size using width as basis
    sizeRatio = window.innerWidth / canvasWidth;
    pixelSizeAdjusted = Math.floor( sizeRatio * pixelSize );

    newWidth = Math.floor( window.innerWidth / pixelSizeAdjusted / 4 ) * pixelSizeAdjusted * 4; // the 4 allows us to keep a good 4:3 ratio for the canvas.
    newHeight = newWidth * 0.75;
  }

  canvas.style.width = newWidth + "px";
  canvas.style.height = newHeight + "px";

  canvas.style.backgroundSize = pixelSizeAdjusted + "px " + pixelSizeAdjusted + "px";
}

// touch event add/remove Functions
const addTouchStartEvents = function ( touchEvent ) {
  console.log( touchEvent );
  this.addEventListener( 'touchmove', touchCoordsDrag )
}

const removeTouchEndEvents = function () {
  this.removeEventListener( 'touchmove', touchCoordsDrag )
}

// create a colour pallet
const makeColourPallet = function () {
  colourPallet.setAttribute("draggable", true); // to be used to allow someone to drag pallet arround;
  colourPallet.addEventListener("mouseup", endDraw ); // used to make sure endDraw is fired if mouse let go on pallet

  colourPallet.addEventListener( "drag", dragPallet );
  colourPallet.addEventListener( "dragstart", startingDrag );

  // touch move
  colourPallet.addEventListener('touchstart', addTouchStartEvents, {passive: true});
  colourPallet.addEventListener('touchend', removeTouchEndEvents, {passive: true});

  for ( let i = 0; i < colours.length; i++ ) {
    const palletColour = document.createElement( 'div' );
    palletColour.style.backgroundColor = colours[i];
    palletColour.addEventListener( 'click', setPencilColour );
    palletColour.className = 'palletColour ';
    colourPallet.appendChild( palletColour );
  }

  document.body.appendChild( colourPallet );
};

// used to make tool pallet
const makeToolPallet = function () {
  toolPallet.setAttribute( "draggable", true ); // to be used to allow someone to drag pallet arround;
  toolPallet.addEventListener( "mouseup", endDraw ); // used to make sure endDraw is fired if mouse let go on pallet

  toolPallet.addEventListener( "drag", dragPallet );
  toolPallet.addEventListener( "dragstart", startingDrag );

  // touch move
  toolPallet.addEventListener('touchstart', addTouchStartEvents, {passive: true});
  toolPallet.addEventListener('touchend', removeTouchEndEvents, {passive: true});

  for ( let i = 0; i < tools.length; i++ ) {
    const tool = document.createElement( 'div' );
    tool.style.background = `url(${tools[i].image})`;
    tool.style.backgroundSize = "cover";
    tool.setAttribute( 'data-id', i );
    tool.addEventListener( 'click', selectTool );
    tool.className = 'palletColour';
    toolPallet.appendChild( tool );
  }

  document.body.appendChild( toolPallet );
}



//********************* Functions for actions *******************

// function for evenet listener on mousedown -- starts drawing a line
const startDraw = function ( el ) {
  drawPixel( el );

  // add event listners to draw pixel when moving mouse or touch
  canvas.addEventListener( 'mousemove', drawPixel );
  canvas.addEventListener( 'touchmove', touchCoordsPaint, {passive: true} );
}

// function for evenet listener on mousedown -- ends drawing a line
const endDraw = function () {
  canvas.removeEventListener( 'mousemove', drawPixel );
  canvas.removeEventListener( 'touchmove', touchCoordsPaint, {passive: true} );
}




// function to set our new pencil colour when selected
const setPencilColour = function ( el ) {
  console.log( 'changing pencil colour?' );
  pencilColour = this.style.backgroundColor; // "this" refers to a palletColour div.
}

// math to normalise mouse input to canvas regardless of scaling
const normaliseMouseInput = function ( pos, size, unScaledRes, clientRes ) {
  return ( Math.ceil( pos / size / clientRes * unScaledRes ) * size ) - size;
}

// used for touch move event only!
const touchCoordsPaint = function ( touchEvent ) {
  drawPixel( touchEvent.touches[0] );
}

// used for moving pallets only!
const touchCoordsDrag = function ( touchEvent ) {
  dragPallet( touchEvent.touches[0] );
  console.log ( touchEvent );
}

// tool select function
const selectTool = function () {
  const tool = tools[ this.getAttribute( 'data-id' ) ];
  console.log('changing tool');
  console.log(tool);
  switch ( tool.name ) {
    case "Eraser":
      pencilColour = 'rgba(0, 0, 0, 0)';
      break;
    default:
      pencilColour = 'black';
  }
}

let dragOffset = {x: 0, y:0};

const startingDrag = function ( ev ) {
  let offset = ev.target.getBoundingClientRect()

  dragOffset.x = ev.clientX - offset.left;
  dragOffset.y = ev.clientY - offset.top;
}

// function for dragging pallets!
const dragPallet = function (ev) {
  // don't do anything if the x and y are 0
  if (ev.clientX === 0 && ev.clientY === 0) {
    return;
  }

  //console.log(ev);
  // new box position needs to be cursor position - difference between box and cursor;
  let newX = ev.clientX - dragOffset.x
  let newY = ev.clientY - dragOffset.y

  ev.target.style.left = newX + "px";
  ev.target.style.top = newY + "px";

  //console.log( offset );

}

// make our changes to the canvas!
const drawPixel = function( el, size = 16) { //default pixel size is 16 screen pixels
  let x = el.pageX;
  let y = el.pageY;

  // console.log( 'woot, drawing! x:',x,'y:',y);
  // reset pencil space and setup pencil
  pen.beginPath();
  pen.fillStyle = pencilColour;
  pen.lineHeight = 0;

  // adjust cursor y coords to include any offset caused during centering
  y = y-canvas.getBoundingClientRect().top
  x = x-canvas.getBoundingClientRect().left
  // normalize input so we only draw in 'pixels';
  x = normaliseMouseInput( x, size, canvasWidth, canvas.clientWidth );
  y = normaliseMouseInput( y, size, canvasHeight, canvas.clientHeight );

  // draw pixel or clear it
  if ( pencilColour === 'rgba(0, 0, 0, 0)' ) {
   pen.clearRect(x,y,size,size);
  }
  else {
   pen.fillRect(x,y,size,size);
  }

  return {
   x: x,
   y: y
  };
};

makeCanvas();
makeColourPallet();
makeToolPallet();
