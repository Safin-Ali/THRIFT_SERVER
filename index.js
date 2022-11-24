const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require('cors');

// Connect to the MongoDB
const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_USER_PASS}@cluster01.rhyj5nw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// middleware
app.use(cors());
app.use(express());

async function run () {

    const TMDB = client.db('thrift-motors');
    const brandOfTM = TMDB.collection('brand');

    // Root Path Response Welcome Message
    app.get('/',(req,res)=>{
        res.send('YAY! Welcome THRIFT-MOTORS API');
    })

    // get all sell post of toyota cars 
    app.get('/all-brand',async(req,res)=>{
        const query = {};
        const result = await brandOfTM.find(query).toArray();
        res.send(result)
    })
}

run().catch(console.dir)

app.listen(port,()=>console.log('this api is running on',port))
