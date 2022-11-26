const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require('cors');

// Connect to the MongoDB
const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_USER_PASS}@cluster01.rhyj5nw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// middleware
app.use(cors());
app.use(express.json());

async function run () {

    const TMDB = client.db('thrift-motors');
    const brandOfTM = TMDB.collection('brand');
    const allPostedDataOfTM = TMDB.collection('postedData');
    const allUsersDataOfTM = TMDB.collection('usersInfo');
    const allBookedDataOfTM = TMDB.collection('bookedCar');
    const allPostBackup = TMDB.collection('backupPost');

    // Root Path Response Welcome Message
    app.get('/',(req,res)=>{
        res.send('YAY! Welcome THRIFT-MOTORS API');
    })

    // get all brand by id
    app.get('/all-brand',async(req,res)=>{
        const query = {};
        const result = await brandOfTM.find(query).toArray();
        res.send(result)
    })

    // get posted data by catetory name/'id'
    app.get('/category/:id',async(req,res)=>{
        const reqParams = req.params;
        const filter = {serviceId: reqParams.id};
        const result = await allPostedDataOfTM.find(filter).toArray();
        res.send(result);
    })

    // store user account information
    app.post(`/userinfo`,async(req,res)=>{
        const reqBody = req.body;
        delete reqBody.password;
        delete reqBody.confirmPassword;
        const result = await allUsersDataOfTM.insertOne(req.body);
        res.send(result)
    })

    // get user information by id
    app.get('/userinfo',async(req,res)=>{
        const query = {userEmail: req.query.email};
        const result = await allUsersDataOfTM.findOne(query);
        res.send(result)
    })

    // store all bookedCar data
    app.post('/bookedCar',async(req,res)=>{
        const reqBody = req.body;
        const backup = await allPsotBackup.insertOne(reqBody);
        const result = await allBookedDataOfTM.insertOne(reqBody);
        res.send(result)
    })

    // store new product post
    app.post('/new-post',async(req,res)=>{
        const reqBody = req.body;
        const backup = await allPostBackup.insertOne(reqBody);
        const result = await allPostedDataOfTM.insertOne(reqBody);
        res.send(result)
    })

}

run().catch(console.dir)

app.listen(port,()=>console.log('this api is running on',port))
