let uplaodButton = document.getElementById("uploadImage");
let selectImage = document.getElementById("selectImage");
let form = document.forms['upload'];
let imageDatabase = "images"
let tagsDatabase = "tags"
let uploadedImages = document.getElementById("uploadedImages");

let usernameCloudant = "d1c15183-3145-4030-96de-321c2a4a5e55-bluemix"
let passwordCloudant = "943b00d7cae872e8271a4d70e80858bd186028d1ee63275905e9980a59b4f3f6"

const cloudantURL = new URL("https://" + usernameCloudant + ":" + passwordCloudant + "@" + usernameCloudant + ".cloudant.com");

function uploadImage() {
  var image = selectImage.files[0];
  // name is .name, type is .type
  var fileReader = new FileReader();
  fileReader.readAsDataURL(selectImage.files[0]);
  fileReader.onload = function (readerEvent) {
    // base64 encoded
    // console.log(readerEvent.target.result.split(',')[1])
    var cloudantDocument = {
      "name": image.name,
      "_attachments": {}
    };
    var attachment = {}
    attachment.content_type = image.type
    attachment.data = readerEvent.target.result.split(',')[1]
    cloudantDocument._attachments.image = attachment
    console.log(cloudantDocument);
    loadImageToBrowser(cloudantDocument, selectImage.files[0]);
  }
}

function loadImageToBrowser(doc, imageToLoad) {
  var fileReader = new FileReader();
  var image = new Image();

  var imageSection = document.createElement('div');
  var imageHolder = document.createElement('div');
  imageSection.className = "imageSection"
  imageHolder.className = "imageHolder"
  fileReader.readAsDataURL(imageToLoad);
  fileReader.onload = function (readerEvent) {
    image.src = readerEvent.target.result
    image.className = "uploadedImage";
    imageHolder.appendChild(image);
    imageSection.appendChild(imageHolder);
    uploadedImages.prepend(imageSection);
    uploadToCloudant(doc, imageSection);
  }
}

function uploadToCloudant(doc, dom) {
  console.log(doc)
  console.log(cloudantURL.origin)
  $.ajax({
    url: cloudantURL.origin + "/" + imageDatabase,
    type: "POST",
    data: JSON.stringify(doc),
    headers: {
      "Authorization": "Basic " + btoa(cloudantURL.username + ":" + cloudantURL.password)
    },
    dataType: 'json',
    contentType: 'application/json',
    success: function (data) {

      // get tags from cloudant
      // add 1.5s delay to give time for serverless function to execute
      setTimeout(function () {
        getDocumentWithId(data.id, dom, 0);
      }, 1500);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
      console.log(textStatus);
      console.log(jqXHR);
    }
  });
}

function getDocumentWithId(id, dom, tries) {
  $.ajax({
    url: cloudantURL.origin + "/" + tagsDatabase + "/" + id,
    type: "GET",
    headers: {
      "Authorization": "Basic " + btoa(cloudantURL.username + ":" + cloudantURL.password)
    },
    success: function (data) {
      displayTags(data, dom)
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
      console.log(textStatus);
      console.log(jqXHR);
      if (tries + 1 < 20) {

        // try again in 3 seconds
        setTimeout(function () {
          getDocumentWithId(id, dom, tries + 1)
        }, 3000);
      } else {
        console.log("No document found after 20 tries")
      }
    }
  });
}

function displayTags(data, dom) {
  dom.id = data._id;
  var tags = document.createElement('div');
  tags.className = "imageLabels";
  for (var index in data.watsonResults[0].classes) {
    var tag = document.createElement('div');
    tag.className = "imageLabel";
    tag.innerHTML = data.watsonResults[0].classes[index].class
    tags.appendChild(tag);
  }
  dom.appendChild(tags)
}

form.onsubmit = function () {
  uploadImage()
  return false;
}

// getDocumentWithId("0724dabd80bc2102e8e5e1f9fdbb3a60",0);
