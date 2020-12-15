# travelProject1

This is the PROJ-207 Term 1 Threaded Project Assignment for Group 1:
Sheyi Adepoju, Susan Trinh, Eric Biondic, and Jeff Boyd.

After an initial npm install, the server can be run from the root
project directory with the script npm run start.

In order to run the website as we have been during development,
a few prerequisites are required:

1. The server uses Redis to cache session data for the login feature.
In addition to the node module added with npm install, the computer
running the server will need to download redis for windows and use
it as a service. This can be done by simply going to
https://github.com/microsoftarchive/redis/releases/tag/win-3.0.504
and downloading the .msi file provided there.

2. We updated the database to include another table (web_credentials),
as well as updated the packages table so that it contained packages
in the future (such that the render of the package page only shows
upcoming packages). We've provided an export of this updated database,
which we've named travelexpertsGroup1. We have now set up the code 
to run using this database name and not travelexperts. All that is
needed is to import the sql file in the root directory here, making 
sure not to enable foreign ref checks on import.

3. Database connection credentials are stored in the .env file in the
root project folder. Should you import the tables and have different
user credentials, they can simply be updated there.

We hope that you enjoy the results of our combined efforts!


