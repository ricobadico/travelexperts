you need to run `npm install` on this branch.
you need to edit the `.env` file with your mysql credentials
or edit the getConnection function with your password ""
all pages are tempated

/views/layouts/main.handlebars has everthing exluding the body

/view/ has each pages body layout with the navbar inserted as `partial`

/views/partials/ holds the parital snippets

I cheated and just added the pages relevent js and some css to the top of the body.
Just to get it working, Handlebars doesnt have full featured layout inheritence model 
You have to do some work to dynamically insert js and css links into the main layout per page.

On the contacts page the width of the contacts containers is messed up.  

please `git log` to see more details of my commits as I went along.
