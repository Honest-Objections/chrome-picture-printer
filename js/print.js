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
var paper = {
  "A4": {
    height:210,
    width:297
  },
  "A5": {
    height:148,
    width:210
  },
  "US Letter": {
    height:216,
    width:279,
  },
  "US Half Letter": {
    height:140,
    width:216,
  },
  "US Legal": {
    height:216,
    width:356,
  },
  "US Junior Legal": {
    height:127,
    width:203,
  }
};

applySettings();
ga('send', 'pageview', 'print-preview.html');

// Reapply settings
$('[name="apply"]', options).on("click", function () {
  setupCanvas();
});

// When user clicks print
$('[name="print"]', options).on("click", function () {
  ga('send', 'event', "Settings", "print");
  convertStylingToMm();
  $('#print-media').html(`
      size: ${ paperSize.val() } ${ orientation.val() };
  `);
  window.print();
});

// When user clicks help
$('[name="help"]', options).on("click", function () {
   chrome.extension.sendRequest({action:"help"});
});

// Fill options with paper types
for(paperType in paper) {
   var opt = document.createElement("option");
   opt.value= paperType;
   opt.innerHTML = paperType;
   $('[name="paper-size"]', options).append(opt);
}

// Custom Image Sizes
customImageSize.hide();
imageSize.on("change", function () {
  var self = $(this);
  if (self.val() == "custom_in" || self.val() == "custom_cm") {
    customImageSize.show();
  } else {
    customImageSize.hide();
  }
});

// Build Preview
function setupCanvas () {

  var pageWidth;
  var pageHeight;

  // Page Orientation and height
  if (isLandscape()) {
    pageWidth = preview.width > 1300 ? preview.width() * 0.9 : preview.width() * 0.6;
    pageHeight = pageWidth * getPaperRatio();
    setImageCount(imageCount.val());
    setImageSize(getPixelSizeInMm(pageHeight));
  } else {
    pageHeight = preview.height() * 0.9;
    pageWidth = pageHeight * getPaperRatio();
    setImageCount(imageCount.val());
    setImageSize(getPixelSizeInMm(pageWidth));
  }

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

  switch (imageSize.val()) {
    case "6x4":
    imageWidth = 6 * 25.4;
    imageHeight =  4 * 25.4;
    break;

    case "6x4.5":
    imageWidth = 6 * 25.4;
    imageHeight = 4.5 * 25.4;
    break;

    case "5x3.75":
    imageWidth = 5 * 25.4;
    imageHeight = 3.75 * 25.4;
    break;

    case "3x2":
    imageWidth = 3 * 25.4;
    imageHeight = 2  * 25.4;
    break;

    case "custom_in":
    imageWidth = $('.custom-image-size [name="width"]').val() * 25.4;
    imageHeight = $('.custom-image-size [name="height"]').val()  * 25.4;
    break;

    case "custom_cm":
    imageWidth = $('.custom-image-size [name="width"]').val() * 10;
    imageHeight = $('.custom-image-size [name="height"]').val() * 10;
    break;
  }

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
        var placeholder = $(ev.target);
        if (placeholder.hasClass("placeholder")) placeholder.addClass('dragover');
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
      var e = ev.originalEvent;
      var imageUrl = false;

      // If placeholder
      if ($(ev.target).hasClass("placeholder")) {

        if (e.preventDefault) e.preventDefault(); // stops the browser from redirecting off to the text.

        if (e.dataTransfer.types) {
          // For each data type
          [].forEach.call(e.dataTransfer.types, function (type) {
            if (type == "text/plain") {
              var url = e.dataTransfer.getData(type);
              if (!checkURL(url)) {
                alert("The link dragged probably won't load. \nTry right clicking and \"Open image in new tab\", then drag that.");
                ga('send', 'event', "Image", "failed", "dragged");
              } else {
                ga('send', 'event', "Image", "added", "dragged");
              }
             images.push(url);
             saveImages();
             setImageFromUrl(ev.target, url);
             $(ev.target).removeClass('dragover');
             return;
           }
          });
        }

      }
      return false;
    });

   $(".fileUpload", $(this)).on("change", function (e) {
      var fileInput = $(this)[0];
      var file = fileInput.files[0];
      var url;

      if (file) {
         url = URL.createObjectURL(e.target.files[0]);
         images.push(url);
         saveImages();
         setImageFromUrl($(this)[0].parentElement, url);
         ga('send', 'event', "Image", "added", "uploaded");
     }

   });

  });
}

function checkURL(url) {
  // Check direct image URL
  let valid = (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
  // Check if Google Photos
  if (!valid) valid = (url.match(/googleusercontent/) != null);

  return valid;
}

function rotateImage (image) {
  var orgHeight = image.parent().height();
  var orgWidth = image.parent().width();

  image.removeAttr("style");

    // Portrait to Landscape
    if (image.height < orgWidth) {
      image.css("width", orgHeight + "px");
    } else {
      image.css("height", orgWidth + "px");
    }
    image.css("position", "relative");
    image.css("bottom", "0px");
    image.addClass("print-image-source-portrait");
}

function rotatePlaceholder (image) {
  var orgHeight = image.parent().height();
  var orgWidth = image.parent().width();

  // Landscape to portrait
  image.parent().animate({
    'height': orgWidth,
    'min-height': orgWidth,
    'max-height': orgWidth,
    'width': orgHeight,
    'min-width': orgHeight,
    'max-width': orgHeight
  }, 500, function () {
    image.addClass("print-image-source-landscape");
  });
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
        rotatePlaceholder(image);
      } else {
        rotateImage(image);
      }
    } else {
      image.addClass("print-image-source-landscape");
    }
    image.attr("src", url);

  });

  place.on("click", function () {
    if (!place.hasClass("placeholder")) {
      ga('send', 'event', "Image", "removed");
      place.addClass("placeholder");
      $('.print-image-source', place).removeClass("print-image-source-landscape print-image-source-portrait").removeAttr("style");
      var removeIndex = images.indexOf(image.attr("src"));
      images.splice(removeIndex, 1);
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
  return pixelHeight / paper[paperSize.val()].height;
}

function getPaperRatio () {
  return paper[paperSize.val()].height / paper[paperSize.val()].width;
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  var data = ev.originalEvent.dataTransfer;
  //ev.target.appendChild(document.getElementById(data));
}

function saveImages () {
  chrome.extension.sendRequest(
    {action:"save", saveName:"images", saveContent: images},
    function(response){
    });

}

function loadImages () {
  chrome.extension.sendRequest({action: "load", load:"images"}, function (response) {
    if (response.loaded && response.loaded.images) {
      images = response.loaded.images;
      applyImages();
   }
  });
}

function applyImages () {
  $('.print-image-source').each(function (index) {
      var image = images[index];
      if (image) {
        setImageFromUrl($(this).parent(), image);
      }
  });

  $('.print-image-source-portrait').each(function () {
    rotateImage($(this));
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

  chrome.extension.sendRequest({action:"save", saveName: "printSettings", saveContent: printSettings}, function(response){});

}

function applySettings () {
  ga('send', 'event', "Settings", "updated");
  chrome.extension.sendRequest({action: "load", load:"printSettings"}, function (response) {

        if (response.loaded && Object.keys(response.loaded).length !== 0) {
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
  setPageToMm();
  setImagesToMm();
}

function setImagesToMm () {
  switch (imageSize.val()) {
    case "6x4":
    imageWidth = 6 * 25.4;
    imageHeight =  4 * 25.4;
    break;

    case "6x4.5":
    imageWidth = 6 * 25.4;
    imageHeight = 4.5 * 25.4;
    break;

    case "5x3.75":
    imageWidth = 5 * 25.4;
    imageHeight = 3.75 * 25.4;
    break;

    case "3x2":
    imageWidth = 3 * 25.4;
    imageHeight = 2  * 25.4;
    break;

    case "custom_in":
    imageWidth = $('.custom-image-size [name="width"]').val() * 25.4;
    imageHeight = $('.custom-image-size [name="height"]').val()  * 25.4;
    break;

    case "custom_cm":
    imageWidth = $('.custom-image-size [name="width"]').val() * 10;
    imageHeight = $('.custom-image-size [name="height"]').val() * 10;
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
  let selectedPaper = paper[paperSize.val()];

  if (!isLandscape()) {
    page.css("height", selectedPaper.width  + "mm");
    page.css("width", selectedPaper.height  + "mm");
  } else {
    page.css("height", selectedPaper.height  + "mm");
    page.css("width", selectedPaper.width + "mm");
  }
}
