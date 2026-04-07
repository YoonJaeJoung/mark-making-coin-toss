# short guideline
this website is about tourists' coin toss inside the fountain and making wishes.

use vanilla js, html, css for this project.

i will then upload this project to the github pages.

# website flow
the user will come in and choose between practice and actual coin toss.

the practice is just choosing fountains and tossing the coin. there will be no data saved.

the actual coin toss will save the data to the database. the data will be the fountain name, the coin's final location, user's name, the date, and the wish.

# coin tossing process
coin tossing process is same for practice and actual. 

first, the user will see a list of fountains. the user can choose a fountain. 

second, the user will choose the coin - US coin, Euro coin, chinese coin, or korean coin.

then, the user's fake hand will appear in the screen with the selected coin. then the web will use the webcam to detect the user's hand, and show the status - hand detected, ready to toss or not detected.

when user moves his hand up, the coin will go up and fly to the fountain.

the coin should land further if the user moved the hand fast, and closer if the user slowly moved the hand up.

if not practice, the final location of the coin will be saved to the database.

# actual coin toss flow
the user will come in and write down their nickname, and the wish. they can also choose to select if they wish will be visible. if not - then only the nickname will be saved. if yes - then the nickname and the wish will be saved.

then the user starts the coin tossing process. 

# fountain view
the fountain will show the previously tossed coin in their location.

# fountain list
trevi fountain, Palseokdam basin for now