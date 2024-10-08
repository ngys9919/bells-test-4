// 1. SETUP EXPRESS
const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const port = 3000;
const dbname = "company_xyz"; // CHANGE THIS TO YOUR ACTUAL DATABASE NAME

// List of HTTP status codes Implemented
const statusCode_200_OK = 200;
const statusCode_201_Created = 201;
const statusCode_400_Bad_Request = 400;
const statusCode_401_Unauthorized = 401;
const statusCode_403_Forbidden = 403;
const statusCode_404_Not_Found = 404;
const statusCode_500_Internal_Server_Error = 500;

// enable dotenv (allow Express application to read .env files)
require('dotenv').config();

// set the mongoUri to be MONGO_URI from the .env file
// make sure to read data from process.env AFTER `require('dotenv').config()`
const mongoUri = process.env.MONGO_URI;

// Generate Secret Key

// First, in your .env file, add in this:

// TOKEN_SECRET=<secret>

// Get a token secret from any source you like (such as https://www.randomkeygen.com),
// or use the following code to generate one yourself.

// In www.randomkeygen.com, use the following key type:
// 256-bit WEP Keys
// For example: CEAC79DE7ADC48743264F11F5A622

// About RandomKeygen
// Our free mobile-friendly tool offers a variety of randomly generated keys and
// passwords you can use to secure any application, service or device. 
// Simply click to copy a password or press the 'Generate' button for an entirely new set.

// Password Recommendations
// Your online passwords should always be between 8-12 characters long (more is always better) 
// and should always include a combination of letters (both upper and lowercase), digits and symbols. 
// And, don't forget to change your passwords regularly.

// Put the following code into a file named generateSecret.js and
// run it with node generateSecret.js. 

// Copy the output and replace <secret> in the .env file.

// const crypto = require('crypto');
// const secret = crypto.randomBytes(64).toString('hex');
// console.log(secret);

// function to generate an access token
function generateAccessToken(id, email) {
    // set the payload of the JWT (i.e, developers can add any data they want)
    let payload = {
        'user_id': id,
        'email': email,
    }

    // JWT stands for “JSON Web Token”, and it is a method of granting access to protected
    // resources. For instance, you may have certain routes that only verified users are able to access.
    // JWT can meet this requirement.

    // create the JWT
    // jwt.sign()
    // - parameter 1: the payload (sometimes known as 'claims')
    // - parameter 2: token secret,
    // - parameter 3: options (to set expiresIn)
    let token = jwt.sign(payload, process.env.TOKEN_SECRET, {
        'expiresIn': '1h' // h for hour, d for days, m is for minutes and s is for seconds
    });

    return token;
}

// Middlewares are functions that have access to the request object (req), the response object
// (res), and the next middleware function in the application’s request-response cycle. These
// functions can execute any code, make changes to the request and the response objects, end
// the request-response cycle, and call the next middleware function in the stack.

// middleware: a function that executes before a route function
function verifyToken(req, res, next) {
    // get the JWT from the headers
    let authHeader = req.headers['authorization'];
    let token = null;
    if (authHeader) {
        // the token will be stored as in the header as:
        // BEARER <JWT TOKEN>
        // authHeader[0] is BEARER whilst authHeader[1] is <JWT TOKEN>.
        token = authHeader.split(' ')[1];
        if (token) {
            // the callback function in the third parameter will be called after
            // the token has been verified
            jwt.verify(token, process.env.TOKEN_SECRET, function (err, payload) {
                if (err) {
                    console.error(err);
                    return res.sendStatus(statusCode_403_Forbidden);
                }
                // save the payload into the request
                req.user = payload;
                // call the next middleware or the route function
                next();

            })
        } else {
            return res.sendStatus(statusCode_403_Forbidden);
        }
    } else {
        return res.sendStatus(statusCode_403_Forbidden);
    }
}


// 1a. create the app
const app = express();
app.use(cors()); // enable cross origin resources sharing

// 1b. enable JSON processing (i.e allow clients to send JSON data to our server)
app.use(express.json());


// You can add as many middleware functions to your application as you like.
// They are executed in the order that they are added.

// This middleware function logs the HTTP method and URL of each request. 
// The next() function is called to pass control to the next middleware function.
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// This middleware function logs the response status code.
// The next() function is called to pass control to the next middleware function.
app.use((req, res, next) => {
    console.log(`Response status: ${res.statusCode}`);
    next();
});

// How MongoDB Stores Data

// MongoDB stores data in BSON documents. 
// BSON is a binary representation of JSON (JavaScript Object Notation) documents. 
// When you read MongoDB documentation, you'll frequently see the term "document," 
// but you can think of a document as simply a JavaScript object.

// SQL refers a record, or document as it is called in MongoDB. 
// For those coming from the SQL world, you can think of a document as being roughly equivalent to a row.

// MongoDB stores groups of documents in collections. 
// For those with a SQL background, you can think of a collection as being roughly equivalent to a table.

// Every document is required to have a field named _id. 
// The value of _id must be unique for each document in a collection, is immutable, and can be of any type other than an array. 
// MongoDB will automatically create an index on _id. 
// You can choose to make the value of _id meaningful (rather than a somewhat random ObjectId) 
// if you have a unique value for each document that you'd like to be able to quickly search.


// uri = connection string
async function connect(uri, dbname) {
    // Create a Mongo Client
    // a client is a software or driver that allows us to communicate with a database
    // (i.e like the Mongo Shell)
    let client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    });
    let db = client.db(dbname); // same as  'USE <database>' in Mongo Shell
    return db;
}

// Syntax:

// Method-1:
// database.collection(collectionName).findOne(query, function(err, document) {
    // if (err) throw err;
    // console.log(document);
// });

// Method-2:
// const document = await client.db(dbname).collection(collectionName).findOne(query);
// if (!document) {
    // return res.status(statusCode).json({
        // "error": "Document not found"
    // })
// }

// Here:

// database: MongoDB database connection object.
// collectionName: Name of the collection for querying documents.
// query: Query object with criteria for finding the document.
// function(err, document): Callback function with “err” that captures any error and
// “document” that contains the selected document.

// const cursor = client.db(dbname).collection(collectionName).find(
	// {
	    // bedrooms: { $gte: minimumNumberOfBedrooms },
	    // bathrooms: { $gte: minimumNumberOfBathrooms }
	// }
	// ).sort({ last_review: -1 })
	// .limit(maximumNumberOfResults);
// const results = await cursor.toArray();

// The query above will return a Cursor. A Cursor allows traversal over the result set of a query.
// You can also use Cursor's functions to modify what documents are included in the results. 

// 2. CREATE ROUTES
// All routes will be created in the `main` function
async function main() {

    // connect to the mongo database
    let db = await connect(mongoUri, dbname);

    console.log("Mongo Database connected!");

    app.get('/', function (req, res) {
        
        // The 'res' response to the client can only sent once.
        // Cannot set headers after they are sent to the client.

        res.json({
            "title": "RESTful API with Mongo and Express!",
            "/": "root route",
            "route implemented": "<http method>, <access control>",
            "/taskforce": "GET",
            "/supervisor": "GET",
            "/contact": "GET",
            "/employee": "GET",
            "/employee/:id": "GET",
            "/employee": "POST",
            "/employee/:id/contact/:contactId/supervisor/:supervisorId": "PUT",
            "/employee/:id": "DELETE, PROTECTED",
            "/users": "POST",
            "/login": "POST",
            "/profile": "GET, PROTECTED",
        });

        // send back a response using the 'res' object using html format
        // res.send("Hello World");

        // send back a response using the 'res' object using JSON format
        // res.json({ "message":"Hello World!" });
    });

    // There's a convention for RESTFul API when it comes to writing the URL
    // The URL should function like a file path  (always a resource, a noun)
    // Allow the user to search by name, tags, cuisine, ingredients:
    // eg
    // ?name=chicken%20rice
    // ?tags=appetizer&ingredients=chicken,duck

    // Search Engine
    // The /taskforce route can perform searches using members.
    // The /supervisor route can perform searches using name.
    // The /contact route has no search.
    // The /employee route can perform searches using name and supervisor and combined.

    // The client will specify the search criteria via query strings.

    // Now, you can test this route with various query parameters. 
            
    // This implementation allows for flexible searching across your database. 
    // Users can combine different search criteria to find exactly what they're looking for.

    // Here are some examples:

    // Search by members: https://<server url>/taskforce?members=Alex%20CHUA
    // Search by members: https://<server url>/taskforce?members=Alex%20CHUA,JON tan
    // Search by members: https://<server url>/taskforce?members=Alex%20CHUA,JON tan,Kow

    app.get("/taskforce", async function (req, res) {
        try {

            // this is the same as let members = req.query.members
            // syntax: object destructuring
            let { members } = req.query;

            console.log(members);

            let criteria = {};
            let criteria2 = "";
            let criteria3 = "/JoN/i";

            // input: GET /taskforce?members=Alex,JoN
            // criteria =
            // { 'members.name': { '$in': [ /Alex/i, /JoN/i ] } }
            // if (members) {
                // criteria["members.name"] = {
                    // "$in": members.split(",").map(function (i) {
                        // case-insensitive search
                        // return new RegExp(i, 'i');
                    // })
                // }
            // }

            // input: GET /taskforce?members=Alex,JoN
            // criteria =
            // [ /Alex/i, /JoN/i ] => this is not valid for $regexMatch becaues it only recognises one /pattern/ only
            
            // input: GET /taskforce?members=JoN
            // criteria =
            // /JoN/i => this is valid for $regexMatch becaues it only recognises one /pattern/ only

            // input: GET /taskforce?members=Alex Chua
            // criteria2 =
            // Alex Chua => this is valid for criteria becaues it only recognises string only
            if (members) {
                criteria = 
                    members.split(",").map(function (i) {
                        // case-insensitive search
                        return new RegExp(i, 'i');
                    }).toString();

                criteria2 = members.toString();

                criteria3 = criteria3.toString();
            }

            // Example                                 Result
            // { $literal: { $add: [ 2, 3 ] } }        { "$add" : [ 2, 3 ] }
            // { $literal: { $literal: 1 } }           { "$literal" : 1 }

            // $regexMatch needs 'regex' to be of type string or regex
            // regex: /^A/       => uses $regexMatch to filter for items that have a name value that starts with A
            // regex: /n$/       => uses $regexMatch to filter for items that have a name value that ends with n
            // regex: /JoN/i     => uses $regexMatch to filter for items that have a name value that is case-insensitive for JoN

            console.log(criteria);
            console.log();
            // console.log(members.name); // TypeError: Cannot read properties of undefined (reading 'name')
            console.log(criteria2);
            console.log();
            console.log(criteria3);

            let maximumNumberOfResults = 3;

            // The find() method returns a FindCursor that manages the results of your query. 
            // You can iterate through the matching documents using one of the following cursor methods:

            // next()
            // toArray()
            // forEach()

            // If no documents match the query, find() returns an empty cursor

            // $unwind will ‘explode’ your array elements into separate documents. 
            
            // If you are using the aggregation pipeline, 
            // there is a separate $filter stage that filters arrays to given conditions.

            // Project Specific Array Elements in the Returned Array

            // For fields that contain arrays, MongoDB provides the following projection operators 
            // for manipulating arrays: 
            
            // $elemMatch
            // $slice
            // $

            // $elemMatch, $slice, and $ are the only operators that you can use to project 
            // specific elements to include in the returned array. 
            
            // For instance, you cannot project specific array elements using the array index; 
            // e.g. { "instock.0": 1 } projection does not project the array with the first element.

            // Query for a Document Nested in an Array

            // Equality matches on the whole embedded/nested document require an exact match 
            // of the specified document, including the field order. 
            

            // $filter (aggregation)

            // Definition: $filter
            // Selects a subset of an array to return based on the specified condition. 
            // Returns an array with only those elements that match the condition. 
            // The returned elements are in the original order.

            // Syntax
            // $filter has the following syntax:

            // {
                // $filter:
                        // {
                            // input: <array>,
                            // as: <string>,
                            // cond: <expression>,
                            // limit: <number expression>
                        // }
            // }
            
            const cursor = db.collection('taskforce').aggregate( [
                {
                    $project: {
                      members: {
                         $filter: {
                            input: "$members",
                            as: "member",
                            // Filter Based on Number Comparison
                            // cond: { $gte: [ "$$member.employee_id", 100 ] }
                            // Filter Based on String Equality Match
                            // cond: { $eq: [ "$$member.role", "member"] }
                            // Filter Based on Regular Expression Match
                            // cond: { $regexMatch: { input: "$$member.name", regex: /Alex/i }}
                            // cond: { $regexMatch: { input: "$$member.name", regex: /JoN/i }}
                            // cond: { $regexMatch: { input: "$$member.name", regex: /^A/ }}
                            //cond: { $regexMatch: { input: "$$member.name", regex: criteria2 }}
                            
                            // Filter Based on Multiple Expressions (enclosed in 1 x [])
                            // An object representing an expression must have exactly one field
                            // cond: {"$or" : [
                                        // { "$eq" : [ "$$member.employee_id", 1142 ] },
                                        // { "$eq" : [ "$$member.name", "Andrew Ng" ] }, 
                                        // { $gte: [ "$$member.employee_id", 100 ] },
                                    // {$regexMatch: { input: "$$member.name", regex: /n$/ }}]}


                            // How can I use a regex variable in a query for MongoDB

                            // var search = 'Joe';
                            // db.users.find(name: new RegExp(search)) //For substring search, case sensitive. 
                            // db.users.find(name: new RegExp('^' + search + '$')) //For exact search, case sensitive
                            // db.users.find(name: new RegExp(search， ‘i')) //For substring search, case insensitive
                            // db.users.find(name: new RegExp('^' +search + '$', 'i')); //For exact search, case insensitive

                            // You need to create a regular expression object from the string 
                            // using the RegExp constructor as the /.../ syntax is only for use with literals.
                            
                            // var randnum = Math.floor((Math.random() * 10) + 1);
                            // var alpha = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','X','Y','Z'];
                            // var randletter = alpha[Math.floor(Math.random() * alpha.length)];
                            // var val = randletter + randnum + '.*;

                            // var val = randletter + ".*" + randnum + ".*";
                            // var stream = collection.find({"FirstName": new RegExp(val)}).stream();

                            // Firstname is just a string of letters and numbers.
                            
                            // var val = randletter + randnum + '.*'; 
                            // var stream = collection.find({"FirstName": {$regex:val}}).stream(); 

                            // I tried it a couple of times it always returned an empty set. 
                            // The other version var stream = collection.find({"FirstName": new RegExp(val)}).stream(); worked.
                            
                            // let pattern = '/^\/'+ cat + '/';
                            // collection.find({name: new RegExp(pattern)});
                            // Remove the / characters from pattern and it will work. 

                            // Use the following code to use dynamic value in regex with or operations
                            // { $match: { $or: [{ 'title': { $regex:  request.query.val, $options: 'i'} }, { 'skills_required': { $regex:  request.query.val, $options: 'i'} }] }},
                            
                            // If you want to use the variable val as a parameter of the query part, you can use $regex, for example:

                            // collection.find({"FirstName": {$regex:val}})

                            // It is not allowed to put $regex in $in operator according to the manual.

                            // If you want to put regular expression object in $in operator, 
                            // you have to use JavaScript regular expression object, 
                            // for example:

                            // collection.find({"FirstName": {$in: [/abc/, /123/]}})

                            // By the way, val in /val/ is constant string, not the variable as you defined above.


                            // If your regex includes a variable, make sure to escape it.

                            // function escapeRegExp(string) {
                                // return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
                            // }

                            // This can be used like this

                            // new RegExp(escapeRegExp(searchString), 'i')

                            // Or in a mongoDb query like this

                            // { '$regex': escapeRegExp(searchString) }

                            // let q = '^' + query;
                            // return await User.find({ name: { $regex: q, $options: 'i' } }).select('name').limit(10);

                            
                            cond: { $regexMatch: { input: "$$member.name", regex: criteria2 }}        
                            
                         }
                      }
                   }
                }
            ] );

            // In the first stage using the $match operator, we get only the document we need and
            // then we add the $project stage. Inside this stage, we project all the fields we need and, 
            // through the $filter operator, we tell the database which fields inside the array we want to project, too.

            // The $filter operator has three variables:
            // input: the array we are going to work with
            // as: reference name
            // cond: our requirements

            const cursor3 = db.collection('taskforce').aggregate( [
                {
                    "$match" : { // Match documents that have employee_id > 22
                        "members" : {
                              "$gt" : { "employee_id" : 22 }
                        }
                    }

                    // Match documents that satisfy these conditions
                    // "$match" : {
                        // "members" : {
                        //    "$elemMatch" : {
                            //   "$and" : [
                                //  { "employee_id" : 1003 },
                                //  { "name" : "Alex Chua" }
                            //   ]
                        //    }
                        // },
                    // }
                },
                {
                    $project:{ // Project documents by further filter with employee_id > 995 in this format
                        _id: 0,
                        members: {
                            "$filter" : {
                                "input" : "$members",
                                "as" : "member",
                                "cond" : { "$gt" : [ "$$member.employee_id", 995 ] }
                            }
                        }
                    }

                    // Project documents in this format
                    // "$project" : {
                        // "_id" : 1,
                        // "members" : {
                        //    "$filter" : {
                            //   "input" : "$members",
                            //   "as" : "member",
                            //   "cond" : {
                                //  "$and" : [
                                    // { "$eq" : [ "$$member.employee_id", 1003 ] },
                                    // { "$eq" : [ "$$member.name", "Alex Chua" ] }
                                //  ]
                            //   }
                        //    }
                        // }
                    // }
                }
            ] );


            const cursor2 = db.collection('taskforce').aggregate( [
                {
                    // $gt (aggregation)
                    
                    // $gt has the following syntax:

                    // { $gt: [ <expression1>, <expression2> ] }
                    
                    // Compares two values and returns:

                    // true when the first value is greater than the second value.
                    // false when the first value is less than or equal to the second value.

                    // The $gt compares both value and type, 
                    // using the specified BSON comparison order for values of different types.

                    $project: {
                        _id: 0,
                        members: 1,
                        employee_id_gt_1: { $gt: [ "$members.employee_id", 1 ] }, //true since all employee_id is greater than 1
                        employee_id_gt_22: { $gt: [ "$employee_id", 22 ] }, //false since only some employee_id is greater than 22
                        supervised_list: {
                            // $let only supports an object as its argument
                            $let: {
                            // vars: { employee: 1, high: "$employee_id" },
                            // in: { $gt: [ "$$employee", "$$high" ] } // "supervised_list": true
                            // vars: { employee: 1, high: "$employee_id" },
                            // in: { $gt: [ "$$high", "$$employee" ] } // "supervised_list": false
                            vars: { employee: 1, high: "$employee" },
                            in: { $eq: [ "$$employee", "$$high" ] } // "supervised_list": false
                            } 
                        }
                     }

                    // A sales collection has the following documents:

                    // { _id: 1, price: 10, tax: 0.50, applyDiscount: true }
                    // { _id: 2, price: 10, tax: 0.25, applyDiscount: false }

                    // The following aggregation uses $let in the $project pipeline stage
                    // to calculate and return the finalTotal for each document:
                    
                    // The aggregation returns the following results:

                    // { "_id" : 1, "finalTotal" : 9.450000000000001 }
                    // { "_id" : 2, "finalTotal" : 10.25 }
                    
                    // $project: {
                        // finalTotal: {
                        //    $let: {
                            //   vars: {
                                //  total: { $add: [ '$price', '$tax' ] },
                                //  discounted: { $cond: { if: '$applyDiscount', then: 0.9, else: 1 } }
                            //   },
                            //   in: { $multiply: [ "$$total", "$$discounted" ] }
                        //    }
                        // }
                    //  }



                    // $project: {
                        //  "role" : "$members.role",
                        // $in requires an array as a second argument
                        // "member": { $in: [ "A", members[0] ]},             
                    // }
                }
            ] );

            // mongo shell: db.taskforce.find({},{members.name:1, members.role:1})
            // const cursor = db.collection('taskforce').find( 
                // find all docs where test contains element with name A
                // { members: { $elemMatch: { name: 'A' } } })
                // { members: { $elemMatch: { employee_id: 1003, name: "Alex Chua", role: "secretary" } } }) //v1 correct version, display 1 element
                // { members: { $elemMatch: { employee_id: { $gte: 1 }, name: { $regex: '^A' }, role: { $regex: '^m' } } }}) //v2 correct version, display 1 element
                // project the marches docs so only the test array is returned, 
                // and only the elements where name is A
                // .project( { members: { $elemMatch: { name: 'A' } } }
                // .project( { members: { $elemMatch:  { employee_id: 1003, name: "Alex Chua", role: "secretary" } } } //v1 correct version, display 1 element
                // .project( { members: { $elemMatch:  { employee_id: { $gte: 1 }, name: { $regex: '^A' }, role: { $regex: '^m' } } } } //v2 correct version, display 1 element
            // );
            // const cursor = db.collection('taskforce').find( { name: 'Alex Chua', $or: [{name: 'Jon'}, {role : { $regex: '^m' }}]} );
            // const cursor = db.collection('taskforce').find({ name: 'Alex Chua', role: 'secretary'}).project({"members.name": 1, "members.role": 1});
            // const cursor = db.collection('taskforce').find( { members: { employee_id: 1003, name: "Alex Chua", role: "secretary" } }).project({"members.name": 1, "members.role": 1}); //v3 correct version, display all elements (note: field and order must match)
            // const cursor = db.collection('taskforce').find( { "members.name": "Alex Chua", "members.role": "secretary"} ); //v4 correct version, display all elements (note: order and field not important)
            // const cursor = db.collection('taskforce').find( { members: { name: 'Alex Chua', role: 'secretary' } }).project({"name": 1, "role": 1});
            // const cursor = db.collection('taskforce').find({ "members.name": { $in: ["Alex Chua"] } });
            // const cursor = db.collection("taskforce").find({"members": {"$elemMatch": {'members':'Alex Chua'}}});
            // const cursor = db.collection("taskforce").find(criteria)
                // .project({
                    // { projection: { _id: 0 } }, // to exclude the _id field, you must set its value to 0
                    // _id:0, // to exclude the _id field, you must set its value to 0
                    // "taskforce.members.name": 1,
                    // "taskforce.members.role": 1
                // }).sort({ "taskforce.members.name": -1 })
                // .limit(maximumNumberOfResults);
            const taskforce = await cursor3.toArray();


            // I have an array that dynamically holds document id's, 
            // in which I need to query another collcetion in mongo to see if the id's match. 
            
            // I have this code:
            
            // let collection = database.collection('login')

            // let doc = await collection.find({ email: req.session.username }).toArray()

            // let array_of_docs_bought = []
            // for (var i = 0; i < doc.length; i++) {
                // array_of_docs_bought.push(...doc[i].list_of_docs_bought)
            // }

            // let documents = await database.collection('documents').find({ "id": { $in: array_of_docs_bought } }).toArray()

            // This would be done via the 'spread operator': ...
            // Spread syntax requires ...iterable[Symbol.iterator] to be a function

            // taskforce[i].name is not iterable (cannot read property undefined)

            // let array_taskforce_members = [];
            // for (var i = 0; i < taskforce.length; i++) {
                // delete taskforce[i]._id; // to remove _id simply add this delete
                // array_taskforce_members.push(taskforce[i].name);
            // }

            // let documents = await database.collection('documents')
                // .find({ "id": { $in: array_taskforce_members } })
                // .toArray();
            
            // res.json({
                // array_taskforce_members
            // })

            // res.json({
                // 'taskforce': taskforce
            // })

            res.json({
                taskforce
            })
        } catch (error) {
            console.error("Error fetching taskforce record:", error);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })

    // Search by name: https://<server url>/supervisor?name=jon%20tan
    
    app.get("/supervisor", async function (req, res) {
        try {

            // this is the same as let name = req.query.name;
            // syntax: object destructuring
            let { name } = req.query;

            let criteria = {};

            if (name) {
                criteria["name"] = {
                    "$regex": name, "$options": "i"
                }
            }

            // mongo shell: db.supervisor.find({},{name:1, review_report.name:1, review_report.rank:1})
            let supervisor = await db.collection("supervisor").find(criteria)
                .project({
                    "name": 1,
                    "review_report.name": 1,
                    "review_report.rank": 1
                }).toArray();
            res.json({
                'supervisor': supervisor
            })
        } catch (error) {
            console.error("Error fetching supervisor record:", error);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })

    // No Search for contact

    app.get("/contact", async function (req, res) {
        try {

            let criteria = {};

            // mongo shell: db.contact.find({},{address1:1, address2:1, address3:1, mobile_phone:1, home_phone:1, personal_email:1})
            contact = await db.collection("contact").find(criteria)
                .project({
                    "address1": 1,
                    "address2": 1,
                    "address3": 1,
                    "mobile_phone": 1,
                    "home_phone": 1,
                    "personal_email": 1

                }).toArray();
            res.json({
                contact
            })
        } catch (error) {
            console.error("Error fetching contact record:", error);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })


    // Search by supervisor: https://<server url>/employee?supervisor=JON%20tan
    // Search by name: https://<server url>/employee?name=jon tan
    // Combine multiple search criteria: https://<server url>/employee?supervisor=JON%20tan&name=Tan

    //GET => Read

    // Find One
    // To select data from a collection in MongoDB, we can use the findOne() method.

    // findOne({}, function(err, result))
    // The findOne() method returns the first occurrence in the selection.

    // The first parameter of the findOne() method is a query object. 
    // In this example we use an empty query object, which selects all documents in a collection 
    // (but returns only the first document).

    // Find All
    // To select data from a table in MongoDB, we can also use the find() method.
    
    // find({}).toArray(function(err, result))

    // The find() method returns all occurrences in the selection.
    // The first parameter of the find() method is a query object. 
    // In this example we use an empty query object, which selects all documents in the collection.

    // Find Some

    // find({}, { projection: { _id: 0, name: 1, address: 1 } }).toArray(function(err, result))

    // The second parameter of the find() method is the projection object that describes which fields to include in the result.
    // This parameter is optional, and if omitted, all fields will be included in the result.

    // You are not allowed to specify both 0 and 1 values in the same object 
    // (except if one of the fields is the _id field).
    // If you specify a field with the value 0, all other fields get the value 1, and vice versa.

    // To exclude the _id field, you must set its value to 0.

    // The result can be converted into an array containing each document as an object.
    // To return e.g. the address of the third document, just refer to the third array object's address property, that is, using dot notation.
    
    // Return the address of the third document:
    // console.log(result[2].address);

    // Filter the Result

    // When finding documents in a collection, you can filter the result by using a query object.
    // The first argument of the find() method is a query object, and is used to limit the search.

    // Filter With Regular Expressions

    // You can write regular expressions to find exactly what you are searching for.
    // Regular expressions can only be used to query strings.

    // To find only the documents where the "address" field starts with the letter "S", 
    // use the regular expression /^S/:

    // var MongoClient = require('mongodb').MongoClient;
    // var url = "mongodb://localhost:27017/";
    
    // MongoClient.connect(url, function(err, db) {
    //   if (err) throw err;
    //   var dbo = db.db("mydb");
    //   var query = { address: /^S/ };
    //   dbo.collection("customers").find(query).toArray(function(err, result) {
        // if (err) throw err;
        // console.log(result);
        // db.close();
    //   });
    // });
    
    // Sort the Result

    // Use the sort() method to sort the result in ascending or descending order.
    // The sort() method takes one parameter, an object defining the sorting order.

    // Sort the result alphabetically by name if value is 1.
    // Use the value -1 in the sort object to sort descending.

    // { name: 1 } // ascending for name
    // { name: -1 } // descending for name

    // var MongoClient = require('mongodb').MongoClient;
    // var url = "mongodb://localhost:27017/";
    
    // MongoClient.connect(url, function(err, db) {
    //   if (err) throw err;
    //   var dbo = db.db("mydb");
    //   var mysort = { name: 1 };
    //   dbo.collection("customers").find().sort(mysort).toArray(function(err, result) {
        // if (err) throw err;
        // console.log(result);
        // db.close();
    //   });
    // });

    // For findOne() result:

    // if (result) {
        // console.log(`Found a listing in the collection with the name '${nameOfListing}':`);
        // console.log(result);
    // } else {
        // console.log(`No listings found with the name '${nameOfListing}'`);
    // }

    // For find() result:

    // if (results.length > 0) {
        // console.log(`Found listing(s) with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms:`);
        // results.forEach((result, i) => {
            // date = new Date(result.last_review).toDateString();
            // console.log();
            // console.log(`${i + 1}. name: ${result.name}`);
            // console.log(`   _id: ${result._id}`);
            // console.log(`   bedrooms: ${result.bedrooms}`);
            // console.log(`   bathrooms: ${result.bathrooms}`);
            // console.log(`   most recent review date: ${new Date(result.last_review).toDateString()}`);
        // });
    // } else {
        // console.log(`No listings found with at least ${minimumNumberOfBedrooms} bedrooms and ${minimumNumberOfBathrooms} bathrooms`);
    // }

    // For find(criteria, projection) only:

    // 1st parameter-criteria
    // Example: Find all documents where the Key1 is Value1 and Key2 is Value2
        // "Key1": "Value1",
        // "Key2": "Value2"

    // 2nd parameter-projection
    // Example: Show all documents but only their Key1, Key2, Key3
    // with the following option:
    // 1 means enabled => display
        // 'Key1': 1,
        // 'Key2': 1,
        // 'Key3': 1

    // In Node/JavaScript:

    // let criteria = {};

    // criteria["name"] = {
        // "$regex": name, "$options": "i"
    // }

    // db.collection(collectionName).find(criteria)
            // .project({
            // 'Key1': 1,
            // 'Key2': 1,
            // 'Key3': 1
            // }).toArray();

    // In MongoDB Atlas/Compass/Mongo Shell:

    // db.collectionName.find({
        // "Key1": "Value1",
        // "Key2": "Value2"
    // }, {
        // 'Key1': 1,
        // 'Key2': 1,
        // 'Key3': 1        
    // })

    // app.get("/employee", verifyToken, async function (req, res) {
    app.get("/employee", async function (req, res) {
        try {

            // this is the same as follows:
            // let supervisor = req.query.supervisor;
            // let name = req.query.name;
            // syntax: object destructuring
            let { supervisor, name } = req.query;

            let criteria = {};

            if (supervisor) {
                criteria["supervisor.name"] = {
                    "$regex": supervisor, "$options": "i"
                }
            }

            if (name) {
                criteria["name"] = {
                    "$regex": name, "$options": "i"
                }
            }

            // mongo shell: db.employee.find({},{name:1, employee_id:1, designation:1, contact:1, supervisor:1})
            let employee = await db.collection("employee").find(criteria)
                .project({
                    "name": 1,
                    "employee_id": 1,
                    "designation": 1,
                    "contact": 1,
                    "supervisor": 1
                }).toArray();
            res.json({
                'employee': employee
            })
        } catch (error) {
            console.error("Error fetching employee record:", error);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })

    // /employee/66fe4e9fcb3d836d2346b510 => get the details of the employee with _id = 66fe4e9fcb3d836d2346b510
    app.get("/employee/:id", async function (req, res) {
        try {

            // get the id of the employee that we want to get full details of
            let id = req.params.id;

            // mongo shell: db.employee.find({
            //   _id:ObjectId(id)
            //  })
            let employee = await db.collection('employee').findOne({
                "_id": new ObjectId(id)
            });

            // check the recipe is not null
            // because .findOne will return null if no document
            // not found
            if (!employee) {
                return res.status(statusCode_404_Not_Found).json({
                    "error": "Employee not found"
                })
            }

            // send back a response
            res.json({
                'employee': employee
            })

        } catch (error) {
            console.error("Error fetching employee:", error);
            res.status(statusCode_500_Internal_Server_Error);
        }
    });

    // we use app.post for HTTP METHOD POST - usually to add new data

    // POST => Create

    // Insert Document
    // To insert a record, or document as it is called in MongoDB, into a collection, we use the insertOne() method.
    
    // insertOne(newDocument, function(err, res))

    // The first parameter of the insertOne() method is an object containing the
    // name(s) and value(s) of each field in the document you want to insert.
    // It also takes a callback function where you can work with any errors, or the result of the insertion.
    
    // Create Multiple Documents

    // Sometimes you will want to insert more than one document at a time. 
    // You could choose to repeatedly call insertOne(). 
    // The problem is that, depending on how you've structured your code, 
    // you may end up waiting for each insert operation to return before beginning the next, resulting in slow code.
    // Instead, you can choose to call Collection's insertMany(). 
    // insertMany() will insert an array of documents into your collection.

    // One important option to note for insertMany() is ordered. 
    
    // If ordered is set to true, the documents will be inserted in the order given in the array. 
    // If any of the inserts fail (for example, if you attempt to insert a document with an _id 
    // that is already being used by another document in the collection), 
    // the remaining documents will not be inserted. 
    
    // If ordered is set to false, the documents may not be inserted in the order given in the array. 
    // MongoDB will attempt to insert all of the documents in the given array—regardless of 
    // whether any of the other inserts fail. By default, ordered is set to true.
    
    // console.log(`${result.insertedCount} new listing(s) created with the following id(s):`);
    // console.log(result.insertedIds); 

    app.post("/employee", async function (req, res) {
    // app.post("/employee", verifyToken, async function (req, res) {
        try {

            // name, employee_id, designation, department, contact, date_joined and supervisor
            // when we use POST, PATCH or PUT to send data to the server, the data are in req.body
            let { employee_id, name, designation, department, contact, date_joined, supervisor } = req.body;

            // basic validation: 
            // make sure that name and employee_id must be present
            if ((!name) || (!employee_id)) {
                return res.status(statusCode_400_Bad_Request)
                    .json({ "error": "The field(s) is incomplete:\
                        employee_id, name, designation, department, contact, date_joined, supervisor" })
            }

            let supervisorDocument = {};
            let rank = null;

            if (supervisor === null) {
                supervisorDocument = null;
            } else {
                // find the _id of the related and add it to the supervisor
                supervisorDocument = await db.collection('supervisor').findOne({
                    "name": supervisor.name
                })

                if (!supervisorDocument) {
                    // res.json({ "message": "New supervisor" })
                }


                // Create the new supervisor object
                const newSupervisorDocument = {
                    // _id: new ObjectId(),
                    employee_id: Number(employee_id),
                    name,
                    rank
                };

                supervisorDocument = {
                    employee_id: Number(supervisor.employee_id),
                    name: supervisor.name
                };

                const query = {
                    // "_id": new ObjectId(supervisorId),
                    name: supervisor.name,
                    "review_report": 
                        { "$elemMatch": {
                                "employee_id": employee_id
                            }
                        }
                    }                
                // const query = { "_id": new ObjectId(supervisorId) };
                // const update = { $set: updatedSupervisorDocument };
                // const updateArrayDocument = {
                    // $set: { "review_report.$[i].rank":rank }
                // };
                // const options = { upsert: true };
                const options = {};
                // const options = {
                    // arrayFilters: [
                    //   {
                        // "i.employee_id": employee_id
                        // "i.item": { $not: { $regex: "oil" } },
                    //   }
                    // ]
                //   };

                // Existing supervisor, but old record, need to update old one
                // In review_report, use set to update object the new info
                const updateArrayDocument = {
                    $set: {
                        // _id: new ObjectId(supervisorId),
                        employee_id: Number(supervisor.employee_id),
                        name: supervisor.name,
                        "review_report.$": {employee_id: Number(employee_id),
                        name,
                        rank }
                    }
                };

                // Existing supervisor, but new record, need to add new one
                // In review_report, use push object to array to append to the document
                const pushArrayDocument = {
                    $push: {
                        "review_report": {employee_id: Number(employee_id),
                        name,
                        rank }
                    }
                };

                // New supervisor, need to create new document
                // Hence, need everything, that is, supervisor info and its supervised employee
                // In review_report, use array to start new one
                // The Operators -> Update -> Fields -> $set must not be here because we are using insertOne
                const newArrayDocument = {
                        // _id: new ObjectId(supervisorId),
                        employee_id: Number(supervisor.employee_id),
                        name: supervisor.name,
                        "review_report": [{employee_id: Number(employee_id),
                        name,
                        rank }]
                };

                // If existing record, index will be found, hence positional operator $ will work and update that record
                // Use $set to update to the supervisor collection
                // let result = await db.collection("supervisor").updateOne(query, update, options);

                // Execute the update operation with updateOne(query, newDocument, options) for supervisor collection
                let result = await db.collection("supervisor").updateOne(query, updateArrayDocument, options);

                
                if (result.matchedCount === 0) {
                    // No match (not existing record), hence no index, positional operator $ cant work to update
                    // New record, need push to add to the array end
                    // Use $push to push to the supervisor collection

                    // Execute the update operation with updateOne(query, newDocument, options) for supervisor collection
                    result = await db.collection("supervisor").updateOne({name: supervisor.name}, pushArrayDocument, options);
                }

                if (result.matchedCount === 0) {
                    // If still no matchedCount, meaning no result in updateNpush to the supervisor collection
                    // Must be new supervisor
                    // res.json({ 'message': 'Supervisor not found! New supervisor' });
                    // Execute the insert operation with insertOne(document, function(err, res)) for supervisor collection
                    result = await db.collection("supervisor").insertOne(newArrayDocument);

                    // res.json({
                        // 'message': 'New supervisor has been created',
                        // 'supervisorId': newArrayDocument._id
                    // });
                }

                // res.status(statusCode_201_Created).json({
                // 'message': 'Supervisor added successfully',
                // 'supervisorId': updatedSupervisorDocument.supervisor_id
                // });


                // }

                let address1 = contact.address1;
                let address2 = contact.address2;
                let address3 = contact.address3;
                let mobile_phone = contact.mobile_phone;
                let home_phone = contact.home_phone;
                let office_phone = contact.office_phone;
                let office_did = contact.office_did;
                let personal_email = contact.personal_email;
                let company_email = contact.company_email;

                // find all the tags that the client want to attach to the employee document
                // const contactDocument = await db.collection('contact').findOne({
                // "name": supervisor.name
                // })

                // if (!contactDocument) {
                // return res.status(statusCode_400_Bad_Request)
                //      .json({"error":"Invalid contact"})
                // }

                const newContactId = new ObjectId();
                // Create the new contact object
                const newContactDocument = {
                    _id: newContactId,
                    address1,
                    address2,
                    address3,
                    mobile_phone,
                    home_phone,
                    office_phone,
                    office_did,
                    personal_email,
                    company_email
                };

                // Add the new contact
                // insert the new contact document into the collection
                // Execute the insert operation with insertOne(document, function(err, res)) for contact collection
                let result3 = await db.collection("contact").insertOne(newContactDocument);


                if (result3.matchedCount === 0) {
                    return res.status(statusCode_404_Not_Found).json({ error: 'Contact not found' });
                }

                // res.json({
                    // 'message': 'New contact has been created',
                    // 'contactId': newContactDocument._id
                // });


                const contactDocument = {
                    _id: newContactDocument._id,
                    office_phone,
                    office_did,
                    company_email
                };

                let newEmployeeDocument = {
                    employee_id: Number(employee_id),
                    name,
                    designation, department,
                    "contact": contactDocument,
                    date_joined,
                    "supervisor": supervisorDocument
                }

                // insert the new employee document into the collection
                // Execute the insert operation with insertOne(document, function(err, res)) for employee collection
                let result2 = await db.collection("employee").insertOne(newEmployeeDocument);
                res.status(statusCode_201_Created).json({
                    'message': 'New employee has been created',
                    'employeeId': result2.insertedId // insertedId is the _id of the new document
                })
            }

        } catch (e) {
            console.error(e);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })

    //PUT => Update by replace

    // Update Document
    // You can update a record, or document as it is called in MongoDB, by using the updateOne() method.
    
    // updateOne(query, newDocument, function(err, res))
    // updateOne(query, newDocument, options)

    // The first parameter of the updateOne() method is a query object defining which document to update.
    // Note: If the query finds more than one record, only the first occurrence is updated.
    // The second parameter is an object defining the new values of the document.

    // Upsert One Document

    // One of the options you can choose to pass to updateOne() is upsert. 
    // Upsert is a handy feature that allows you to update a document if it exists 
    // or insert a document if it does not.

    // This is done by passing {upsert: true} in the options param for updateOne().

    // async function upsertListingByName(client, nameOfListing, updatedListing) {
        // const result = await client.db("sample_airbnb").collection("listingsAndReviews")
                            // .updateOne({ name: nameOfListing }, 
                                    //    { $set: updatedListing }, 
                                    //    { upsert: true });
        // console.log(`${result.matchedCount} document(s) matched the query criteria.`);
        // if (result.upsertedCount > 0) {
            // console.log(`One document was inserted with the id ${result.upsertedId._id}`);
        // } else {
            // console.log(`${result.modifiedCount} document(s) was/were updated.`);
        // }
    // }

    // Update Multiple Documents

    // Sometimes you'll want to update more than one document at a time. 
    // In this case, you can use Collection's updateMany(). 
    // Like updateOne(), updateMany() requires that you pass a filter of type object and an update of type object. 
    // You can choose to include options of type object as well.

    // console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    // console.log(`${result.modifiedCount} document(s) was/were updated.`);

    // options

    // options using upsert
    // const query = { name: "Deli Llama" };
    // const update = { $set: { name: "Deli Llama", address: "3 Nassau St" }};
    // const options = { upsert: true };
    // myColl.updateOne(query, update, options);

    // options using arrayFilters
    // const query = {"locations.areas.area_id": 159}; 
    // const update = { $set:{"locations.$[loc].areas.$[are].is_active":false }}; 
    // const options = { arrayFilters: [{ "loc.id": 618 }, { "are.area_id": 159 }] };
    // myColl.updateMany(query, update, options);

    app.put("/employee/:id/contact/:contactId/supervisor/:supervisorId", async function (req, res) {
    // app.put("/employee/:id/contact/:contactId/supervisor/:supervisorId", verifyToken, async function (req, res) {
        try {

            let id = req.params.id;
            let contactId = req.params.contactId;
            let supervisorId = req.params.supervisorId;

            // employee_id, name, designation, department, contact, date_joined, supervisor
            // when we use POST, PATCH or PUT to send data to the server, the data are in req.body
            let { employee_id, name, designation, department, contact, date_joined, supervisor } = req.body;

            // basic validation: 
            // make sure that name and employee_id is valid
            if ((!name) || (!employee_id)) {
                return res.status(statusCode_400_Bad_Request)
                    .json({ "error": "The field(s) is incomplete:\
                        employee_id, name, designation, department, contact, date_joined, supervisor" })
            }

            let supervisorDocument = {};
            let rank = supervisor.rank;

            if (supervisor === null) {
                supervisorDocument = null;
            } else {
                // find the _id of the related and add it to the supervisor
                supervisorDocument = await db.collection('supervisor').findOne({
                    "name": supervisor.name
                });

                if (!supervisorDocument) {
                    return res.status(statusCode_400_Bad_Request)
                        .json({ "error": "Invalid supervisor" })
                }

                // const supervisorIdDB = supervisorDocument._id;


                // Update the new supervisor object
                // const updatedSupervisorDocument = {
                    // employee_id: Number(supervisor.employee_id),
                    // name: supervisor.name,
                    // "review_report": [{employee_id: Number(employee_id),
                    // name,
                    // rank }]
                // };

                supervisorDocument = {
                    employee_id: Number(supervisor.employee_id),
                    name: supervisor.name
                };


                // let result = await db.collection("supervisor")
                    // .updateOne({
                        // "_id": new ObjectId(supervisorId)
                    // }, {
                        // "$set": updatedSupervisorDocument
                    // });

                const query = {
                    // "_id": new ObjectId(supervisorId),
                    name: supervisor.name,
                    "review_report": 
                        { "$elemMatch": {
                                "employee_id": employee_id
                            }
                        }
                    }                
                // const query = { "_id": new ObjectId(supervisorId) };
                // const update = { $set: updatedSupervisorDocument };
                // const updateArrayDocument = {
                    // $set: { "review_report.$[i].rank":rank }
                // };
                // const options = { upsert: true };
                const options = {};
                // const options = {
                    // arrayFilters: [
                    //   {
                        // "i.employee_id": employee_id
                        // "i.item": { $not: { $regex: "oil" } },
                    //   }
                    // ]
                //   };

                // Existing supervisor, but old record, need to update old one
                // In review_report, use set to update object the new info
                const updateArrayDocument = {
                    $set: {
                        // _id: new ObjectId(supervisorId),
                        employee_id: Number(supervisor.employee_id),
                        name: supervisor.name,
                        "review_report.$": {employee_id: Number(employee_id),
                        name,
                        rank }
                    }
                };

                // Existing supervisor, but new record, need to add new one
                // In review_report, use push object to array to append to the document
                const pushArrayDocument = {
                    $push: {
                        "review_report": {employee_id: Number(employee_id),
                        name,
                        rank }
                    }
                };

                // New supervisor, need to create new document
                // Hence, need everything, that is, supervisor info and its supervised employee
                // In review_report, use array to start new one
                const newArrayDocument = {
                    $set: {
                        // _id: new ObjectId(supervisorId),
                        employee_id: Number(supervisor.employee_id),
                        name: supervisor.name,
                        "review_report": [{employee_id: Number(employee_id),
                        name,
                        rank }]
                    }
                };

                // If existing record, index will be found, hence positional operator $ will work and update that record
                // Use $set to update to the supervisor collection
                // let result = await db.collection("supervisor").updateOne(query, update, options);

                // Execute the update operation with updateOne(query, newDocument, options) for supervisor collection
                let result = await db.collection("supervisor").updateOne(query, updateArrayDocument, options);

                
                if (result.matchedCount === 0) {
                    // No match (not existing record), hence no index, positional operator $ cant work to update
                    // New record, need push to add to the array end
                    // Use $push to push to the supervisor collection

                    // Execute the update operation with updateOne(query, newDocument, options) for supervisor collection
                    result = await db.collection("supervisor").updateOne({name: supervisor.name}, pushArrayDocument, options);
                }

                if (result.matchedCount === 0) {
                    // If still no matchedCount, meaning no result in updateNpush to the supervisor collection
                    // Must be new supervisor
                    return res.status(statusCode_404_Not_Found).json({ error: 'Supervisor not found' });
                }

                // res.status(statusCode_201_Created).json({
                // 'message': 'Supervisor added successfully',
                // 'supervisorId': updatedSupervisorDocument.supervisor_id
                // });

                // }

                let address1 = contact.address1;
                let address2 = contact.address2;
                let address3 = contact.address3;
                let mobile_phone = contact.mobile_phone;
                let home_phone = contact.home_phone;
                let office_phone = contact.office_phone;
                let office_did = contact.office_did;
                let personal_email = contact.personal_email;
                let company_email = contact.company_email;

                // find all the tags that the client want to attach to the employee document
                let updatedContactDocument = await db.collection('contact').findOne({
                    _id: new ObjectId(contactId)
                })

                if (!updatedContactDocument) {
                    return res.status(statusCode_400_Bad_Request)
                        .json({ "error": "Invalid contact" })
                }

                // const newContactId = new ObjectId();
                // Update the new contact object
                updatedContactDocument = {
                    _id: new ObjectId(contactId),
                    address1,
                    address2,
                    address3,
                    mobile_phone,
                    home_phone,
                    office_phone,
                    office_did,
                    personal_email,
                    company_email
                };

                // Update the new contact
                // Update the new contact document into the collection
                // let result3 = await db.collection("contact").insertOne(newContactDocument);

                // Execute the update operation with updateOne(query, newDocument, function(err, res)) for contact collection
                let result3 = await db.collection("contact")
                    .updateOne({
                        "_id": new ObjectId(contactId)
                    }, {
                        "$set": updatedContactDocument
                    });


                if (result3.matchedCount === 0) {
                    return res.status(statusCode_404_Not_Found).json({ error: 'Contact not found' });
                }

                // res.status(statusCode_201_Created).json({
                // 'message': 'Contact added successfully',
                // 'contactId': updatedContactDocument._id
                // });


                const contactDocument = {
                    _id: updatedContactDocument._id,
                    office_phone,
                    office_did,
                    company_email
                };

                let updatedEmployeeDocument = {
                    employee_id: Number(employee_id),
                    name,
                    designation, department,
                    "contact": contactDocument,
                    date_joined,
                    "supervisor": supervisorDocument
                }



                // update the new employee document into the collection
                // Execute the update operation with updateOne(query, newDocument, function(err, res)) for employee collection
                let result2 = await db.collection("employee")
                    .updateOne({
                        "_id": new ObjectId(id)
                    }, {
                        "$set": updatedEmployeeDocument
                    });

                // if there is no matches, means no update took place
                if (result2.matchedCount == 0) {
                    return res.status(statusCode_404_Not_Found).json({
                        "error": "Employee not found"
                    })
                }

                res.status(statusCode_200_OK).json({
                    "message": "Employee updated"
                })
            }

        } catch (e) {
            console.error(e);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })


    //DELETE => Delete

    // Delete Document
    // To delete a record, or document as it is called in MongoDB, we use the deleteOne() method.

    // deleteOne(query, function(err, obj))

    // The first parameter of the deleteOne() method is a query object defining which document to delete.
    // Note: If the query finds more than one document, only the first occurrence is deleted.

    // Deleting Multiple Documents
    
    // Sometimes you'll want to delete more than one document at a time. 
    // In this case, you can use Collection's deleteMany(). 
    // Like deleteOne(), deleteMany() requires that you pass a filter of type object. 
    // You can choose to include options of type object as well.

    // console.log(`${result.deletedCount} document(s) was/were deleted.`);

    // app.delete("/employee/:id", async function (req, res) {
    app.delete("/employee/:id", verifyToken, async function (req, res) {
        try {
            let id = req.params.id;

            // mongo shell:
            // db.recipes.deleteOne({
            //    _id:ObjectId(id)
            //})
            // Execute the delete operation with deleteOne(query, function(err, obj)) for employee collection
            let results = await db.collection('employee').deleteOne({
                "_id": new ObjectId(id)
            });

            if (results.deletedCount == 0) {
                return res.status(statusCode_404_Not_Found).json({
                    "error": "Employee not found"
                });
            }

            res.json({
                "message": "Employee has been deleted successful"
            })

        } catch (e) {
            console.error(e);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })

    // route for user to sign up
    // the user must provide an email and password to register for accessToken
    app.post('/users', async function (req, res) {

        try {
            let { email, password } = req.body;
            if (!email || !password) {
                return res.status(statusCode_400_Bad_Request).json({
                    "error": "Please provide email and password"
                })
            }

            // if the request has both email and password
            let userDocument = {
                email,
                password: await bcrypt.hash(password, 12)
            };

            let result = await db.collection("users").insertOne(userDocument);

            res.json({
                "message": "New user account has been created",
                result
            })

        } catch (e) {
            console.error(e);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })


    // The client is supposed to provide the email and password in req.body using /users
    // By using /login, if the user has registered an account, the accessToken will be provided via this route
    app.post('/login', async function (req, res) {
        try {
            let { email, password } = req.body;
            if (!email || !password) {
                return res.status(statusCode_400_Bad_Request).json({
                    'message': 'Please provide email and password'
                })
            }

            // find the user by their email
            let user = await db.collection('users').findOne({
                "email": email
            });

            // if the user exists
            if (user) {
                // check the password (compare plaintext with the hashed one in the database)
                if (bcrypt.compareSync(password, user.password)) {
                    let accessToken = generateAccessToken(user._id, user.email);
                    res.json({
                        "accessToken": accessToken
                    })
                } else {
                    res.status(statusCode_401_Unauthorized);
                }
            } else {
                res.status(statusCode_401_Unauthorized);
            }

        } catch (e) {
            console.error(e);
            res.status(statusCode_500_Internal_Server_Error);
        }
    })

    // The /profile is a protected route, needs to verify accessToken.
    // It gives the details of the payload of the registered user account like:
    // "user_id" -> encrypted like "67029c190c4bd5ef5efe5152"
    // "email" -> listed in clear like "ngys9919@yahoo.com"
    // "iat" ->  "iSSUED at" claim like 1728225831
    // "exp" -> "expIRATION TIME" claim like 1728229431

    // Figure out how to determine the exact date and time which associated with the IAT value. 
    // I know it's based on milliseconds, but I cannot relate this back to a date. 
    // The official JWT specification says:(https://www.rfc-editor.org/rfc/rfc7519#page-10)

    // 4.1.6. "iat" (Issued At) Claim 
    // The "iat" (issued at) claim identifies the time at which the JWT was issued. 
    // This claim can be used to determine the age of the JWT. 
    // Its value MUST be a number containing a NumericDate value. 
    // Use of this claim is OPTIONAL.

    // 4.1.4.  "exp" (Expiration Time) Claim
    // The "exp" (expiration time) claim identifies the expiration time on
    // or after which the JWT MUST NOT be accepted for processing. 
    // The processing of the "exp" claim requires that the current date/time
    // MUST be before the expiration date/time listed in the "exp" claim.

    // For example:
    
    // "iat": 1479203274,
    // "exp": 1479205074,

    // You can build a date from a unix timestamp in milliseconds by doing

    // var date = new Date( timestamp )

    // So in your case, try doing :

    // var date = new Date( parseInt("1479203274") * 1000 )

    // The *1000 is to convert seconds to milliseconds. 
    // The parseInt is not necessary since javascript cast automatically the express to an number. 
    // It's just to make it cleared in intent.

    // These 2 statements are the same effect,
    // 1 using lambda expression whilst 1 using callback function:
    // app.get('/profile', verifyToken, async (req, res) => {
    app.get('/profile', verifyToken, async function (req, res) {

        // get the payload
        let user = req.user;

        // res.json({
            // user
        // })

        res.json({ message: 'This is a protected route', user });
    })

}

main();


// 3. START SERVER (Don't put any routes after this line)
// app.listen(3000, function () {
app.listen(port, function () {
    console.log("Server is running at port:" + port);
});



// The Internet Assigned Numbers Authority (IANA) maintains the official registry of HTTP status codes.

// All HTTP response status codes are separated into five classes or categories. 
// The first digit of the status code defines the class of response, 
// while the last two digits do not have any classifying or categorization role. 

// There are five classes defined by the standard:

// 1xx informational response – the request was received, continuing process
// 2xx successful – the request was successfully received, understood, and accepted
// 3xx redirection – further action needs to be taken in order to complete the request
// 4xx client error – the request contains bad syntax or cannot be fulfilled
// 5xx server error – the server failed to fulfil an apparently valid request

// HTTP status code

// 2xx successful:

// 1. 200 OK 
// Standard response for successful HTTP requests. 
// The actual response will depend on the request method used. 
// In a GET request, the response will contain an entity corresponding to the requested resource. 
// In a POST request, the response will contain an entity describing or containing the result of the action.

// 2. 201 Created
// The request has been fulfilled, resulting in the creation of a new resource.

// 3. 202 Accepted
// The request has been accepted for processing, but the processing has not been completed. 
// The request might or might not be eventually acted upon, and may be disallowed when processing occurs.

// 4xx client error

// 1. 400 Bad Request: This status code is returned when the server could not understand
// the request due to invalid syntax. In the context of our document, it is returned when
// required fields are missing in the request body.

// 2. 401 Unauthorized: This status code indicates that the request has not been applied
// because it lacks valid authentication credentials for the target resource. In our document,
// it is returned when the provided password does not match the one stored in the
// database.

// 3. 403 Forbidden: This status code means the client does not have access rights to the
// content; that is, it is unauthorized, so server is refusing to give the requested resource.
// Unlike 401, the client's identity is known to the server. Note: This status code is not used
// in the document.

// 4. 404 Not Found: The requested resource could not be found but may be available in the future. 
// Subsequent requests by the client are permissible.

// 5xx server error

// 1. 500 Internal Server Error
// A generic error message, given when an unexpected condition was encountered and 
// no more specific message is suitable.

// 2. 501 Not Implemented
// The server either does not recognize the request method, or it lacks the ability to fulfil the request. 
// Usually this implies future availability (e.g., a new feature of a web-service API).
