

// Add event listeners for voting buttons

var carouselEl = $('.carousel');
var carouselItems = carouselEl.find('.item');
var activeItem = carouselItems.siblings('.active')
var upVoteButton = $(activeItem).find(".upVoteButton")
var downVoteButton = $(activeItem).find(".downVoteButton")


// execute when the DOM is fully loaded
$(function() {
  
  listenToVoteButtons();
  
  carouselEl.carousel().on('slid.bs.carousel', function (event) {
    listenToVoteButtons();
  });
    
});

function listenToVoteButtons() {
    activeItem = carouselItems.siblings('.active')
    upVoteButton = $(activeItem).find(".upVoteButton")
    downVoteButton = $(activeItem).find(".downVoteButton")

    // allow users to add Nature Strip to MONSA
    upVoteButton.click(function(){
          var params = {id: upVoteButton.val()};
          $.get(Flask.url_for("upVoteButton"), params).done(function() {
              upVoteButton.text("Thankyou").css('background','#8ec252');
              setTimeout(function(){
                upVoteButton.text("Upvote this Nature Strip").css('background','#4d90fe');
              }, 1000);
              document.location = Flask.url_for("reloadGallery", params);
          });
      });
  
    downVoteButton.click(function(){
          console.log("clicked")
          var params = {id: downVoteButton.val()};
          $.get(Flask.url_for("downVoteButton"), params).done(function() {
              downVoteButton.text("Thankyou").css('background','#8ec252');
              setTimeout(function(){
                downVoteButton.text("Downvote this Nature Strip").css('background','#4d90fe');
              }, 1000);
              document.location = Flask.url_for("reloadGallery", params);
          });
      });
  }
