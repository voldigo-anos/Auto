// modal
var modal = document.querySelector('.octo_modal');
var modal2 = document.querySelector('.octo_as');

// button to open
var btn = document.querySelector('.open-modal');
var btn2 = document.querySelector('.open-appstategetter');

//
var span = document.querySelector('.octo_close');
var div = document.querySelector('.octo_as_close');

// open
btn.onclick = function() {
  modal.style.display = "block";
}
btn2.onclick = function() {
  modal2.style.display = "block";
}

// click Close
span.onclick = function() {
  modal.style.display = "none";
}
div.onclick = function() {
  modal2.style.display = "none";
}