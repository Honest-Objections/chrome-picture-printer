// jQuery selectors
var options = $('.options');
var paperSize = $('[name="paper-size"]', options);
var orientation = $('[name="paper-orientation"]', options);

var preview = $('.preview');
var page = $('.print-page');

console.log("Setting up");
setupCanvas();

function setupCanvas () {

  var pageWidth;
  var pageHeight;

  console.log("Page is landscape:" + isLandscape());

  if (isLandscape()) {
    pageWidth = preview.width() * 0.9;
    pageHeight = pageWidth * getPaperRatio(paperSize.val(), "landsape");
  } else {
    pageHeight = preview.height() * 0.9;
    pageWidth = pageHeight * getPaperRatio(paperSize.val(), "portrait");
  }

  page.css("height", pageHeight);
  page.css("width", pageWidth);


}

function isLandscape () {
  if (orientation.val() == "landscape") {
    return true;
  } else {
    return false;
  }
}

function setImageSize (width, height) {

}

function setImageCount (amount) {

  var imageElement = `
    <div class="print-image" ondrop="drop(event)" ondragover="allowDrop(event)">
    </div>
  `
}

function getPaperRatio (size, orientation, paperWidth = 0, paperHeight = 0) {

  // Sizes are in mm
  switch (size) {
    case "A4":
    paperHeight = 210;
    paperWidth = 297;
    break;

    case "A5":
    paperHeight = 210;
    paperWidth = 148;
    break;
  }

  if (orientation == "portrait") {
    return paperHeight / paperWidth;
  } else {
    return paperWidth / paperHeight;
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  ev.target.appendChild(document.getElementById(data));
}
