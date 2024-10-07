<!-- .md means markdown -->

<!-- README.md -->
<!-- This file documents the information about the portfolio project. -->
<!-- It should be READ ME first!!! -->

<!-- Heading level 1 -->
# BELLS-TEST-4
**(SCTP) Full Stack Developer**

Module 6: **Datacentric Development**

***Project Assignment - Portfolio***

<!-- Heading level 3 -->
### Project File Structure:

* JavaScript Files

>>> Employees NoSQL-Database System
: 

* BELLS-TEST-4 Folder (Sources Root)
: index.js
: .env
: gitignore
: README.md
: package.json
: package-lock.json

* IMG Folder (images)
: Screenshot npm-init-y.png
: Screenshot npm-install-1.png
: Screenshot npm-install-2.png
: eds-database.png
: eds-search-employee-supervisor-name.png
: POST-Create.png
: GET-Read.png
: PUT-Update.png
: DELETE-Delete.png
: jwt-users.png
: jwt-login.png
: jwt-profile.png
: jwt-DELETE.png
: wo-jwt-DELETE.png

* JSON Folder (json)
: q6-employees.md
: employee.json
: contact.json
: supervisor.json
: taskforce.json


<!-- Heading level 1 -->
# Project Guide
For the purpose of the portfolio project, a RESTful-API-driven datacentric application is created for the following:

```json
{
1. "CRUD Datacentric Application via HTTP-methods" : in our case "Employees NoSQL-Database System"
}
```

This project is about a simple *Employees NoSQL-Database System (EDS)* at **BELLS** using the concepts we learned in the Recipes Book System Express/MongoDB lab. Instead of managing a database of recipes, we'll be managing a database of employees in a company.

POST => C = Create: adding new data to the database   
GET => R = Read: get existing information   
PUT => U = Update: update existing information in the database   
DELETE => D = Delete: remove existing information from the database

Using MongoDB to store our database:

- company-xyz : represents the entire company database\
employee collection: represents the documents related to employees\
contact collection: represents the documents related to contact\
supervisor collection: represents the documents related to supervisor\
taskforce collection: represents the documents related to taskforce 


The application of this project caters to the needs of a specific target user group, the company executives,
who are looking for a datacentric system to query the employees' particulars and their links to supervisor and taskforce.

The application provides a one-stop entry point to the database management of employees information, namely:

***
employee (Basic Info)
1. *employee_id*
2. *name*
3. *designation*
4. *department*
5. *contact* [
6. *_id*,
7. *office_phone*,
8. *office_did*,
9. *company_email* ]
10. *date_joined*
11. *supervisor* [
12. *employee_id*,
13. *name* ]
***

***
contact (Supplementary Info)
1. *_id*
2. *address1*
3. *address2*
4. *address3*
5. *mobile_phone*
6. *home_phone*
7. *office_phone*
8. *office_did*
9. *personal_email*
10. *company_email*
***

***
supervisor (Additional Info)
1. *employee_id*
2. *supervisor name*
3. *review report* [
4. *employee_id*,
5. *name*,
6. *rank* ]

***

***
taskforce (Additional Info)
1. *_id*
2. *members* [
3. *employee_id,*
4. *name,*
5. *role* ]
***

This simple software is a RESTful API application for Employees NoSQL-Database System.

It provides URI endpoints for access using HTTP methods (like GET, POST, PUT and DELETE) to obtain the data from MongoDB NoSQL database system.


![Employees NoSQL-Database System: MongoDB database](img/eds-database.png "database")

![Employees NoSQL-Database System: GET](img/eds-search-employee-supervisor-name.png "Query String => Search Engine")

![Employees NoSQL-Database System: POST](img/POST-Create.png "POST => Create")

![Employees NoSQL-Database System: GET](img/GET-Read.png "GET => Read")

![Employees NoSQL-Database System: PUT](img/PUT-Update.png "PUT => Update")

![Employees NoSQL-Database System: DELETE](img/DELETE-Delete.png "DELETE => Delete")


It also has a simple authorization security implemented using JSON Web Token (JWT).

![Employees NoSQL-Database System: JWT-USER REGISTRATION](img/jwt-users.png "JWT /users")

![Employees NoSQL-Database System: JWT-LOGIN -> accessToken](img/jwt-login.png "JWT /login")

![Employees NoSQL-Database System: JWT-PROFILE OVERVIEW](img/jwt-profile.png "JWT /profile")

![Employees NoSQL-Database System: DELETE with accessToken](img/jwt-DELETE.png "DELETE with accessToken")

![Employees NoSQL-Database System: DELETE without accessToken](img/wo-jwt-DELETE.png "DELETE without accessToken")


<!-- Heading level 4 -->
#### The source codes is hosted as public on a [GitHub] [1] repository and the link is as follows: 

- [Source Codes GitHub Link](https://www.github.com/ngys9919/bells-test-4 "My source-codes!")
: Click the hyperlink <https://www.github.com/ngys9919/bells-test-4>

- [RESTful API GitPod Link](https://ngys9919-bellstest4-ow3nfwhphp2.ws-us116.gitpod.io/ "My RESTful API endpoints!")
: Click the hyperlink <https://ngys9919-bellstest4-ow3nfwhphp2.ws-us116.gitpod.io/>


<!-- Heading level 2 -->
## Features

<!-- Heading level 3 -->
### Existing Features



<!-- Heading level 3 -->
### Future Implementation
The application could expand to include Front-End Development and new features like Dynamic Web Rendering using HandleBars (hbs) of Express, and Enhanced Security with Refresh Token in the Employees NoSQL-Database System.

<!-- Heading level 2 -->
## Testing
For testing of POST, PATCH, PUT and DELETE routes, we will need to use a REST client. There
are a number of REST clients available for us to use, such as Postman, Insomnia etc. However,
a simpler alternative is to use the Advanced Rest Client (or ARC for short).

1. Using Test-Cases\
   1.1  



<!-- Heading level 2 -->
## Credits

### Acknowledgements
Thanks to Bells for support!

<!-- Heading level 2 -->
## About
> This project work, part of **Module 6: Datacentric Development**, 
> is an individual assessment done by Candidate’s Name (as in NRIC): **Ng Yew Seng** (Candidate’s NRIC: **S XXXX 3 5 3 / F**), 
> a trainee under the **(SCTP) Full Stack Developer** course, organized by **Bells Institute of Higher Learning**. 

>>
>> Coder: ***Ng Yew Seng***\
>> © Copyright 2024\
>> Bells Institute of Higher Learning


<!-- Heading level 2 -->
## Technologies Used
- [x] GitPod Cloud-hosted IDE
- [x] mongodb: enables connecting to database
- [x] node/npm: create the Node application with node package manager for installing packages
- [x] express: creates a HTTP server
- [x] cors: enables cross origin resources sharing
- [x] dotenv: stores sensitive information in a .env file
- [x] bcrypt: allows the hash of our password
- [x] jsonwebtoken: create a JWT (JSON Web Token) for access control to protected resources


<!-- Heading level 2 -->
## References
1.  [GitPod](https://gitpod.io)

2.  [Microsoft GitHub](https://www.github.com)

3.  [Bells Institute of Higher Learning](https://bells.sg)

<!-- hyperlinks -->
[1]: https://github.com "GitHub"