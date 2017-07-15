

// Add event listener for upvote button

// execute when the DOM is fully loaded
$(function() {
  // allow users to add Nature Strip to MONSA
  $("#upVoteButton1").click(function(){
        console.log("click1");
    
        $.get(Flask.url_for("upVoteButton"), 0).done(function() {

            $("#upVoteButton1").text("Thankyou").css('background','#8ec252');
            
            setTimeout(function(){
              $("#upVoteButton1").text("Add this Nature Strip to MONSA Gallery").css('background','#C0C0C0');
            }, 1000);
        });
    });

  $("#upVoteButton2").click(function(){
          console.log("click2");
    
        $.get(Flask.url_for("upVoteButton"), '1').done(function() {
            
            $("#upVoteButton2").text("Thankyou").css('background','#8ec252');
            
            setTimeout(function(){
              $("#upVoteButton2").text("Add this Nature Strip to MONSA Gallery").css('background','#C0C0C0');
            }, 1000);
        });
    });

  
  
});

