// jQuery selectors
var options = $('.options');
var paperSize = $('[name="paper-size"]', options);
var orientation = $('[name="paper-orientation"]', options);
var imageCount = $('[name="image-count"]', options);
var imageSize = $('[name="image-size"]', options);
var imagePadding = $('[name="image-padding"]', options);
var customImageSize = $('.custom-image-size', options);

var preview = $('.preview');
var page = $('.print-page');

setupCanvas();

// Reapply settings
$('[name="apply"]', options).on("click", function () {
  setupCanvas();
});

$('[name="print"]', options).on("click", function () {
  convertStylingToMm();
  $('#print-media').html(`
      size: ${ paperSize.val() } ${ orientation.val() };
  `);
  window.print();
});



// Custom Image Sizes
customImageSize.hide();
imageSize.on("change", function () {
  var self = $(this);
  if (self.val() == "custom") {
    customImageSize.show();
  } else {
    customImageSize.hide();
  }
});

// Build Preview
function setupCanvas () {

  var pageWidth;
  var pageHeight;

  console.log("");
  console.log("Setting up");
  console.log("Page is landscape:" + isLandscape());


  // Page Orientation and height
  if (isLandscape()) {
    pageWidth = preview.width() * 0.5;
    pageHeight = pageWidth * getPaperRatio(paperSize.val(), "landscape");
    setImageCount(imageCount.val());
    setImageSize(getPixelSizeInMm(pageHeight));
  } else {
    pageHeight = preview.height() * 0.9;
    pageWidth = pageHeight * getPaperRatio(paperSize.val(), "portrait");
    setImageCount(imageCount.val());
    setImageSize(getPixelSizeInMm(pageWidth));
  }

  console.log("height", pageHeight, "width", pageWidth);
  page.css("height", pageHeight);
  page.css("width", pageWidth);

  console.log("");

}

function isLandscape () {
  if (orientation.val() == "landscape") {
    return true;
  } else {
    return false;
  }
}

function setImageSize (mm) {

  var imageHeight;
  var imageWidth;

  console.log("Image size: ", imageSize.val());
  switch (imageSize.val()) {
    case "6x4":
    imageWidth = 150;
    imageHeight =  100;
    break;

    case "6x4.5":
    imageWidth = 150;
    imageHeight = 110;
    break;

    case "5x3.75":
    imageWidth = 130;
    imageHeight = 90;
    break;

    case "3x2":
    imageWidth = 76;
    imageHeight = 51;
    break;

    case "custom":
    break;
  }

  console.log("One mm is ", mm, "pixels");
  console.log("image: ", imageWidth, "x", imageHeight);

  $('.print-image', page).css("width", imageWidth * mm)
  .css("min-width", imageWidth * mm)
  .css("max-width", imageWidth * mm)
  .css("height", imageHeight * mm)
  .css("min-height", imageHeight * mm)
  .css("max-height", imageHeight * mm)
  .css("margin", imagePadding.val() * mm);

}


function setImageCount (amount) {

  var imageElement = `
    <div class="print-image placeholder">
      <img class="print-image-source" />
      <i class="fa fa-plus upload" />
    </div>
  `;

  page.empty();
  console.log("Amount", amount);
  for (var i = 0; i < amount; i++) {
    page.append(imageElement);
  }

  $('.print-image', page).each(function () {
    // Update the drop zone class on drag enter/leave
    $(this).bind('dragenter', function(ev) {
        $(ev.target).addClass('dragover');
        return false;
    })
    .bind('dragleave', function(ev) {
        $(ev.target).removeClass('dragover');
        return false;
    })

    // Allow drops of any kind into the zone.
    .bind('dragover', function(ev) {
      return false;
    })

    // Handle the final drop...
    .bind('drop', function(ev) {
      console.log(ev);
      var e = ev.originalEvent;
      if (e.preventDefault) e.preventDefault(); // stops the browser from redirecting off to the text.

      if (e.dataTransfer.types) {
        // For each data type
        [].forEach.call(e.dataTransfer.types, function (type) {
          if (type == "text/plain") {
            var url = e.dataTransfer.getData(type);
            console.log("dragged", url, type);
            setImageFromUrl(ev.target, url);
          }
        });
      }

      return false;
    });
  });
}

function setImageFromUrl (place, url) {

  $(place).removeClass("dragover placeholder");
  $('.print-image-source', place).attr("src", url);
}

function getPixelSizeInMm (pixelHeight) {
  var paperFormat = paperSize.val();
  var paperHeight;
  switch (paperFormat) {
    case "A4":
    paperHeight = 210;
    break;

    case "A5":
    paperHeight = 148;
    break;
  }

  console.log("Page is ", pixelHeight, "tall. Paper is ", paperHeight, "mm");

  return pixelHeight / paperHeight;
}

function getPaperRatio (size, orientation, paperWidth = 0, paperHeight = 0) {

  // Sizes are in mm
  switch (size) {
    case "A4":
    paperHeight = 210;
    paperWidth = 297;
    break;

    case "A5":
    paperHeight = 148;
    paperWidth = 210;
    break;
  }

  return paperHeight / paperWidth;

}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  console.dir(ev);
  var data = ev.originalEvent.dataTransfer;
  //console.log("Recieved data", data, data.dropEffect, data.types, data.files);
  //ev.target.appendChild(document.getElementById(data));
}











/// Printing
function convertStylingToMm () {
  console.log("Converting styling to mm");
  setPageToMm();
  setImagesToMm();
}

function setImagesToMm () {
  switch (imageSize.val()) {
    case "6x4":
    imageWidth = 150;
    imageHeight =  100;
    break;

    case "6x4.5":
    imageWidth = 150;
    imageHeight = 110;
    break;

    case "5x3.75":
    imageWidth = 130;
    imageHeight = 90;
    break;

    case "3x2":
    imageWidth = 76;
    imageHeight = 51;
    break;

    case "custom":
    break;
  }

  $('.print-image', page).css("width", imageWidth  + "mm")
  .css("min-width", imageWidth  + "mm")
  .css("max-width", imageWidth  + "mm")
  .css("height", imageHeight  + "mm")
  .css("min-height", imageHeight  + "mm")
  .css("max-height", imageHeight  + "mm")
  .css("margin", imagePadding.val());
}

function setPageToMm () {
  var paperWidth;
  var paperHeight;

  switch (paperSize.val()) {
    case "A4":
    paperHeight = 210;
    paperWidth = 297;
    break;

    case "A5":
    paperHeight = 148;
    paperWidth = 210;
    break;
  }

  if (!isLandscape()) {
    page.css("height", paperWidth  + "mm");
    page.css("width", paperHeight  + "mm");
  } else {
    page.css("height", paperHeight  + "mm");
    page.css("width", paperWidth + "mm");
  }
}
