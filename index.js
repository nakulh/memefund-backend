//const express = require('express');
import express from 'express';
//const cors = require('cors');
import cors from 'cors';
//const morgan = require('morgan');
import morgan from 'morgan';
//const bodyParser = require('body-parser');
import bodyParser from 'body-parser';
//const tokenDeploy = require('./sui/tokenDeploy.js');
import {deployNewToken} from './sui/tokenDeploy.js';
import {getComments, storeComment} from './accessors/db.js';
import {uploadImage} from './accessors/s3.js';

const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(morgan('combined'));
app.use(bodyParser.json({limit: '2mb', type: 'application/json'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/newCoin', (req, res) => {
    const name = req.body.name;
    const ticker = req.body.ticker.toUpperCase();
    const description = req.body.description;
    const liquidityToken = req.body.liquidityToken;
    const imageBase64 = req.body.imageBase64;

    const twitter = req.body.twitter;
    const telegram = req.body.telegram;
    const website = req.body.website;
    const ret = { objectChanges: [{
      type: 'created',
      sender: '0xe7bb50477ef081136732edb486e06f35b35df9286ca3322d197be248e7eec2eb',
      owner: {  },
      objectType: '0x4c09944e8c9d7add91fb86fdc37b5dbe7f39953eac715dc8ea29cc650b8c0b4e::pool::Pool<0x2::sui::SUI, 0x73b9972e63b00265e7f38e422d37ee4a44eec22b5c80a153bac79b8b16439567::FUD::FUD>',
      objectId: '0xd276d0ef34f3f35776a2603c503f0d8907e58ad5ea16f2a4d0572948debb65c3',
      version: '35489213',
      digest: '854cAi1LUtXye2h7TrrRnjQtDUmrzSTfYXa8nAHcbtJg'
    }] };
    res.status(200).json(ret);
    /*uploadImage(imageBase64).then(({ Location, Key }) => {
      console.log(Location, Key);
      deployNewToken(150_000_000 * 1_000_000_000, name, ticker, description, Location).then(({ objectChanges, balanceChanges }) => {
        console.log(`${ticker} created`);
        console.log(objectChanges);
        res.status(200).json({objectChanges});
      }).catch((err) => {
          console.log(err);
      });
    }).catch((err) => {
      console.log(err);
      res.status(504).json({status: 504});;
    });*/
})

app.get('/comments/:poolId', (req, res) => {
  console.log("Getting comments for poolId " + req.params.poolId);
  getComments(req.params.poolId).then((data) => {
    res.json(data.Items);
  }).catch((err) => {
    console.error(err);
    res.status(504).json({status: 504});;
  })
})

app.put('/newComment', (req, res) => {
  storeComment(req.body.poolId, req.body.comment, req.body.walletId).then(() => {
    console.log("Comment stored");
    res.status(200).json({status: 200});;
  }).catch((err) => {
    console.error(err);
    res.status(504).json({status: 504});;
  })
})

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
