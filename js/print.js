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

var images = [];

applySettings();
ga('send', 'pageview', 'print-preview.html');

// Reapply settings
$('[name="apply"]', options).on("click", function () {
  setupCanvas();
});

$('[name="print"]', options).on("click", function () {
  ga('send', 'event', "Settings", "print");
  convertStylingToMm();
  $('#print-media').html(`
      size: ${ paperSize.val() } ${ orientation.val() };
  `);
  window.print();
});

$('[name="help"]', options).on("click", function () {
   console.log("opening help");
   chrome.extension.sendRequest({action:"help"});
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
    pageWidth = preview.width() * 0.9;
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

  applyImages();
  saveSettings();

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
  .css("max-height", imageHeight * mm)
  .css("min-height", imageHeight * mm)
  .css("margin", imagePadding.val() * mm);

}


function setImageCount (amount) {


  page.empty();
  console.log("Amount", amount);
  for (var i = 0; i < amount; i++) {
     var imageElement = `
     <div class="print-image placeholder">
     <img class="print-image-source" />
     <label for="fileUploadInput${i}" class="file-upload"></label>
     <input id="fileUploadInput${i}" class="fileUpload" type="file" accept="image/*" />
     <i class="fa fa-plus upload" />
     </div>
     `;
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
      var imageUrl = false;
      if (e.preventDefault) e.preventDefault(); // stops the browser from redirecting off to the text.

      if (e.dataTransfer.types) {
        // For each data type
        [].forEach.call(e.dataTransfer.types, function (type) {
          if (type == "text/plain") {
            var url = e.dataTransfer.getData(type);
            console.log("dragged", url, type);
            if (checkURL(url)) {
               images.push(url);
               saveImages();
               setImageFromUrl(ev.target, url);
               imageUrl = true;
               return;
            }
         }
        });
        if (!imageUrl) {
           alert("You must drag images directly.");
           $(ev.target).removeClass('dragover');
        }
      }

      return false;
    });

   // $(this).on("click", function () {
   //    let placeHolder = $(this);
   //    console.log("clicked", placeHolder.hasClass("placeholder"))
   //    if (placeHolder.hasClass("placeHolder")) {
   //       $(".fileUpload", placeHolder).trigger('click');
   //    }
   // });

   $(".fileUpload", $(this)).on("change", function (e) {
      var fileInput = $(this)[0];
      var file = fileInput.files[0];
      var url;
      console.log("uploading", file);

      if (file) {
         // console.log("uploaded", $(this)[0].parentElement);
         url = URL.createObjectURL(e.target.files[0]);
         images.push(url);
         saveImages();
         setImageFromUrl($(this)[0].parentElement, url);
     }

   });

  });
}

function checkURL(url) {
    return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

function setImageFromUrl (place, url) {

  place = $(place);
  place.removeClass("dragover placeholder");
  var image = $('.print-image-source', place);
  // rotate image
  getImageMeta(url, function (width, height) {

    if (width < height) {
      var orgHeight = image.parent().height();
      var orgWidth = image.parent().width();
      if ($('[name=rotate-image]:checked', options).val() == "rotate-placeholder") {
        // Landscape to portrait
        console.log("Portrait picture, animating", image.parent());
        image.parent().animate({
          'height': orgWidth,
          'min-height': orgWidth,
          'max-height': orgWidth,
          'width': orgHeight,
          'min-width': orgHeight,
          'max-width': orgHeight
        }, 500, function () {
          image.addClass("print-image-source-landscape");
          image.attr("src", url);
        });
      } else {
        // Portrait to Landscape
        if (image.height < orgWidth) {
          image.css("width", orgHeight + "px");
        } else {
          image.css("height", orgWidth + "px");
        }
        image.attr("src", url);
        image.css("position", "relative");
        image.css("bottom", "0px");
        image.addClass("print-image-source-portrait");
      }
    } else {
      console.log("Landscape picture");
      image.attr("src", url);
      image.addClass("print-image-source-landscape");
    }

  });

  place.on("click", function () {
    if (!place.hasClass("placeholder")) {
      ga('send', 'event', "Image", "removed");
      place.addClass("placeholder");
      var removeIndex = images.indexOf(image.attr("src"));
      console.log("Removing index", removeIndex, "from", images);
      images.splice(removeIndex, 1);
      console.log("images", images);
      image.attr("src", url);
      saveImages();
    }
  });
}

function getImageMeta(url, callback) {
    var img = new Image();
    img.src = url;
    img.onload = function() { callback(this.width, this.height); }
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

function saveImages () {
  console.log("Saving images", images);
  chrome.extension.sendRequest(
    {action:"save", saveName:"images", saveContent: images},
    function(response){
      console.log("Save response:", response);
    });

}

function loadImages () {
  chrome.extension.sendRequest({action: "load", load:"images"}, function (response) {
     console.log("loading images", response);
    if (response.loaded && response.loaded.images) {
      console.log("Loading images", response);
      images = response.loaded.images;
      applyImages();
   }
  });


}

function applyImages () {
  console.log("Applying images");
  $('.print-image-source').each(function (index) {
      var image = images[index];
      if (image) {
        console.log($(this), this);
        setImageFromUrl($(this).parent(), image);
      }
  });
}

function saveSettings () {

  var printSettings = {
      'paperSize': paperSize.val(),
      'paperOrientation': orientation.val(),
      'imageCount': imageCount.val(),
      'imageSize': imageSize.val(),
      'imagePadding': imagePadding.val()
    }

  chrome.extension.sendRequest({action:"save", saveName: "printSettings", saveContent: printSettings}, function(response){
    console.log("Save response:", response);
  });

}

function applySettings () {

  ga('send', 'event', "Settings", "updated");
  chrome.extension.sendRequest({action: "load", load:"printSettings"}, function (response) {

        if (response.loaded && Object.keys(response.loaded).length !== 0) {
          console.log("Recovered settings", response);
          var result = response.loaded.printSettings;
          result.paperSize ? $('option[value="' + result.paperSize + '"]', paperSize).attr("selected",true) : "";
          result.paperOrientation ? $('option[value="' + result.paperOrientation + '"]', orientation).attr("selected",true) : "";
          result.imageCount ? imageCount.val(result.imageCount) : "";
          result.imageSize ? $('option[value="' + result.imageSize + '"]', imageSize).attr("selected",true) : "";
          result.imagePadding ? imagePadding.val(result.imagePadding) : "";
        } else {
          console.log("No settings saved");
        }

        setupCanvas();
        loadImages();
  });

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

  // Portrait images
   $('.print-image-source-portrait', page).each(function () {
     var imageElement = $(this);
     if (imageElement.height < imageElement.width) {
       imageElement.css("width", imageHeight + "mm");
     } else {
       imageElement.css("height", imageWidth + "mm");
     }
   });
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
